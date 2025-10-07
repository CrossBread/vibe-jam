// File: src/game/mods/speedball/speedball.mod.ts
import type { BallMod } from '../mod.types'

interface SpeedBoost {
  multiplier: number
  accelerationPerSecond: number
  maxMultiplier: number
}

const SpeedBoostStore = {} as import('../mod.types').ComponentStore<SpeedBoost>

const trackedBoosts = new Map<number, SpeedBoost>()

const SpeedBall: BallMod = {
  id: 'mod.speedball',
  kind: 'ball',
  tags: ['mutator', 'speed'],
  enable(ctx) {
    trackedBoosts.clear()


    ctx.on('ball:spawned', (event) => {
      if (event.type !== 'ball:spawned') return
      const { entityId } = event
      const boost: SpeedBoost = {
        multiplier: 1,
        accelerationPerSecond: 0.25,
        maxMultiplier: 3
      }

      trackedBoosts.set(entityId, boost)
      ctx.addComponent(entityId, SpeedBoostStore, boost)
    })

    ctx.on('ball:despawned', (event) => {
      if (event.type !== 'ball:despawned') return
      trackedBoosts.delete(event.entityId)
    })

    ctx.registerSystem('update', (dt) => {
      for (const boost of trackedBoosts.values()) {
        boost.multiplier = Math.min(
          boost.maxMultiplier,
          boost.multiplier + boost.accelerationPerSecond * dt
        )
      }
    }, 20)
  }
}

export default SpeedBall