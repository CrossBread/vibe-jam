import type { ArenaMod, ComponentStore } from '../mod.types'

export interface IrelandWell {
  x: number
  y: number
  radius: number
  gravityStrength: number
  gravityFalloff: number
  positiveTint: string
  negativeTint: string
}

export interface IrelandArenaState {
  width: number
  height: number
  wells: IrelandWell[]
}

export const IrelandArenaStore = {} as ComponentStore<IrelandArenaState>

const DEFAULT_WIDTH = 800
const DEFAULT_HEIGHT = 480
const DEFAULT_WELL_COUNT = 16

const DEFAULT_MIN_STRENGTH = 1_800_000
const DEFAULT_MAX_STRENGTH = 6_200_000
const DEFAULT_MIN_FALLOFF = 95
const DEFAULT_MAX_FALLOFF = 161
const DEFAULT_MIN_RADIUS = 24
const DEFAULT_MAX_RADIUS = 86

const POSITIVE_TINT = '#4ade80'
const NEGATIVE_TINT = '#bbf7d0'

const CONFLICTING_ARENA_MODS = ['mod.arena.black-hole']

let irelandEntityId: number | null = null
let irelandState: IrelandArenaState | null = null

const IrelandArenaMod: ArenaMod = {
  id: 'mod.arena.ireland',
  kind: 'arena',
  tags: ['mutator', 'gravity', 'arena'],
  conflictsWith: CONFLICTING_ARENA_MODS,
  enable(ctx) {
    const entityId = ctx.createEntity()
    irelandEntityId = entityId
    irelandState = {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      wells: [],
    }

    ctx.addComponent(entityId, IrelandArenaStore, irelandState)

    const rng = ctx.services.rng

    const randomRange = (min: number, max: number) => {
      const t = clamp01(rng.next())
      return min + (max - min) * t
    }

    const regenerate = () => {
      if (!irelandState) return
      irelandState.wells.length = 0
      const wellCount = Math.max(1, DEFAULT_WELL_COUNT)

      for (let i = 0; i < wellCount; i += 1) {
        const radius = randomRange(DEFAULT_MIN_RADIUS, DEFAULT_MAX_RADIUS)
        const margin = Math.max(20, radius)
        const minX = Math.max(margin, 0)
        const maxX = Math.max(minX, irelandState.width - margin)
        const minY = Math.max(margin, 0)
        const maxY = Math.max(minY, irelandState.height - margin)
        const x = minX <= maxX ? randomRange(minX, maxX) : irelandState.width * 0.5
        const y = minY <= maxY ? randomRange(minY, maxY) : irelandState.height * 0.5

        irelandState.wells.push({
          x,
          y,
          radius,
          gravityStrength: randomRange(DEFAULT_MIN_STRENGTH, DEFAULT_MAX_STRENGTH),
          gravityFalloff: toGravityFalloffValue(
            randomRange(DEFAULT_MIN_FALLOFF, DEFAULT_MAX_FALLOFF),
          ),
          positiveTint: POSITIVE_TINT,
          negativeTint: NEGATIVE_TINT,
        })
      }
    }

    ctx.on('arena:resize', (event) => {
      if (event.type !== 'arena:resize' || !irelandState) return
      irelandState.width = Math.max(0, event.width)
      irelandState.height = Math.max(0, event.height)
      regenerate()
    })

    ctx.on('score', (event) => {
      if (event.type !== 'score') return
      regenerate()
    })

    ctx.registerSystem('preUpdate', () => {
      if (!irelandState) return
      if (irelandState.wells.length === 0) {
        regenerate()
      }
    }, -10)

    regenerate()
  },
  disable(ctx) {
    if (irelandEntityId != null) {
      ctx.destroyEntity(irelandEntityId)
    }
    irelandEntityId = null
    irelandState = null
  },
}

function toGravityFalloffValue(range: number): number {
  const radius = Number.isFinite(range) ? Math.max(0, range) : 0
  return radius * radius
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

export default IrelandArenaMod
