import type { ArenaMod, ComponentStore } from '../mod.types'

export interface BlackHoleWell {
  x: number
  y: number
  radius: number
  gravityStrength: number
  gravityFalloff: number
  positiveTint: string
  negativeTint: string
}

export interface BlackHoleState {
  width: number
  height: number
  well: BlackHoleWell
}

export const BlackHoleStore = {} as ComponentStore<BlackHoleState>

const DEFAULT_WIDTH = 800
const DEFAULT_HEIGHT = 480
const POSITIVE_TINT = '#94a3b8'
const NEGATIVE_TINT = '#e2e8f0'
const GRAVITY_STRENGTH = 4_800_000
const GRAVITY_FALLOFF = 110
const VISUAL_RADIUS = 40

const CONFLICTING_ARENA_MODS = ['mod.arena.ireland']

let blackHoleEntityId: number | null = null
let blackHoleState: BlackHoleState | null = null

const BlackHoleArenaMod: ArenaMod = {
  id: 'mod.arena.black-hole',
  kind: 'arena',
  tags: ['mutator', 'gravity', 'arena'],
  conflictsWith: CONFLICTING_ARENA_MODS,
  enable(ctx) {
    const entityId = ctx.createEntity()
    blackHoleEntityId = entityId
    blackHoleState = {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      well: {
        x: DEFAULT_WIDTH * 0.5,
        y: DEFAULT_HEIGHT * 0.5,
        radius: VISUAL_RADIUS,
        gravityStrength: GRAVITY_STRENGTH,
        gravityFalloff: toGravityFalloffValue(GRAVITY_FALLOFF),
        positiveTint: POSITIVE_TINT,
        negativeTint: NEGATIVE_TINT,
      },
    }

    ctx.addComponent(entityId, BlackHoleStore, blackHoleState)

    const updateCenter = () => {
      if (!blackHoleState) return
      blackHoleState.well.x = blackHoleState.width * 0.5
      blackHoleState.well.y = blackHoleState.height * 0.5
    }

    ctx.on('arena:resize', (event) => {
      if (event.type !== 'arena:resize' || !blackHoleState) return
      blackHoleState.width = Math.max(0, event.width)
      blackHoleState.height = Math.max(0, event.height)
      updateCenter()
    })

    ctx.registerSystem('preUpdate', () => {
      updateCenter()
    }, -20)
  },
  disable(ctx) {
    if (blackHoleEntityId != null) {
      ctx.destroyEntity(blackHoleEntityId)
    }
    blackHoleEntityId = null
    blackHoleState = null
  },
}

function toGravityFalloffValue(range: number): number {
  const radius = Number.isFinite(range) ? Math.max(0, range) : 0
  return radius * radius
}

export default BlackHoleArenaMod
