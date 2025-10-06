// File: src/game/mods/manager.ts
// Runtime activation/deactivation with automatic teardown and conflict checks.
import { getAllMods } from './registry'
import type { GameMod, ModContext } from './mod.types'
import type { Scheduler, Phase, SystemFn } from '../../engine/scheduler'
import type { Services } from '../../engine/services'
import type { Unsubscribe } from '../../types/events'

export interface ModManager {
  all(): GameMod[]
  active(): string[]
  isActive(id: string): boolean
  activate(id: string): void
  deactivate(id: string): void
  toggle(id: string): void
}

type Teardown = Unsubscribe

interface ActiveMod {
  mod: GameMod
  ctx: ModContext
  teardowns: Teardown[]
}

export function createModManager(world: any, services: Services, scheduler: Scheduler): ModManager {
  const mods = new Map<string, GameMod>()
  for (const mod of getAllMods()) {
    mods.set(mod.id, mod)
  }

  const active = new Map<string, ActiveMod>()

  function createContext(): { ctx: ModContext; teardowns: Teardown[] } {
    const teardowns: Teardown[] = []

    function registerEvent<T extends Parameters<Services['bus']['on']>[0]>(
      type: T,
      handler: Parameters<Services['bus']['on']>[1]
    ): Unsubscribe {
      const unsubscribe = services.bus.on(type, handler as any)
      teardowns.push(unsubscribe)
      return unsubscribe
    }

    function registerSystem(phase: Phase, fn: SystemFn, order = 0): Unsubscribe {
      const unregister = scheduler.register(phase, fn, order)
      teardowns.push(unregister)
      return unregister
    }

    const ctx: ModContext = {
      services,
      createEntity: () => world.createEntity(),
      destroyEntity: (id) => world.destroyEntity(id),
      addComponent: (id, store, data) => world.addComponent(id, store, data),
      on: registerEvent,
      registerSystem
    }

    return { ctx, teardowns }
  }

  function ensureDependencies(mod: GameMod) {
    const missing = (mod.requires ?? []).filter((id) => !active.has(id))
    if (missing.length) {
      throw new Error(`Missing requirements for \`${mod.id}\`: ${missing.join(', ')}`)
    }

    const conflicts = (mod.conflictsWith ?? []).filter((id) => active.has(id))
    if (conflicts.length) {
      throw new Error(`Conflicts for \`${mod.id}\`: ${conflicts.join(', ')}`)
    }
  }

  function activate(id: string) {
    if (active.has(id)) return

    const mod = mods.get(id)
    if (!mod) {
      throw new Error(`Unknown mod: \`${id}\``)
    }

    ensureDependencies(mod)

    const { ctx, teardowns } = createContext()
    try {
      mod.enable(ctx)
    } catch (error) {
      for (let i = teardowns.length - 1; i >= 0; i--) {
        try {
          teardowns[i]()
        } catch {
          // ignore teardown errors during failed activation
        }
      }
      throw error
    }

    active.set(id, { mod, ctx, teardowns })
    services.bus.emit({ type: 'mod:activated', id })
  }

  function deactivate(id: string) {
    const entry = active.get(id)
    if (!entry) return

    active.delete(id)

    let error: unknown = undefined

    try {
      entry.mod.disable?.(entry.ctx)
    } catch (err) {
      error = err
    }

    for (let i = entry.teardowns.length - 1; i >= 0; i--) {
      try {
        entry.teardowns[i]()
      } catch (err) {
        error ??= err
      }
    }

    services.bus.emit({ type: 'mod:deactivated', id })

    if (error) {
      throw error
    }
  }

  return {
    all: () => [...mods.values()],
    active: () => [...active.keys()],
    isActive: (id) => active.has(id),
    activate,
    deactivate,
    toggle(id: string) {
      if (active.has(id)) {
        deactivate(id)
      } else {
        activate(id)
      }
    }
  }
}
