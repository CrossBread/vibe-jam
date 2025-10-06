import { describe, expect, it } from 'vitest'
import { createScheduler } from '../src/engine/scheduler'

const dt = 1 / 60

describe('scheduler', () => {
  it('runs systems in phase order and sorted by registration order', () => {
    const scheduler = createScheduler()
    const calls: string[] = []

    scheduler.register('update', () => calls.push('update-0a'), 0)
    scheduler.register('preUpdate', () => calls.push('pre'), 0)
    scheduler.register('update', () => calls.push('update-0b'), 0)
    scheduler.register('postUpdate', () => calls.push('post'), 0)
    scheduler.register('update', () => calls.push('update-2a'), 2)
    scheduler.register('update', () => calls.push('update-1a'), 1)
    scheduler.register('update', () => calls.push('update-1b'), 1)

    scheduler.tick(dt)

    expect(calls).toEqual([
      'pre',
      'update-0a',
      'update-0b',
      'update-1a',
      'update-1b',
      'update-2a',
      'post'
    ])
  })

  it('stops running a system after it is unregistered', () => {
    const scheduler = createScheduler()
    const calls: number[] = []

    const unregister = scheduler.register('update', () => calls.push(1))
    scheduler.tick(dt)
    unregister()
    scheduler.tick(dt)

    expect(calls).toEqual([1])
  })
})
