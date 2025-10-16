/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import type { ApparitionModifier } from '../../../devtools'
import type { ApparitionStateMap } from './apparitionModifier'

export function getApparitionOpacity(
  states: ApparitionStateMap,
  side: 'left' | 'right',
  modifier: ApparitionModifier,
) {
  if (!modifier.enabled) return 1
  return clamp01(states[side].opacity)
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}
