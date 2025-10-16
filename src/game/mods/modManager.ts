/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

export interface BallLike {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  travelDistance: number
  portalCooldown?: number
}

export interface ManagedMod {
  key: string
  isEnabled(): boolean
  onInit?(): void
  onEnabled?(): void
  onDisabled?(): void
  onAlwaysTick?(dt: number): void
  onTick?(dt: number): void
  onBallStep?(ball: BallLike, dt: number): boolean | void
  onDraw?(): void
  onReset?(): void
  onBallReset?(serveToLeft: boolean): void
}

interface SyncOptions {
  force?: boolean
}

export class ModManager {
  private readonly previousEnabled = new Map<ManagedMod, boolean>()

  constructor(private readonly mods: ManagedMod[]) {}

  init() {
    for (const mod of this.mods) {
      mod.onInit?.()
    }
    this.syncEnabled()
  }

  syncEnabled(options: SyncOptions = {}) {
    const force = options.force ?? false
    for (const mod of this.mods) {
      const enabled = Boolean(mod.isEnabled())
      const previous = this.previousEnabled.get(mod) ?? false
      if (enabled) {
        if (!previous || force) {
          mod.onEnabled?.()
        }
      } else if (previous) {
        mod.onDisabled?.()
      }
      this.previousEnabled.set(mod, enabled)
    }
  }

  tick(dt: number) {
    this.syncEnabled()
    for (const mod of this.mods) {
      mod.onAlwaysTick?.(dt)
      if (!this.isModEnabled(mod)) continue
      mod.onTick?.(dt)
    }
  }

  handleBallStep(ball: BallLike, dt: number): boolean {
    let changed = false
    for (const mod of this.mods) {
      if (!this.isModEnabled(mod)) continue
      if (!mod.onBallStep) continue
      const result = mod.onBallStep(ball, dt)
      if (result) changed = true
    }
    return changed
  }

  handleBallReset(serveToLeft: boolean) {
    for (const mod of this.mods) {
      if (!this.isModEnabled(mod)) continue
      mod.onBallReset?.(serveToLeft)
    }
  }

  reset() {
    for (const mod of this.mods) {
      mod.onReset?.()
    }
    this.syncEnabled({ force: true })
  }

  draw() {
    for (const mod of this.mods) {
      if (!this.isModEnabled(mod)) continue
      mod.onDraw?.()
    }
  }

  private isModEnabled(mod: ManagedMod) {
    return this.previousEnabled.get(mod) ?? false
  }
}
