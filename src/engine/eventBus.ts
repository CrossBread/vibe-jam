// engine/eventBus.ts
import { EventBus } from '../types/events'

export function createEventBus(): EventBus {
  const handlers = new Map<string, Set<Function>>();
  return {
    emit: (e) => {
      const set = handlers.get(e.type);
      if (!set) return;
      for (const h of set) h(e);
    },
    on: (type, handler) => {
      let set = handlers.get(type);
      if (!set) handlers.set(type, (set = new Set()));
      set.add(handler);
      return () => set!.delete(handler);
    }
  };
}