// File: src/engine/scheduler.ts
// A simple, ordered, phase-based scheduler with register/unregister.
export type Phase = 'preUpdate' | 'update' | 'postUpdate';
export type SystemFn = (dt: number) => void;
export type Unregister = () => void;
export const phases = ['preUpdate', 'update', 'postUpdate'] as const


export interface Scheduler {
  tick(dt: number): void;
  register(phase: Phase, fn: SystemFn, order?: number): Unregister;
  clear(): void;
}

interface Entry {
  order: number
  index: number
  fn: SystemFn
}

export function createScheduler(): Scheduler {
  const buckets: Record<Phase, Entry[]> = {
    preUpdate: [],
    update: [],
    postUpdate: []
  }

  let nextIndex = 0

  function register(phase: Phase, fn: SystemFn, order = 0): Unregister {
    const entry: Entry = { order, fn, index: nextIndex++ }
    const list = buckets[phase]
    list.push(entry)
    list.sort((a, b) => (a.order === b.order ? a.index - b.index : a.order - b.order))

    return () => {
      const idx = list.indexOf(entry)
      if (idx !== -1) {
        list.splice(idx, 1)
      }
    }
  }

  function tick(dt: number) {
    for (const phase of phases) {
      const list = buckets[phase]
      for (const { fn } of list.slice()) {
        fn(dt)
      }
    }
  }

  function clear() {
    for (const phase of phases) {
      buckets[phase].length = 0
    }
  }

  return { register, tick, clear }
}