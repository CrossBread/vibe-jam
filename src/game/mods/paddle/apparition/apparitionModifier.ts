/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { ApparitionModifier } from '../../../devtools'

export type ApparitionPhase = 'visibleHold' | 'fadingOut' | 'hiddenHold' | 'fadingIn'

export interface ApparitionState {
  phase: ApparitionPhase
  timer: number
  opacity: number
}

export type ApparitionStateMap = Record<'left' | 'right', ApparitionState>

export function createApparitionState(): ApparitionState {
  return { phase: 'visibleHold', timer: 0, opacity: 1 }
}

export function resetApparitionStates(
  states: ApparitionStateMap,
  modifier: ApparitionModifier,
  { randomize = false }: { randomize?: boolean } = {},
) {
  const shouldRandomize = randomize && modifier.enabled
  const visibleHold = Math.max(
    0,
    Number.isFinite(modifier.visibleHoldDuration) ? modifier.visibleHoldDuration : 3.2,
  )

  for (const side of ['left', 'right'] as const) {
    const state = states[side]
    state.phase = 'visibleHold'
    state.timer = shouldRandomize && visibleHold > 0 ? Math.random() * visibleHold : 0
    state.opacity = 1
  }
}

interface ApparitionDurations {
  fadeDuration: number
  visibleHold: number
  hiddenHold: number
  minOpacity: number
}

export function updateApparitionStates(
  states: ApparitionStateMap,
  dt: number,
  modifier: ApparitionModifier,
) {
  if (!modifier.enabled) {
    for (const side of ['left', 'right'] as const) {
      const state = states[side]
      state.phase = 'visibleHold'
      state.timer = 0
      state.opacity = 1
    }
    return
  }

  const durations: ApparitionDurations = {
    fadeDuration: Math.max(0, Number.isFinite(modifier.fadeDuration) ? modifier.fadeDuration : 0.8),
    visibleHold: Math.max(
      0,
      Number.isFinite(modifier.visibleHoldDuration) ? modifier.visibleHoldDuration : 3.2,
    ),
    hiddenHold: Math.max(
      0,
      Number.isFinite(modifier.hiddenHoldDuration) ? modifier.hiddenHoldDuration : 1.4,
    ),
    minOpacity: clamp01(Number.isFinite(modifier.minOpacity) ? modifier.minOpacity : 0.05),
  }

  for (const side of ['left', 'right'] as const) {
    advanceApparitionState(states[side], dt, durations)
  }
}

function advanceApparitionState(
  state: ApparitionState,
  dt: number,
  durations: ApparitionDurations,
) {
  state.timer += dt
  let iterations = 0
  while (iterations < 8) {
    iterations += 1
    switch (state.phase) {
      case 'visibleHold': {
        const duration = durations.visibleHold
        if (duration <= 0) {
          state.phase =
            durations.fadeDuration > 0
              ? 'fadingOut'
              : durations.hiddenHold > 0
              ? 'hiddenHold'
              : 'fadingIn'
          state.timer = Math.max(state.timer, 0)
          continue
        }
        if (state.timer < duration) {
          state.opacity = 1
          return
        }
        state.timer -= duration
        state.opacity = 1
        state.phase =
          durations.fadeDuration > 0
            ? 'fadingOut'
            : durations.hiddenHold > 0
            ? 'hiddenHold'
            : 'fadingIn'
        continue
      }
      case 'fadingOut': {
        const duration = durations.fadeDuration
        if (duration <= 0) {
          state.phase = durations.hiddenHold > 0 ? 'hiddenHold' : 'fadingIn'
          state.opacity = durations.minOpacity
          state.timer = Math.max(state.timer, 0)
          continue
        }
        if (state.timer < duration) {
          const progress = clamp01(state.timer / duration)
          state.opacity = 1 - (1 - durations.minOpacity) * progress
          return
        }
        state.timer -= duration
        state.opacity = durations.minOpacity
        state.phase = durations.hiddenHold > 0 ? 'hiddenHold' : 'fadingIn'
        continue
      }
      case 'hiddenHold': {
        const duration = durations.hiddenHold
        if (duration <= 0) {
          state.phase = durations.fadeDuration > 0 ? 'fadingIn' : 'visibleHold'
          state.timer = Math.max(state.timer, 0)
          continue
        }
        if (state.timer < duration) {
          state.opacity = durations.minOpacity
          return
        }
        state.timer -= duration
        state.opacity = durations.minOpacity
        state.phase = durations.fadeDuration > 0 ? 'fadingIn' : 'visibleHold'
        continue
      }
      case 'fadingIn': {
        const duration = durations.fadeDuration
        if (duration <= 0) {
          state.phase = 'visibleHold'
          state.opacity = 1
          state.timer = Math.max(state.timer, 0)
          continue
        }
        if (state.timer < duration) {
          const progress = clamp01(state.timer / duration)
          state.opacity = durations.minOpacity + (1 - durations.minOpacity) * progress
          return
        }
        state.timer -= duration
        state.opacity = 1
        state.phase = 'visibleHold'
        continue
      }
      default: {
        state.phase = 'visibleHold'
        state.timer = 0
        state.opacity = 1
        return
      }
    }
  }

  state.timer = 0
  state.opacity = state.phase === 'hiddenHold' ? durations.minOpacity : 1
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}
