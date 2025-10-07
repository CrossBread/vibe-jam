import { createEventBus } from '../engine/eventBus'
import { createScheduler, type Scheduler } from '../engine/scheduler'
import type { Services } from '../engine/services'
import type { GameEvent } from '../types/events'
import { createModManager, type ModManager } from './mods/manager'
import type { GameMod } from './mods/mod.types'
import { createWorld, type World } from './world'

export interface GameRuntime {
  services: Services
  scheduler: Scheduler
  world: World
  mods: ModManager
}

type ToggleModFn = (id: string) => void

declare global {
  interface Window {
    vibe?: {
      toggleMod: ToggleModFn
      listMods: () => string[]
    }
  }
}

function createServices(): Services {
  const bus = createEventBus()

  return {
    bus,
    rng: {
      next: () => Math.random(),
    },
    clock: {
      now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
    },
    physics: {},
  }
}

function autoActivateDefaultMods(modManager: ModManager) {
  const mods = modManager
    .all()
    .slice()
    .sort((a, b) => {
      const orderDiff = (a.order ?? 0) - (b.order ?? 0)
      if (orderDiff !== 0) return orderDiff
      return a.id.localeCompare(b.id)
    })

  for (const mod of mods) {
    if (isMutator(mod)) continue
    try {
      modManager.activate(mod.id)
    } catch (error) {
      console.error(`Failed to auto-activate mod \`${mod.id}\``, error)
    }
  }
}

function isMutator(mod: GameMod): boolean {
  return (mod.tags ?? []).some((tag) => tag.toLowerCase() === 'mutator')
}

function exposeRuntimeControls(modManager: ModManager) {
  if (typeof window === 'undefined') return
  const existing = window.vibe ?? {}
  window.vibe = {
    ...existing,
    toggleMod: (id: string) => modManager.toggle(id),
    listMods: () => modManager.all().map((mod) => mod.id),
  }
}

export function bootstrapGame(): GameRuntime {
  const services = createServices()
  const scheduler = createScheduler()
  const world = createWorld()
  const mods = createModManager(world, services, scheduler)

  autoActivateDefaultMods(mods)
  exposeRuntimeControls(mods)

  return { services, scheduler, world, mods }
}

export type EmitTick = (event: Extract<GameEvent, { type: 'tick' }>) => void

export function createTickEmitter(runtime: GameRuntime): EmitTick {
  return (event) => {
    runtime.services.bus.emit(event)
    runtime.scheduler.tick(event.dt)
  }
}
