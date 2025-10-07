import { describe, it, expect, vi, beforeEach } from 'vitest'

import GiantPaddles from '../src/game/mods/giantpaddles/giantpaddles.mod'

vi.mock('../src/game/mods/registry', () => ({
  getAllMods: () => [GiantPaddles],
}))

import { createModManager } from '../src/game/mods/manager'
import { createScheduler } from '../src/engine/scheduler'
import { createEventBus } from '../src/engine/eventBus'
import type { Services } from '../src/engine/services'
import type { GameEvent } from '../src/types/events'

describe('mutator contract', () => {
  let services: Services
  let scheduler = createScheduler()
  const createdEntities: number[] = []
  const destroyedEntities: number[] = []
  let growthStates: Array<{ heightMultiplier: number; maxHeightMultiplier: number }>
  let world: {
    createEntity: ReturnType<typeof vi.fn>
    destroyEntity: ReturnType<typeof vi.fn>
    addComponent: ReturnType<typeof vi.fn>
  }
  let emittedEvents: GameEvent[]

  beforeEach(() => {
    scheduler = createScheduler()
    const bus = createEventBus()
    emittedEvents = []
    const originalEmit = bus.emit.bind(bus)
    bus.emit = ((event: GameEvent) => {
      emittedEvents.push(event)
      originalEmit(event)
    }) as typeof bus.emit

    services = {
      bus,
      rng: { next: vi.fn(() => 0.5) },
      clock: { now: vi.fn(() => 0) },
      physics: {},
    }

    createdEntities.length = 0
    destroyedEntities.length = 0
    growthStates = []

    let nextEntityId = 1

    world = {
      createEntity: vi.fn(() => {
        const id = nextEntityId++
        createdEntities.push(id)
        return id
      }),
      destroyEntity: vi.fn((id: number) => {
        destroyedEntities.push(id)
      }),
      addComponent: vi.fn((_id: number, _store: unknown, data: { heightMultiplier: number; maxHeightMultiplier: number }) => {
        growthStates.push(data)
      }),
    }

  })

  it('activates the giant paddles mutator and applies growth over ticks', () => {
    const manager = createModManager(world, services, scheduler)

    manager.activate('mod.giant-paddles')

    expect(emittedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'mod:activated', id: 'mod.giant-paddles' }),
      ]),
    )

    expect(createdEntities).toHaveLength(2)
    expect(growthStates).toHaveLength(2)
    expect(growthStates.every((state) => state.heightMultiplier === 1)).toBe(true)

    const dt = 2
    services.bus.emit({ type: 'tick', dt })
    scheduler.tick(dt)

    for (const state of growthStates) {
      expect(state.heightMultiplier).toBeCloseTo(2.35, 2)
      expect(state.heightMultiplier).toBeLessThanOrEqual(state.maxHeightMultiplier)
    }

    manager.deactivate('mod.giant-paddles')

    expect(destroyedEntities).toEqual(createdEntities)
    expect(emittedEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'mod:deactivated', id: 'mod.giant-paddles' }),
      ]),
    )
  })
})
