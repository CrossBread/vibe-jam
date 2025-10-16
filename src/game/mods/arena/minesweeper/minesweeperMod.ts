import type { MinesweeperModifier } from '../../../devtools'
import type { ManagedMod, BallLike } from '../../modManager'
import type { ArenaDimensions } from '../shared'
import {
  clearMinesweeperState,
  createMinesweeperState,
  maintainMinesweeperState,
  resetMinesweeperState,
  resolveMinesweeperCollision,
  type MinesweeperState,
  type MinesweeperCollisionResult,
} from './minesweeperModifier'
import { drawMinesweeperSquares } from './minesweeperView'

interface MinesweeperModParams {
  getModifier(): MinesweeperModifier
  getArenaDimensions(): ArenaDimensions
  getContext(): CanvasRenderingContext2D
}

export interface MinesweeperMod extends ManagedMod {
  resetBoard(): void
  clearBoard(): void
  resolveCollision(ball: BallLike): MinesweeperCollisionResult | null
}

export function createMinesweeperMod(params: MinesweeperModParams): MinesweeperMod {
  const state: MinesweeperState = createMinesweeperState()

  const getModifier = () => params.getModifier()
  const getDimensions = () => params.getArenaDimensions()

  const maintainState = () => {
    maintainMinesweeperState(state, getModifier(), getDimensions())
  }

  const resetState = () => {
    resetMinesweeperState(state, getModifier(), getDimensions())
  }

  const clearState = () => {
    clearMinesweeperState(state)
  }

  return {
    key: 'minesweeper',
    isEnabled: () => Boolean(getModifier().enabled),
    onEnabled() {
      maintainState()
      resetState()
    },
    onTick() {
      maintainState()
    },
    onBallReset() {
      maintainState()
      resetState()
    },
    onDisabled() {
      clearState()
    },
    onReset() {
      clearState()
    },
    onDraw() {
      drawMinesweeperSquares(params.getContext(), state, getModifier())
    },
    resetBoard() {
      resetState()
    },
    clearBoard() {
      clearState()
    },
    resolveCollision(ball) {
      return resolveMinesweeperCollision(state, getModifier(), ball)
    },
  }
}
