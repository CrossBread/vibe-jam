import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

import { createScheduler } from '../src/engine/scheduler'
import type { Services } from '../src/engine/services'
import { createEventBus } from '../src/engine/eventBus'
import { createModManager } from '../src/game/mods/manager'
import { setManualModRegistry } from '../src/game/mods/registry'
import type { GameMod } from '../src/game/mods/mod.types'

import IrelandArenaMod, {
  IrelandArenaStore,
  type IrelandArenaState,
} from '../src/game/mods/ireland/ireland.mod'
import BlackHoleArenaMod, {
  BlackHoleStore,
  type BlackHoleState,
} from '../src/game/mods/blackhole/blackhole.mod'

interface ComponentEntry<T> {
  store: unknown
  entityId: number
  data: T
}

describe('arena mods', () => {
  const mods: GameMod[] = [IrelandArenaMod, BlackHoleArenaMod]
  let services: Services
  let scheduler = createScheduler()
  let irelandComponent: ComponentEntry<IrelandArenaState> | null = null
  let blackHoleComponent: ComponentEntry<BlackHoleState> | null = null
  let world: {
    createEntity: ReturnType<typeof vi.fn>
    destroyEntity: ReturnType<typeof vi.fn>
    addComponent: ReturnType<typeof vi.fn>
  }

  function createServices(): Services {
    const bus = createEventBus()
    let rngValue = 0.123
    return {
      bus,
      rng: {
        next: vi.fn(() => {
          const current = rngValue
          rngValue = (rngValue + 0.347) % 1
          return current
        }),
      },
      clock: { now: vi.fn(() => 0) },
      physics: {},
    }
  }

  beforeEach(() => {
    scheduler = createScheduler()
    services = createServices()
    irelandComponent = null
    blackHoleComponent = null

    let nextEntityId = 1
    world = {
      createEntity: vi.fn(() => nextEntityId++),
      destroyEntity: vi.fn(),
      addComponent: vi.fn((entityId, store, data) => {
        if (store === IrelandArenaStore) {
          irelandComponent = { store, entityId, data }
        }
        if (store === BlackHoleStore) {
          blackHoleComponent = { store, entityId, data }
        }
      }),
    }

    setManualModRegistry(mods)
  })

  afterEach(() => {
    setManualModRegistry([])
  })

  it('generates wells for the ireland arena and regenerates on score', () => {
    const manager = createModManager(world, services, scheduler)
    manager.activate('mod.arena.ireland')

    expect(irelandComponent).not.toBeNull()
    const state = irelandComponent!.data

    expect(state.wells.length).toBeGreaterThan(0)
    const originalSnapshot = state.wells.map((well) => ({ ...well }))

    services.bus.emit({ type: 'score', side: 'left' })
    scheduler.tick(0)

    expect(state.wells.length).toBeGreaterThan(0)
    const updatedSnapshot = state.wells.map((well) => ({ ...well }))
    expect(updatedSnapshot).not.toEqual(originalSnapshot)

    services.bus.emit({ type: 'arena:resize', width: 1024, height: 640 })
    scheduler.tick(0)

    expect(state.width).toBe(1024)
    expect(state.height).toBe(640)
    for (const well of state.wells) {
      expect(well.x).toBeGreaterThanOrEqual(0)
      expect(well.y).toBeGreaterThanOrEqual(0)
      expect(well.x).toBeLessThanOrEqual(state.width)
      expect(well.y).toBeLessThanOrEqual(state.height)
    }

    manager.deactivate('mod.arena.ireland')
    expect(world.destroyEntity).toHaveBeenCalledWith(irelandComponent!.entityId)
  })

  it('centers the black hole well and conflicts with ireland', () => {
    const manager = createModManager(world, services, scheduler)
    manager.activate('mod.arena.ireland')

    expect(() => manager.activate('mod.arena.black-hole')).toThrow()

    manager.deactivate('mod.arena.ireland')
    manager.activate('mod.arena.black-hole')

    expect(blackHoleComponent).not.toBeNull()
    const state = blackHoleComponent!.data
    expect(state.well.x).toBeCloseTo(state.width * 0.5)
    expect(state.well.y).toBeCloseTo(state.height * 0.5)

    services.bus.emit({ type: 'arena:resize', width: 900, height: 600 })
    scheduler.tick(0)

    expect(state.width).toBe(900)
    expect(state.height).toBe(600)
    expect(state.well.x).toBeCloseTo(450)
    expect(state.well.y).toBeCloseTo(300)

    manager.deactivate('mod.arena.black-hole')
    expect(world.destroyEntity).toHaveBeenCalledWith(blackHoleComponent!.entityId)
  })
})
