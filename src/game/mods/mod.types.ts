// File: src/game/mods/mod.types.ts
// Mutator contract extended with metadata and safe registration helpers.
import type { Services } from '../../engine/services';
import type { Phase, SystemFn } from '../../engine/scheduler';
import type { Unsubscribe } from '../../types/events';

export interface ComponentStore<T> {}

export interface ModContext {
  services: Services;
  // World APIs (keep minimal for testability).
  createEntity(): number;
  destroyEntity(id: number): void;
  addComponent<T>(id: number, store: ComponentStore<T>, data: T): void;

  // Auto-teardown helpers (no need for mods to track disposables).
  on<T extends Parameters<Services['bus']['on']>[0]>(
    type: T,
    handler: Parameters<Services['bus']['on']>[1]
  ): void;
  registerSystem(phase: Phase, fn: SystemFn, order?: number): void;
}

export type ModKind = 'ball' | 'paddle' | 'arena' | 'global';

export interface GameMod {
  id: string;                 // unique ID
  kind?: ModKind;             // domain hint
  order?: number;             // optional discovery load order
  tags?: string[];            // categorization
  requires?: string[];        // dependency ids
  conflictsWith?: string[];   // incompatible ids
  enable(ctx: ModContext): void;     // register handlers/systems
  disable?(ctx: ModContext): void;   // optional explicit cleanup
}

export interface BallMod extends GameMod { kind?: 'ball' }
export interface PaddleMod extends GameMod { kind?: 'paddle' }
export interface ArenaMod extends GameMod { kind?: 'arena' }
