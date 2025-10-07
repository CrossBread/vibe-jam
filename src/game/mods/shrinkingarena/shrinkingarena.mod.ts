// File: src/game/mods/shrinkingarena/shrinkingarena.mod.ts
import type { ArenaMod } from '../mod.types'

interface ArenaShrinkState {
  currentWidth: number
  currentHeight: number
  minWidth: number
  minHeight: number
  shrinkPerSecond: number
  elapsed: number
}

const ArenaShrinkStore = {} as import('../mod.types').ComponentStore<ArenaShrinkState>

let arenaEntity: number | null = null
let shrinkState: ArenaShrinkState | null = null
let ignoreNextResize = false

const ShrinkingArena: ArenaMod = {
  id: 'mod.shrinking-arena',
  kind: 'arena',
  tags: ['mutator', 'arena'],
  enable(ctx) {
    arenaEntity = ctx.createEntity()
    shrinkState = {
      currentWidth: 0,
      currentHeight: 0,
      minWidth: 320,
      minHeight: 180,
      shrinkPerSecond: 24,
      elapsed: 0
    }

    ctx.addComponent(arenaEntity, ArenaShrinkStore, shrinkState)

    ctx.on('arena:resize', (event) => {
      if (event.type !== 'arena:resize') return
      const { width, height } = event
      if (ignoreNextResize) {
        ignoreNextResize = false
        return
      }

      if (!shrinkState) return
      shrinkState.currentWidth = width
      shrinkState.currentHeight = height
    })

    ctx.registerSystem('postUpdate', (dt) => {
      if (!shrinkState) return
      shrinkState.elapsed += dt
      if (shrinkState.elapsed < 0.5) return
      shrinkState.elapsed = 0

      const nextWidth = Math.max(
        shrinkState.minWidth,
        shrinkState.currentWidth - shrinkState.shrinkPerSecond
      )
      const nextHeight = Math.max(
        shrinkState.minHeight,
        shrinkState.currentHeight - shrinkState.shrinkPerSecond * 0.5625
      )

      if (nextWidth === shrinkState.currentWidth && nextHeight === shrinkState.currentHeight) {
        return
      }

      shrinkState.currentWidth = nextWidth
      shrinkState.currentHeight = nextHeight

      ignoreNextResize = true
      ctx.services.bus.emit({
        type: 'arena:resize',
        width: shrinkState.currentWidth,
        height: shrinkState.currentHeight
      })
    }, 25)
  },
  disable(ctx) {
    if (arenaEntity != null) {
      ctx.destroyEntity(arenaEntity)
    }
    arenaEntity = null
    shrinkState = null
    ignoreNextResize = false
  }
}

export default ShrinkingArena
