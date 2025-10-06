// File: src/engine/scheduler.ts
// A simple, ordered, phase-based scheduler with register/unregister.
export type Phase = 'preUpdate' | 'update' | 'postUpdate';
export type SystemFn = (dt: number) => void;
export type Unregister = () => void;

export interface Scheduler {
  tick(dt: number): void;
  register(phase: Phase, fn: SystemFn, order?: number): Unregister;
  clear(): void;
}

export function createScheduler(): Scheduler {
  type Entry = { order: number; fn: SystemFn };
  const phases: Record<Phase, Entry[]> = {
    preUpdate: [],
    update: [],
    postUpdate: []
  };

  function register(phase: Phase, fn: SystemFn, order = 0): Unregister {
    const list = phases[phase];
    const entry: Entry = { order, fn };
    list.push(entry);
    list.sort((a, b) => a.order - b.order);
    return () => {
      const i = list.indexOf(entry);
      if (i >= 0) list.splice(i, 1);
    };
  }

  function tick(dt: number) {
    for (const phase of ['preUpdate', 'update', 'postUpdate'] as Phase[]) {
      const list = phases[phase];
      for (let i = 0; i < list.length; i++) list[i].fn(dt);
    }
  }

  function clear() {
    (['preUpdate', 'update', 'postUpdate'] as Phase[]).forEach((p) => (phases[p].length = 0));
  }

  return { tick, register, clear };
}