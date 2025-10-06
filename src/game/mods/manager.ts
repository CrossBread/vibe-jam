// File: src/game/mods/manager.ts
// Runtime activation/deactivation with automatic teardown and conflict checks.
import { getAllMods } from './registry';
import type { GameMod, ModContext } from './mod.types';
import type { Scheduler, Phase, SystemFn } from '../../engine/scheduler';
import type { Services } from '../../engine/services';
import type { Unsubscribe } from '../../types/events';

export interface ModManager {
  all(): GameMod[];
  active(): string[];
  isActive(id: string): boolean;
  activate(id: string): void;
  deactivate(id: string): void;
  toggle(id: string): void;
}

type Teardown = Unsubscribe;

export function createModManager(world: any, services: Services, scheduler: Scheduler): ModManager {
  const byId = new Map<string, GameMod>();
  for (const m of getAllMods()) byId.set(m.id, m);
  const active = new Map<string, { mod: GameMod; teardowns: Teardown[] }>();

  function makeCtx(): ModContext {
    const teardowns: Teardown[] = [];

    function on<T extends Parameters<Services['bus']['on']>[0]>(
      type: T,
      handler: Parameters<Services['bus']['on']>[1]
    ): Unsubscribe {
      const unsub = services.bus.on(type as any, handler as any);
      teardowns.push(unsub);
      return unsub;
    }

    function registerSystem(phase: Phase, fn: SystemFn, order = 0): Unsubscribe {
      const unreg = scheduler.register(phase, fn, order);
      teardowns.push(unreg);
      return unreg;
    }

    // Bridge to world; adapt as your ECS exposes stores/CRUD.
    const ctx: ModContext = {
      services,
      createEntity: () => world.createEntity(),
      destroyEntity: (id) => world.destroyEntity(id),
      addComponent: (id, store, data) => world.addComponent(id, store, data),
      on,
      registerSystem
    };

    // The manager will own these teardowns per activation.
    (ctx as any).__collectTeardowns = () => teardowns;
    return ctx;
  }

  function checkDependencies(mod: GameMod) {
    const missing = (mod.requires ?? []).filter((id) => !active.has(id));
    if (missing.length) throw new Error(`Missing requirements for \`${mod.id}\`: ${missing.join(', ')}`);
    const conflicts = (mod.conflictsWith ?? []).filter((id) => active.has(id));
    if (conflicts.length) throw new Error(`Conflicts for \`${mod.id}\`: ${conflicts.join(', ')}`);
  }

  function activate(id: string) {
    if (active.has(id)) return;
    const mod = byId.get(id);
    if (!mod) throw new Error(`Unknown mod: \`${id}\``);
    checkDependencies(mod);
    const ctx = makeCtx();
    mod.enable(ctx);
    const teardowns: Teardown[] = ((ctx as any).__collectTeardowns?.() ?? []);
    if (mod.disable) {
      // Ensure disable can run before teardowns for custom cleanup ordering.
      teardowns.unshift(() => mod.disable!(ctx));
    }
    active.set(id, { mod, teardowns });
    services.bus.emit({ type: 'mod:activated', id });
  }

  function deactivate(id: string) {
    const entry = active.get(id);
    if (!entry) return;
    // Run teardowns LIFO for safer unwinding.
    for (let i = entry.teardowns.length - 1; i >= 0; i--) {
      try { entry.teardowns[i](); } catch { /* noop */ }
    }
    active.delete(id);
    services.bus.emit({ type: 'mod:deactivated', id });
  }

  return {
    all: () => [...byId.values()],
    active: () => [...active.keys()],
    isActive: (id) => active.has(id),
    activate,
    deactivate,
    toggle: (id) => (active.has(id) ? deactivate(id) : activate(id))
  };
}
