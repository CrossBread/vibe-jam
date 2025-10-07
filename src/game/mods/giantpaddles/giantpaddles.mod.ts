// File: src/game/mods/giantpaddles/giantpaddles.mod.ts
import type { PaddleMod } from '../mod.types'

type PaddleSide = 'left' | 'right'

interface PaddleGrowthState {
  side: PaddleSide
  growthRatePerSecond: number
  maxHeightMultiplier: number
  heightMultiplier: number
}

const PaddleGrowthStore = {} as import('../mod.types').ComponentStore<PaddleGrowthState>

const growthByEntity = new Map<number, PaddleGrowthState>()
let createdEntities: number[] = []

const sides: PaddleSide[] = ['left', 'right']

const GiantPaddles: PaddleMod = {
  id: 'mod.giant-paddles',
  kind: 'paddle',
  tags: ['mutator', 'size'],
  enable(ctx) {
    createdEntities = []
    growthByEntity.clear()

    for (const side of sides) {
      const entityId = ctx.createEntity()
      const state: PaddleGrowthState = {
        side,
        growthRatePerSecond: 0.45,
        maxHeightMultiplier: 2.5,
        heightMultiplier: 1
      }

      createdEntities.push(entityId)
      growthByEntity.set(entityId, state)
      ctx.addComponent(entityId, PaddleGrowthStore, state)
    }

    ctx.on('tick', (event) => {
      if (event.type !== 'tick') return
      const { dt } = event
      for (const state of growthByEntity.values()) {
        const bonus = state.growthRatePerSecond * dt
        if (bonus <= 0) continue
        state.heightMultiplier = Math.min(
          state.maxHeightMultiplier,
          state.heightMultiplier + bonus
        )
      }
    })

    ctx.registerSystem('preUpdate', (dt) => {
      for (const state of growthByEntity.values()) {
        if (state.heightMultiplier >= state.maxHeightMultiplier) continue
        state.heightMultiplier = Math.min(
          state.maxHeightMultiplier,
          state.heightMultiplier + state.growthRatePerSecond * 0.5 * dt
        )
      }
    }, -5)
  },
  disable(ctx) {
    for (const entityId of createdEntities) {
      ctx.destroyEntity(entityId)
    }
    createdEntities = []
    growthByEntity.clear()
  }
}

export default GiantPaddles
