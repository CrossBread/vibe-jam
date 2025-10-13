import type { GravityWellModifier } from '../../../devtools'
import type { ArenaDimensions } from '../shared'
import { clamp, randomRange } from '../shared'

export interface PaddlePotionObject {
  x: number
  y: number
  radius: number
}

export interface PaddlePotionState {
  objects: PaddlePotionObject[]
}

type PaddlePotionModifierConfig = GravityWellModifier & {
  objectRadius?: number
  spawnCount?: number
}

export function createPaddlePotionState(): PaddlePotionState {
  return { objects: [] }
}

export function clearPaddlePotionState(state: PaddlePotionState) {
  if (state.objects.length > 0) {
    state.objects.length = 0
  }
}

export function maintainPaddlePotionState(
  state: PaddlePotionState,
  modifier: PaddlePotionModifierConfig,
  dimensions: ArenaDimensions,
) {
  if (!modifier.enabled) {
    clearPaddlePotionState(state)
    return
  }

  const radius = getPotionRadius(modifier)
  const rawCount = Number.isFinite(modifier.spawnCount) ? Math.floor(Number(modifier.spawnCount)) : 3
  const count = clamp(rawCount, 0, 50)

  if (state.objects.length > count) {
    state.objects.length = count
  }

  for (const object of state.objects) {
    object.radius = radius
  }

  while (state.objects.length < count) {
    state.objects.push(createPotionObject(radius, dimensions))
  }
}

export function respawnPaddlePotionObject(
  state: PaddlePotionState,
  index: number,
  modifier: PaddlePotionModifierConfig,
  dimensions: ArenaDimensions,
  avoid?: { x: number; y: number; radius: number },
) {
  if (index < 0 || index >= state.objects.length) return

  const radius = getPotionRadius(modifier)
  state.objects[index] = createPotionObject(radius, dimensions, avoid)
}

export function getPotionObjects(state: PaddlePotionState, modifier: PaddlePotionModifierConfig) {
  if (!modifier.enabled) return [] as PaddlePotionObject[]
  return state.objects
}

function createPotionObject(
  radius: number,
  dimensions: ArenaDimensions,
  avoid?: { x: number; y: number; radius: number },
): PaddlePotionObject {
  const margin = Math.max(radius + 12, radius)
  let x = dimensions.width * 0.5
  let y = dimensions.height * 0.5
  const maxAttempts = 12

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    x = randomRange(margin, Math.max(margin, dimensions.width - margin))
    y = randomRange(margin, Math.max(margin, dimensions.height - margin))

    if (!avoid) break

    const minDistance = radius + avoid.radius + 12
    const dx = x - avoid.x
    const dy = y - avoid.y
    const distance = Math.hypot(dx, dy)
    if (distance >= minDistance) break
  }

  return { x, y, radius }
}

function getPotionRadius(modifier: PaddlePotionModifierConfig): number {
  const fallback = Number.isFinite(modifier.radius) ? Number(modifier.radius) : 20
  const raw = Number.isFinite(modifier.objectRadius) ? Number(modifier.objectRadius) : fallback
  return clamp(raw, 6, 160)
}
