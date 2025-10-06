// File: src/types/events.ts
// Core events extended with mod activation signals; keeps mods from growing this union.
export type GameEvent =
  | { type: 'tick'; dt: number }
  | { type: 'ball:spawned'; entityId: number }
  | { type: 'ball:despawned'; entityId: number; reason: 'outOfBounds' | 'merged' }
  | { type: 'collision'; a: number; b: number }
  | { type: 'score'; side: 'left' | 'right' }
  | { type: 'arena:resize'; width: number; height: number }
  | { type: 'mod:activated'; id: string }
  | { type: 'mod:deactivated'; id: string };

export type Unsubscribe = () => void;

export interface EventBus {
  emit<E extends GameEvent>(e: E): void;
  on<T extends GameEvent['type']>(
    type: T,
    handler: (e: Extract<GameEvent, { type: T }>) => void
  ): Unsubscribe;
}