import type { SecondChancesModifier } from '../../../devtools'

type ShieldSide = 'left' | 'right'

interface BallLike {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

export interface ShieldInstance {
  hitsRemaining: number
  maxHits: number
}

export interface SecondChancesState {
  left: ShieldInstance | null
  right: ShieldInstance | null
  lastMaxHits: number
  hasInitialized: boolean
}

const BOUNDARY_EPSILON = 1

export function createSecondChancesState(): SecondChancesState {
  return {
    left: null,
    right: null,
    lastMaxHits: 0,
    hasInitialized: false,
  }
}

export function clearSecondChancesState(state: SecondChancesState) {
  state.left = null
  state.right = null
  state.lastMaxHits = 0
  state.hasInitialized = false
}

export function maintainSecondChancesState(
  state: SecondChancesState,
  modifier: SecondChancesModifier,
) {
  if (!modifier.enabled) {
    clearSecondChancesState(state)
    return
  }

  const maxHits = sanitizeMaxHits(modifier)
  state.lastMaxHits = maxHits

  if (!state.hasInitialized) {
    state.left = createShield(maxHits)
    state.right = createShield(maxHits)
    state.hasInitialized = true
    return
  }

  const shields: ShieldSide[] = ['left', 'right']
  for (const side of shields) {
    const shield = side === 'left' ? state.left : state.right
    if (!shield) continue
    shield.maxHits = maxHits
    if (shield.hitsRemaining > maxHits) {
      shield.hitsRemaining = maxHits
    }
  }
}

export function resetSecondChancesShields(
  state: SecondChancesState,
  modifier: SecondChancesModifier,
) {
  if (!modifier.enabled) {
    clearSecondChancesState(state)
    return
  }

  const maxHits = sanitizeMaxHits(modifier)
  state.left = createShield(maxHits)
  state.right = createShield(maxHits)
  state.lastMaxHits = maxHits
  state.hasInitialized = true
}

export function reflectBallWithSecondChanceShields(
  state: SecondChancesState,
  modifier: SecondChancesModifier,
  ball: BallLike,
  arenaWidth: number,
  swapSides = false,
): ShieldSide | null {
  if (!modifier.enabled) return null

  const radius = Math.max(1, ball.radius)

  if (state.left && state.left.hitsRemaining > 0) {
    if (!swapSides && ball.vx < 0) {
      const contact = ball.x - radius
      if (contact <= 0) {
        ball.x = radius + BOUNDARY_EPSILON
        ball.vx = Math.abs(ball.vx)
        applyShieldDamage(state, 'left')
        return 'left'
      }
    }

    if (swapSides && ball.vx > 0) {
      const contact = ball.x + radius
      if (contact >= arenaWidth) {
        const targetX = arenaWidth - radius - BOUNDARY_EPSILON
        const clampedX = Math.min(arenaWidth - radius, Math.max(radius, targetX))
        ball.x = clampedX
        ball.vx = -Math.abs(ball.vx)
        applyShieldDamage(state, 'left')
        return 'left'
      }
    }
  }

  if (state.right && state.right.hitsRemaining > 0) {
    if (!swapSides && ball.vx > 0) {
      const contact = ball.x + radius
      if (contact >= arenaWidth) {
        const targetX = arenaWidth - radius - BOUNDARY_EPSILON
        const clampedX = Math.min(arenaWidth - radius, Math.max(radius, targetX))
        ball.x = clampedX
        ball.vx = -Math.abs(ball.vx)
        applyShieldDamage(state, 'right')
        return 'right'
      }
    }

    if (swapSides && ball.vx < 0) {
      const contact = ball.x - radius
      if (contact <= 0) {
        ball.x = radius + BOUNDARY_EPSILON
        ball.vx = Math.abs(ball.vx)
        applyShieldDamage(state, 'right')
        return 'right'
      }
    }
  }

  return null
}

function applyShieldDamage(state: SecondChancesState, side: ShieldSide) {
  const shield = side === 'left' ? state.left : state.right
  if (!shield) return

  shield.hitsRemaining = Math.max(0, shield.hitsRemaining - 1)
  if (shield.hitsRemaining <= 0) {
    if (side === 'left') state.left = null
    else state.right = null
  }
}

function createShield(maxHits: number): ShieldInstance {
  return {
    hitsRemaining: maxHits,
    maxHits,
  }
}

function sanitizeMaxHits(modifier: SecondChancesModifier): number {
  const raw = Number(modifier.maxHits)
  if (!Number.isFinite(raw)) return 1
  return Math.max(1, Math.floor(raw))
}
