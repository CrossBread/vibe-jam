import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Scheduler } from '../src/engine/scheduler'
import type { Services } from '../src/engine/services'
import type { GameMod } from '../src/game/mods/mod.types'

const mods: GameMod[] = []

vi.mock('../src/game/mods/registry', () => ({
  getAllMods: () => mods
}))

import { createModManager } from '../src/game/mods/manager'

function createServices() {
  const busUnsubscribers: Array<ReturnType<typeof vi.fn>> = []
  const schedulerUnsubscribers: Array<ReturnType<typeof vi.fn>> = []

  const bus: Services['bus'] = {
    emit: vi.fn(),
    on: vi.fn((type, handler) => {
      const unsubscribe = vi.fn()
      busUnsubscribers.push(unsubscribe)
      // keep reference to handler to satisfy type system
      void handler
      return unsubscribe
    })
  }

  const scheduler: Scheduler = {
    register: vi.fn((_phase, _fn, _order = 0) => {
      const unregister = vi.fn()
      schedulerUnsubscribers.push(unregister)
      return unregister
    }),
    tick: vi.fn(),
    clear: vi.fn()
  }

  const services: Services = {
    bus,
    rng: { next: vi.fn(() => 0) },
    clock: { now: vi.fn(() => 0) },
    physics: {}
  }

  const world = {
    createEntity: vi.fn(() => 1),
    destroyEntity: vi.fn(),
    addComponent: vi.fn()
  }

  return { services, busUnsubscribers, scheduler, schedulerUnsubscribers, world }
}

describe('mod manager', () => {
  beforeEach(() => {
    mods.length = 0
    vi.clearAllMocks()
  })

  it('activates mods and tears them down on deactivate', () => {
    const { services, scheduler, world, busUnsubscribers, schedulerUnsubscribers } = createServices()

    const enable = vi.fn((ctx) => {
      ctx.on('tick', () => {})
      ctx.registerSystem('update', () => {})
      ctx.createEntity()
    })

    const disable = vi.fn()

    mods.push({
      id: 'test',
      enable,
      disable
    })

    const manager = createModManager(world, services, scheduler)

    manager.activate('test')
    expect(enable).toHaveBeenCalledTimes(1)
    expect(services.bus.emit).toHaveBeenCalledWith({ type: 'mod:activated', id: 'test' })
    expect(manager.isActive('test')).toBe(true)

    manager.deactivate('test')
    expect(disable).toHaveBeenCalledTimes(1)
    expect(services.bus.emit).toHaveBeenCalledWith({ type: 'mod:deactivated', id: 'test' })
    for (const unsub of busUnsubscribers) {
      expect(unsub).toHaveBeenCalledTimes(1)
    }
    for (const unregister of schedulerUnsubscribers) {
      expect(unregister).toHaveBeenCalledTimes(1)
    }
  })

  it('runs disable before automatic teardowns in reverse order', () => {
    const { services, scheduler, world } = createServices()
    const order: string[] = []

    services.bus.on = vi.fn(() => {
      const unsub = vi.fn(() => order.push('event'))
      return unsub
    })

    scheduler.register = vi.fn(() => {
      const unregister = vi.fn(() => order.push('system'))
      return unregister
    })

    mods.push({
      id: 'teardown',
      enable: (ctx) => {
        ctx.on('tick', () => {})
        ctx.registerSystem('update', () => {})
      },
      disable: () => {
        order.push('disable')
      }
    })

    const manager = createModManager(world, services, scheduler)
    manager.activate('teardown')
    order.length = 0

    manager.deactivate('teardown')
    expect(order).toEqual(['disable', 'system', 'event'])
  })

  it('enforces requires and conflicts rules', () => {
    const { services, scheduler, world } = createServices()

    const baseMod: GameMod = { id: 'base', enable: () => {} }
    const requiresBase: GameMod = { id: 'needs-base', requires: ['base'], enable: () => {} }
    const conflictsBase: GameMod = { id: 'conflicts-base', conflictsWith: ['base'], enable: () => {} }

    mods.push(baseMod, requiresBase, conflictsBase)

    const manager = createModManager(world, services, scheduler)

    expect(() => manager.activate('needs-base')).toThrowError('Missing requirements')

    manager.activate('base')
    expect(() => manager.activate('conflicts-base')).toThrowError('Conflicts for `conflicts-base`')

    expect(() => manager.activate('needs-base')).not.toThrow()
  })
})
