/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type {
  DevOverlayElement,
  DevOverlayStatsSnapshot,
} from './devOverlay'

export interface PerformanceStatsTrackerOptions {
  overlay: DevOverlayElement
  /** Maximum number of samples to retain in the rolling window. */
  maxSamples?: number
  /** Interval in milliseconds between UI updates. */
  updateIntervalMs?: number
  /** Frame time threshold in milliseconds used to classify "long" frames. */
  longFrameThresholdMs?: number
  /** Maximum frame duration that should be considered for stats. */
  maxFrameTimeMs?: number
}

class PerformanceStatsTracker {
  private readonly overlay: DevOverlayElement
  private readonly maxSamples: number
  private readonly updateIntervalMs: number
  private readonly longFrameThresholdMs: number
  private readonly maxFrameTimeMs: number
  private enabled = false
  private lastPublish = 0
  private readonly samples: number[] = []

  constructor(options: PerformanceStatsTrackerOptions) {
    this.overlay = options.overlay
    this.maxSamples = options.maxSamples ?? 240
    this.updateIntervalMs = options.updateIntervalMs ?? 250
    this.longFrameThresholdMs = options.longFrameThresholdMs ?? 20
    this.maxFrameTimeMs = options.maxFrameTimeMs ?? 250
  }

  setEnabled(enabled: boolean) {
    if (this.enabled === enabled) {
      this.overlay.__devtools?.setStatsEnabled(enabled)
      if (!enabled) {
        this.overlay.__devtools?.updateStats(null)
      }
      return
    }

    this.enabled = enabled
    this.samples.length = 0
    this.lastPublish = 0

    this.overlay.__devtools?.setStatsEnabled(enabled)
    this.overlay.__devtools?.updateStats(null)
  }

  recordFrame(frameTimeMs: number, now: number) {
    if (!this.enabled) return
    if (!Number.isFinite(frameTimeMs) || frameTimeMs <= 0) return
    if (frameTimeMs > this.maxFrameTimeMs) return

    this.samples.push(frameTimeMs)
    if (this.samples.length > this.maxSamples) {
      this.samples.shift()
    }

    if (this.lastPublish === 0) {
      this.lastPublish = now
      return
    }

    if (now - this.lastPublish < this.updateIntervalMs) {
      return
    }

    this.lastPublish = now
    const stats = this.computeStats()
    this.overlay.__devtools?.updateStats(stats)
  }

  private computeStats(): DevOverlayStatsSnapshot | null {
    if (this.samples.length === 0) {
      return null
    }

    const sampleCount = this.samples.length
    let sum = 0
    let longFrameCount = 0
    for (let i = 0; i < sampleCount; i++) {
      const value = this.samples[i]
      sum += value
      if (value > this.longFrameThresholdMs) {
        longFrameCount++
      }
    }

    const averageFrameTime = sum / sampleCount
    const sorted = [...this.samples].sort((a, b) => a - b)
    const worstFrameTime = sorted[sorted.length - 1] ?? averageFrameTime
    const onePercentIndex = Math.max(0, Math.ceil(sorted.length * 0.99) - 1)
    const onePercentFrameTime = sorted[onePercentIndex] ?? worstFrameTime

    return {
      averageFps: averageFrameTime > 0 ? 1000 / averageFrameTime : 0,
      averageFrameTime,
      onePercentLowFps:
        onePercentFrameTime > 0 ? 1000 / onePercentFrameTime : 0,
      longFrameShare:
        sampleCount > 0 ? (longFrameCount / sampleCount) * 100 : 0,
      longFrameThresholdMs: this.longFrameThresholdMs,
      worstFrameTime,
      sampleCount,
    }
  }
}

export function createPerformanceStatsTracker(
  options: PerformanceStatsTrackerOptions,
) {
  return new PerformanceStatsTracker(options)
}
