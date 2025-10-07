import type { SystemFn } from '../../engine/scheduler'

export interface ArenaSystemContext {
  updateMovingWellState(key: 'blackMole' | 'gopher', dt: number): void
  updateDivotsState(): void
  updateIrelandState(): void
}

export function createArenaSystem(ctx: ArenaSystemContext): SystemFn {
  return (dt) => {
    ctx.updateMovingWellState('blackMole', dt)
    ctx.updateMovingWellState('gopher', dt)
    ctx.updateDivotsState()
    ctx.updateIrelandState()
  }
}
