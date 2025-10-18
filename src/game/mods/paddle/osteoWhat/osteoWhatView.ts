/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { OsteoWhatModifier } from '../../../devtools'
import { clampByte, parseColorToRgb, type RGBColor } from '../../ball/shared'

export type OsteoLane = 'outer' | 'inner' | 'missile'

export interface OsteoSegmentState {
  hits: number
  broken: boolean
}

interface OsteoSideState {
  outer: OsteoSegmentState[]
  inner: OsteoSegmentState[]
  missile: OsteoSegmentState[]
}

export interface OsteoRuntimeState {
  segments: Record<'left' | 'right', OsteoSideState>
  signature: string | null
}

export interface OsteoPaddleLike {
  side: 'left' | 'right'
  lane: OsteoLane
  x: number
  y: number
  height: number
}

export interface OsteoSegment<TPaddle extends OsteoPaddleLike> {
  paddle: TPaddle
  index: number
  x: number
  y: number
  width: number
  height: number
  osteoIndex: number
  cracked: boolean
  broken: boolean
  osteoDamageRatio: number
}

export interface OsteoColorPalette {
  enabled: boolean
  strong: RGBColor
  weak: RGBColor
}

export const DEFAULT_OSTEO_STRONG_COLOR = '#f1f5f9'
export const DEFAULT_OSTEO_WEAK_COLOR = '#475569'

const DEFAULT_STRONG_RGB: RGBColor = { r: 241, g: 245, b: 249 }
const DEFAULT_WEAK_RGB: RGBColor = { r: 71, g: 85, b: 105 }

export function createOsteoRuntimeState(): OsteoRuntimeState {
  const createSideState = (): OsteoSideState => ({
    outer: [],
    inner: [],
    missile: [],
  })

  return {
    segments: {
      left: createSideState(),
      right: createSideState(),
    },
    signature: null,
  }
}

export function syncOsteoRuntimeState(
  runtime: OsteoRuntimeState,
  modifier: OsteoWhatModifier,
  forceReset = false,
) {
  if (!modifier.enabled) {
    clearRuntimeState(runtime)
    return
  }

  const segmentCount = getSegmentCount(modifier)
  const threshold = getOsteoHitThreshold(modifier)
  const signature = `${segmentCount}:${threshold}`

  if (forceReset || runtime.signature !== signature) {
    runtime.signature = signature
    const createSegments = () =>
      Array.from({ length: segmentCount }, () => ({ hits: 0, broken: false }))
    runtime.segments.left.outer = createSegments()
    runtime.segments.left.inner = createSegments()
    runtime.segments.left.missile = []
    runtime.segments.right.outer = createSegments()
    runtime.segments.right.inner = createSegments()
    runtime.segments.right.missile = []
    return
  }

  ensureStateLength(runtime.segments.left.outer, segmentCount)
  ensureStateLength(runtime.segments.left.inner, segmentCount)
  ensureStateLength(runtime.segments.right.outer, segmentCount)
  ensureStateLength(runtime.segments.right.inner, segmentCount)
}

export function applyOsteoDamageFromSegment<TPaddle extends OsteoPaddleLike>(
  runtime: OsteoRuntimeState,
  segment: { paddle: TPaddle; osteoIndex?: number },
  modifier: OsteoWhatModifier,
) {
  if (!modifier.enabled) return
  const index = segment.osteoIndex
  if (index === undefined) return

  const sideStates = runtime.segments[segment.paddle.side]
  const laneStates = sideStates?.[segment.paddle.lane]
  if (!laneStates) return

  const state = laneStates[index]
  if (!state || state.broken) return

  const threshold = getOsteoHitThreshold(modifier)
  state.hits = Math.min(state.hits + 1, threshold)
  if (state.hits >= threshold) {
    state.broken = true
  }
}

export function buildOsteoSegments<TPaddle extends OsteoPaddleLike>(
  runtime: OsteoRuntimeState,
  paddle: TPaddle,
  modifier: OsteoWhatModifier,
  segmentWidth: number,
): OsteoSegment<TPaddle>[] {
  const segmentCount = getSegmentCount(modifier)
  const gap = Number.isFinite(modifier.gapSize) ? Math.max(0, modifier.gapSize) : 0
  const sideStates = runtime.segments[paddle.side]
  const laneStates = sideStates[paddle.lane]
  ensureStateLength(laneStates, segmentCount)

  const threshold = getOsteoHitThreshold(modifier)
  const segments: OsteoSegment<TPaddle>[] = []
  let y = paddle.y

  for (let i = 0; i < segmentCount; i++) {
    const remainingSegments = segmentCount - i
    const remainingHeight = Math.max(paddle.y + paddle.height - y, 0)
    const gapSpace = i < segmentCount - 1 ? gap : 0
    const height =
      remainingSegments > 0
        ? Math.max(0, (remainingHeight - gapSpace * (remainingSegments - 1)) / remainingSegments)
        : 0

    if (height <= 0) {
      y += gap
      continue
    }

    const state = laneStates[i]
    const hits = Math.min(state?.hits ?? 0, threshold)
    const damageRatio = state?.broken ? 1 : clamp01(threshold === 0 ? 1 : hits / threshold)
    const cracked = damageRatio > 0 && !state?.broken

    segments.push({
      paddle,
      index: i,
      x: paddle.x,
      y,
      width: segmentWidth,
      height,
      osteoIndex: i,
      cracked,
      broken: Boolean(state?.broken),
      osteoDamageRatio: damageRatio,
    })

    y += height + gap
  }

  return segments
}

export function getOsteoColorPalette(modifier: OsteoWhatModifier): OsteoColorPalette {
  const strongSource =
    typeof modifier.strongColor === 'string' && modifier.strongColor.trim().length > 0
      ? modifier.strongColor
      : DEFAULT_OSTEO_STRONG_COLOR
  const weakSource =
    typeof modifier.weakColor === 'string' && modifier.weakColor.trim().length > 0
      ? modifier.weakColor
      : DEFAULT_OSTEO_WEAK_COLOR

  const strong = parseColorToRgb(strongSource, DEFAULT_STRONG_RGB)
  const weak = parseColorToRgb(weakSource, DEFAULT_WEAK_RGB)

  return {
    enabled: Boolean(modifier.enabled),
    strong,
    weak,
  }
}

export function getOsteoSegmentFillColor(
  segment: { osteoDamageRatio?: number; broken?: boolean },
  colors: OsteoColorPalette,
): string | null {
  if (!colors.enabled) return null
  if (segment.osteoDamageRatio === undefined) return null

  const ratio = segment.broken ? 1 : clamp01(segment.osteoDamageRatio)
  const color = mixRgb(colors.strong, colors.weak, ratio)
  return rgbaString(color, 1)
}

function clearRuntimeState(runtime: OsteoRuntimeState) {
  runtime.segments.left.outer = []
  runtime.segments.left.inner = []
  runtime.segments.left.missile = []
  runtime.segments.right.outer = []
  runtime.segments.right.inner = []
  runtime.segments.right.missile = []
  runtime.signature = null
}

function ensureStateLength(target: OsteoSegmentState[], length: number) {
  if (target.length > length) {
    target.length = length
    return
  }
  while (target.length < length) {
    target.push({ hits: 0, broken: false })
  }
}

function getSegmentCount(modifier: OsteoWhatModifier): number {
  const rawCount = Number.isFinite(modifier.segmentCount)
    ? Math.floor(modifier.segmentCount)
    : 6
  return Math.max(1, rawCount)
}

function getOsteoHitThreshold(modifier: OsteoWhatModifier): number {
  const rawThreshold = Number.isFinite(modifier.hitsBeforeBreak)
    ? Math.floor(modifier.hitsBeforeBreak)
    : 2
  return Math.max(1, rawThreshold)
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function mixRgb(a: RGBColor, b: RGBColor, t: number): RGBColor {
  const amount = clamp01(t)
  return {
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  }
}

function rgbaString(color: RGBColor, alpha: number): string {
  const clampedAlpha = clamp01(alpha)
  return `rgba(${clampByte(color.r)}, ${clampByte(color.g)}, ${clampByte(color.b)}, ${clampedAlpha})`
}
