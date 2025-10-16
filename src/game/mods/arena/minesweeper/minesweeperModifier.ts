import type { MinesweeperModifier } from '../../../devtools'
import type { ManagedMod, BallLike } from '../../modManager'
import type { ArenaDimensions } from '../shared'
import { clamp } from '../shared'
import { drawMinesweeperSquares } from './minesweeperView'

export interface MinesweeperCell {
  x: number
  y: number
  size: number
  isMine: boolean
  state: 'idle' | 'triggered' | 'cleared'
}

interface MinesweeperConfigSnapshot {
  rows: number
  columns: number
  spacing: number
  size: number
}

export interface MinesweeperState {
  cells: MinesweeperCell[]
  lastConfig: MinesweeperConfigSnapshot | null
}

export type MinesweeperCollisionResult = 'mine' | 'safe'

const DEFAULT_ROWS = 5
const DEFAULT_COLUMNS = 6
const DEFAULT_SPACING = 68
const DEFAULT_SIZE = 34
const MIN_ROWS = 1
const MAX_ROWS = 12
const MIN_COLUMNS = 1
const MAX_COLUMNS = 16
const MIN_SPACING = 4
const MAX_SPACING = 400
const MIN_SIZE = 4
const MAX_SIZE = 220
const MINE_CHANCE = 0.25
const COLLISION_EPSILON = 0.5

export function createMinesweeperState(): MinesweeperState {
  return {
    cells: [],
    lastConfig: null,
  }
}

export function clearMinesweeperState(state: MinesweeperState) {
  state.cells.length = 0
  state.lastConfig = null
}

export function maintainMinesweeperState(
  state: MinesweeperState,
  modifier: MinesweeperModifier,
  dimensions: ArenaDimensions,
) {
  if (!modifier.enabled) {
    clearMinesweeperState(state)
    return
  }

  const config = sanitizeConfig(modifier)
  if (!state.lastConfig || !isSameConfig(state.lastConfig, config)) {
    rebuildGrid(state, config, dimensions)
    state.lastConfig = config
  }
}

export function resetMinesweeperState(
  state: MinesweeperState,
  modifier: MinesweeperModifier,
  dimensions: ArenaDimensions,
) {
  if (!modifier.enabled) {
    clearMinesweeperState(state)
    return
  }

  const config = sanitizeConfig(modifier)
  rebuildGrid(state, config, dimensions)
  state.lastConfig = config
}

export function resolveMinesweeperCollision(
  state: MinesweeperState,
  modifier: MinesweeperModifier,
  ball: BallLike,
): MinesweeperCollisionResult | null {
  if (!modifier.enabled) return null

  for (const cell of state.cells) {
    if (cell.state !== 'idle') continue

    if (!intersects(ball, cell)) continue

    if (cell.isMine) {
      cell.state = 'triggered'
      applyBounce(ball, cell)
      return 'mine'
    }

    cell.state = 'cleared'
    return 'safe'
  }

  return null
}

function rebuildGrid(
  state: MinesweeperState,
  config: MinesweeperConfigSnapshot,
  dimensions: ArenaDimensions,
) {
  state.cells.length = 0
  const centerX = dimensions.width / 2
  const centerY = dimensions.height / 2
  const rowOffset = (config.rows - 1) / 2
  const columnOffset = (config.columns - 1) / 2

  for (let row = 0; row < config.rows; row++) {
    for (let column = 0; column < config.columns; column++) {
      const offsetX = (column - columnOffset) * config.spacing
      const offsetY = (row - rowOffset) * config.spacing
      const x = centerX + offsetX - config.size / 2
      const y = centerY + offsetY - config.size / 2
      const isMine = Math.random() < MINE_CHANCE

      state.cells.push({
        x,
        y,
        size: config.size,
        isMine,
        state: 'idle',
      })
    }
  }
}

function sanitizeConfig(modifier: MinesweeperModifier): MinesweeperConfigSnapshot {
  const rawRows = Number(modifier.rows)
  const rows = clamp(
    Number.isFinite(rawRows) ? Math.floor(rawRows) : DEFAULT_ROWS,
    MIN_ROWS,
    MAX_ROWS,
  )

  const rawColumns = Number(modifier.columns)
  const columns = clamp(
    Number.isFinite(rawColumns) ? Math.floor(rawColumns) : DEFAULT_COLUMNS,
    MIN_COLUMNS,
    MAX_COLUMNS,
  )

  const rawSpacing = Number(modifier.gridSpacing)
  const spacing = clamp(
    Number.isFinite(rawSpacing) ? rawSpacing : DEFAULT_SPACING,
    MIN_SPACING,
    MAX_SPACING,
  )

  const rawSize = Number(modifier.squareSize)
  const size = clamp(
    Number.isFinite(rawSize) ? rawSize : DEFAULT_SIZE,
    MIN_SIZE,
    MAX_SIZE,
  )

  return { rows, columns, spacing, size }
}

function isSameConfig(a: MinesweeperConfigSnapshot, b: MinesweeperConfigSnapshot): boolean {
  return (
    a.rows === b.rows &&
    a.columns === b.columns &&
    a.spacing === b.spacing &&
    a.size === b.size
  )
}

function intersects(ball: BallLike, cell: MinesweeperCell): boolean {
  const radius = Math.max(1, ball.radius)
  const left = cell.x
  const right = cell.x + cell.size
  const top = cell.y
  const bottom = cell.y + cell.size

  const closestX = clamp(ball.x, left, right)
  const closestY = clamp(ball.y, top, bottom)
  const diffX = ball.x - closestX
  const diffY = ball.y - closestY
  const distSq = diffX * diffX + diffY * diffY

  return distSq <= radius * radius
}

function applyBounce(ball: BallLike, cell: MinesweeperCell) {
  const radius = Math.max(1, ball.radius)
  const left = cell.x
  const right = cell.x + cell.size
  const top = cell.y
  const bottom = cell.y + cell.size

  const closestX = clamp(ball.x, left, right)
  const closestY = clamp(ball.y, top, bottom)
  const diffX = ball.x - closestX
  const diffY = ball.y - closestY
  const distSq = diffX * diffX + diffY * diffY

  if (distSq === 0) {
    const distances = [
      { axis: 'left' as const, value: Math.abs(ball.x - left) },
      { axis: 'right' as const, value: Math.abs(right - ball.x) },
      { axis: 'top' as const, value: Math.abs(ball.y - top) },
      { axis: 'bottom' as const, value: Math.abs(bottom - ball.y) },
    ]
    distances.sort((a, b) => a.value - b.value)
    const nearest = distances[0]

    switch (nearest.axis) {
      case 'left':
        ball.x = left - radius - COLLISION_EPSILON
        if (ball.vx > 0) ball.vx *= -1
        return
      case 'right':
        ball.x = right + radius + COLLISION_EPSILON
        if (ball.vx < 0) ball.vx *= -1
        return
      case 'top':
        ball.y = top - radius - COLLISION_EPSILON
        if (ball.vy > 0) ball.vy *= -1
        return
      case 'bottom':
        ball.y = bottom + radius + COLLISION_EPSILON
        if (ball.vy < 0) ball.vy *= -1
        return
    }
  }

  const dist = Math.sqrt(distSq) || 1
  const nx = diffX / dist
  const ny = diffY / dist
  const penetration = radius - dist + COLLISION_EPSILON

  ball.x += nx * penetration
  ball.y += ny * penetration

  const dot = ball.vx * nx + ball.vy * ny
  if (dot < 0) {
    ball.vx -= 2 * dot * nx
    ball.vy -= 2 * dot * ny
  }
}

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
