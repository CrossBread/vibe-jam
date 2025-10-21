/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import {
  ANIMATION_CURVE_OPTIONS,
  BALL_MODIFIER_KEYS,
  GRAVITY_WELL_KEYS,
  PADDLE_MODIFIER_KEYS,
  deepClone,
  type AnimationCurve,
  type DevConfig,
  type DoublesConfig,
  type GravityWellModifier,
  type KiteModifier,
  type ModifiersConfig,
  type ModifierBase,
  type BumShuffleModifier,
  type PollokModifier,
  type SnowballModifier,
  type MeteorModifier,
  type ApparitionModifier,
  type OutOfBodyModifier,
  type BendyModifier,
  type ChillyModifier,
  type BuckToothModifier,
  type OsteoWhatModifier,
  type BrokePhysicsModifier,
  type HadronModifier,
  type FoosballModifier,
  type DizzyModifier,
  type BungeeModifier,
  type MissileCommanderModifier,
  type FrisbeeModifier,
  type DundeeModifier,
  type UISettings,
} from './devtools'
import { arenaModifierBuilders } from './mods/arena'
import { ballModifierBuilders } from './mods/ball'
import { paddleModifierBuilders } from './mods/paddle'
import {
  createSliderControl,
  createToggleControl,
  type CreateModifierDetails,
} from './mods/shared'

export const DEV_OVERLAY_STATS_TOGGLE_EVENT = 'devtools:stats-toggle'

export interface DevOverlayStatsToggleDetail {
  enabled: boolean
}

export interface DevOverlayStatsSnapshot {
  averageFps: number
  averageFrameTime: number
  onePercentLowFps: number
  longFrameShare: number
  longFrameThresholdMs: number
  worstFrameTime: number
  sampleCount: number
}

export interface DevOverlayApi {
  setStatsEnabled(enabled: boolean): void
  updateStats(stats: DevOverlayStatsSnapshot | null): void
}

export type DevOverlayElement = HTMLDivElement & {
  __devtools?: DevOverlayApi
}

let devOverlayStylesInjected = false

type ModifierSection = 'paddle' | 'ball' | 'arena'

const FILTER_CATEGORY_LABELS = {
  arena: 'Arena',
  ball: 'Ball',
  ballSize: 'Ball Size',
  ballVisuals: 'Ball Visuals',
  gravity: 'Gravity',
  paddle: 'Paddle',
  paddleControl: 'Paddle Control',
  paddleSize: 'Paddle Size',
  paddleSpeed: 'Paddle Speed',
  projectiles: 'Projectiles',
  visibility: 'Visibility',
} as const

type FilterCategory = keyof typeof FILTER_CATEGORY_LABELS

const SECTION_BASE_CATEGORIES: Record<ModifierSection, FilterCategory[]> = {
  arena: ['arena', 'gravity'],
  ball: ['ball'],
  paddle: ['paddle'],
}

const MODIFIER_CATEGORY_OVERRIDES: Record<string, FilterCategory[]> = {
  'arena:drinkMe': ['paddleSize'],
  'arena:fogOfWar': ['visibility'],
  'arena:searchLight': ['visibility'],
  'arena:spaceInvaders': ['projectiles'],
  'arena:teaParty': ['paddleSize'],
  'arena:wonderland': ['visibility'],
  'ball:bumShuffle': ['ballVisuals'],
  'ball:kite': ['ballVisuals'],
  'ball:meteor': ['ballSize'],
  'ball:pollok': ['ballVisuals'],
  'ball:snowball': ['ballSize'],
  'paddle:angry': ['paddleSpeed'],
  'paddle:apparition': ['visibility'],
  'paddle:bendy': ['paddleSize'],
  'paddle:brokePhysics': ['paddleControl'],
  'paddle:buckTooth': ['paddleSize'],
  'paddle:bungee': ['paddleControl'],
  'paddle:charlotte': ['visibility'],
  'paddle:chilly': ['paddleSize'],
  'paddle:crabby': ['paddleControl'],
  'paddle:dizzy': ['paddleControl'],
  'paddle:dundee': ['paddleSpeed'],
  'paddle:foosball': ['paddleSize'],
  'paddle:frisbee': ['projectiles'],
  'paddle:hadron': ['projectiles'],
  'paddle:inchworm': ['paddleControl'],
  'paddle:missileCommander': ['projectiles'],
  'paddle:outOfBody': ['visibility'],
  'paddle:osteoWhat': ['paddleSize'],
  'paddle:slinky': ['paddleSize'],
}

const MODIFIER_BASE_FIELDS = new Set(['name', 'description', 'enabled', 'includeInRandom'])

const COSMETIC_EXACT_KEYS = new Set([
  'radius',
  'sampleInterval',
  'tailLength',
  'trailFade',
  'trailLength',
])

const COSMETIC_KEY_PREFIXES = ['snowflake'] as const

const COSMETIC_KEYS_BY_MOD_PATH = new Map<string, ReadonlySet<string>>()

function isCopyableParameterValue(value: unknown): value is number | string | boolean {
  return (
    typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean'
  )
}

function isCosmeticParameter(
  key: string,
  value: unknown,
  modSpecificCosmetics: ReadonlySet<string> | null,
): boolean {
  if (modSpecificCosmetics?.has(key)) {
    return true
  }

  if (COSMETIC_EXACT_KEYS.has(key)) {
    return true
  }

  const lowerKey = key.toLowerCase()
  if (lowerKey.includes('color') || lowerKey.includes('tint')) {
    return true
  }

  if (lowerKey.includes('brightness') || lowerKey.includes('opacity')) {
    return true
  }

  for (const prefix of COSMETIC_KEY_PREFIXES) {
    if (lowerKey.startsWith(prefix)) {
      return true
    }
  }

  return false
}

function collectNonCosmeticParameters(
  modPath: string,
  modifier: ModifierBase,
): Record<string, number | string | boolean> {
  const result: Record<string, number | string | boolean> = {}
  const modSpecificCosmetics = COSMETIC_KEYS_BY_MOD_PATH.get(modPath) ?? null

  for (const key of Object.keys(modifier) as (keyof typeof modifier)[]) {
    if (MODIFIER_BASE_FIELDS.has(key as string)) {
      continue
    }

    const value = modifier[key]

    if (!isCopyableParameterValue(value)) {
      continue
    }

    if (isCosmeticParameter(key as string, value, modSpecificCosmetics)) {
      continue
    }

    result[key as string] = value
  }

  return result
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function collectModifierCategories(
  section: ModifierSection,
  key: string,
  modifier: unknown,
): FilterCategory[] {
  const categories = new Set<FilterCategory>(SECTION_BASE_CATEGORIES[section] ?? [])
  const overrideKey = `${section}:${key}`
  const overrides = MODIFIER_CATEGORY_OVERRIDES[overrideKey]
  if (overrides) {
    overrides.forEach(category => categories.add(category))
  }

  if (!isRecord(modifier)) {
    return Array.from(categories)
  }

  if (
    section === 'paddle' &&
    Object.prototype.hasOwnProperty.call(modifier, 'paddleSizeMultiplier')
  ) {
    categories.add('paddleSize')
  }

  if (
    section === 'ball' &&
    (Object.prototype.hasOwnProperty.call(modifier, 'minRadius') ||
      Object.prototype.hasOwnProperty.call(modifier, 'maxRadius'))
  ) {
    categories.add('ballSize')
  }

  if (
    section === 'arena' &&
    Object.prototype.hasOwnProperty.call(modifier, 'gravityStrength')
  ) {
    categories.add('gravity')
  }

  return Array.from(categories)
}

interface DevOverlayOptions {
  onDockChange?: (docked: boolean) => void
}

function ensureDevOverlayStyles() {
  if (devOverlayStylesInjected) return
  const style = document.createElement('style')
  style.textContent = `
    .dev-overlay-container {
      position: relative;
    }
    .dev-overlay-container.dev-overlay-container--docked {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      width: 100%;
      box-sizing: border-box;
      padding: 16px;
      flex-wrap: nowrap;
    }
    .dev-overlay-container.dev-overlay-container--docked canvas {
      flex: 1 1 auto;
      min-width: 0;
      height: auto;
      max-width: 100%;
      max-height: calc(100vh - 32px);
    }
    .dev-overlay {
      position: fixed;
      top: 16px;
      right: 16px;
      width: 280px;
      padding: 16px;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.95);
      color: #e2e8f0;
      border: 1px solid rgba(148, 163, 184, 0.35);
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.45);
      font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      line-height: 1.4;
      z-index: 9999;
      display: none;
      backdrop-filter: blur(10px);
      max-height: calc(100vh - 32px);
      overflow-y: auto;
      touch-action: pan-y;
      -webkit-overflow-scrolling: touch;
    }
    .dev-overlay.dev-overlay--visible {
      display: block;
    }
    .dev-overlay.dev-overlay--docked {
      position: relative;
      top: 0;
      right: 0;
      margin: 0;
      height: calc(100vh - 32px);
      max-height: none;
      width: 320px;
      display: none;
      flex: 0 0 320px;
    }
    .dev-overlay.dev-overlay--docked.dev-overlay--visible {
      display: flex;
      flex-direction: column;
    }
    @media (max-width: 768px) {
      .dev-overlay-container.dev-overlay-container--docked {
        flex-direction: column;
        align-items: stretch;
        justify-content: center;
        gap: 12px;
        padding: 12px;
      }
      .dev-overlay-container.dev-overlay-container--docked canvas {
        max-height: none;
        width: 100%;
      }
      .dev-overlay.dev-overlay--docked {
        width: 100%;
        max-width: none;
        height: auto;
        max-height: min(70vh, 520px);
      }
    }
    .dev-overlay__title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .dev-overlay__title-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
    }
    .dev-overlay__title-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dev-overlay__dock-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(226, 232, 240, 0.7);
      cursor: pointer;
      white-space: nowrap;
    }
    .dev-overlay__dock-toggle input {
      width: 14px;
      height: 14px;
    }
    .dev-overlay__hint {
      color: rgba(226, 232, 240, 0.65);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      white-space: nowrap;
    }
    .dev-overlay__collapse-all {
      background: none;
      border: 1px solid rgba(148, 163, 184, 0.35);
      color: inherit;
      border-radius: 6px;
      font-size: 11px;
      padding: 4px 8px;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .dev-overlay__collapse-all:hover {
      background: rgba(71, 85, 105, 0.35);
      border-color: rgba(148, 163, 184, 0.6);
    }
    .dev-overlay__search {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    .dev-overlay__search-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .dev-overlay__search-input {
      flex: 1;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      background: rgba(15, 23, 42, 0.6);
      color: inherit;
      font-size: 13px;
      line-height: 1.3;
    }
    .dev-overlay__search-input::placeholder {
      color: rgba(226, 232, 240, 0.5);
    }
    .dev-overlay__filter {
      position: relative;
      display: flex;
      align-items: center;
    }
    .dev-overlay__filter-button {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      background: rgba(15, 23, 42, 0.6);
      color: inherit;
      font-size: 12px;
      cursor: pointer;
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .dev-overlay__filter-button:hover {
      border-color: rgba(148, 163, 184, 0.75);
    }
    .dev-overlay__filter-button--active {
      border-color: rgba(129, 140, 248, 0.85);
      background: rgba(79, 70, 229, 0.25);
    }
    .dev-overlay__filter-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      min-width: 200px;
      padding: 12px;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(148, 163, 184, 0.35);
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.45);
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 10000;
    }
    .dev-overlay__filter-menu[hidden] {
      display: none;
    }
    .dev-overlay__filter-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .dev-overlay__filter-option {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }
    .dev-overlay__filter-option input {
      accent-color: #6366f1;
    }
    .dev-overlay__search-error {
      min-height: 16px;
      font-size: 12px;
      color: #f97316;
    }
    .dev-overlay__content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .dev-overlay__controls {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .dev-overlay__control {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .dev-overlay__label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 500;
      gap: 8px;
    }
    .dev-overlay__value {
      font-variant-numeric: tabular-nums;
      color: rgba(226, 232, 240, 0.85);
    }
    .dev-overlay__card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 14px;
      border-radius: 12px;
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.25);
    }
    .dev-overlay__card--active {
      border-color: rgba(96, 165, 250, 0.55);
      box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.15);
    }
    .dev-overlay__card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .dev-overlay__card-title {
      font-size: 13px;
      font-weight: 600;
      color: rgba(226, 232, 240, 0.92);
    }
    .dev-overlay__card-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .dev-overlay__card-empty {
      margin: 0;
      font-size: 12px;
      color: rgba(226, 232, 240, 0.75);
    }
    .dev-overlay__card-meta {
      font-size: 11px;
      color: rgba(148, 163, 184, 0.9);
    }
    .dev-overlay__card-hint {
      font-size: 11px;
      color: rgba(148, 163, 184, 0.75);
    }
    .dev-overlay__card summary {
      list-style: none;
      cursor: pointer;
    }
    .dev-overlay__card summary::-webkit-details-marker {
      display: none;
    }
    .dev-overlay__metrics {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }
    .dev-overlay__metric {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 10px;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.18);
    }
    .dev-overlay__metric-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(148, 163, 184, 0.85);
    }
    .dev-overlay__metric-value {
      font-size: 18px;
      font-weight: 600;
      color: rgba(226, 232, 240, 0.95);
      font-variant-numeric: tabular-nums;
    }
    .dev-overlay__metric-description {
      font-size: 11px;
      color: rgba(148, 163, 184, 0.8);
    }
    .dev-overlay__toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: rgba(226, 232, 240, 0.85);
      cursor: pointer;
    }
    .dev-overlay__toggle-input {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }
    .dev-overlay__toggle-status {
      font-weight: 600;
      color: rgba(96, 165, 250, 0.9);
      font-variant-numeric: tabular-nums;
    }
    .dev-overlay__section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 12px;
      margin-top: 12px;
      border-top: 1px solid rgba(148, 163, 184, 0.35);
    }
    .dev-overlay__section-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(226, 232, 240, 0.7);
    }
    .dev-overlay__modifiers {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .dev-overlay__section-empty {
      margin: 4px 0 0;
      font-size: 12px;
      color: rgba(226, 232, 240, 0.65);
    }
    .dev-overlay__modifier {
      border-radius: 10px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
      overflow: hidden;
    }
    .dev-overlay__modifier summary {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      padding: 10px 36px 10px 10px;
      font-weight: 500;
      cursor: pointer;
      list-style: none;
      position: relative;
    }
    .dev-overlay__modifier summary::-webkit-details-marker {
      display: none;
    }
    .dev-overlay__modifier summary::after {
      content: '';
      width: 8px;
      height: 8px;
      border-right: 2px solid rgba(226, 232, 240, 0.7);
      border-bottom: 2px solid rgba(226, 232, 240, 0.7);
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
      transition: transform 0.2s ease;
    }
    .dev-overlay__modifier[open] summary::after {
      transform: translateY(-50%) rotate(225deg);
    }
    .dev-overlay__modifier-header {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }
    .dev-overlay__modifier-toggle {
      flex-shrink: 0;
    }
    .dev-overlay__modifier-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .dev-overlay__modifier-copy-button {
      margin-left: auto;
      margin-right: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.4);
      background: rgba(59, 130, 246, 0.12);
      color: rgba(226, 232, 240, 0.95);
      font-size: 12px;
      font-weight: 600;
      line-height: 1.2;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
    }
    .dev-overlay__modifier-copy-button:hover {
      background: rgba(59, 130, 246, 0.22);
      border-color: rgba(148, 163, 184, 0.55);
      color: rgba(226, 232, 240, 1);
    }
    .dev-overlay__modifier-copy-button:focus-visible {
      outline: 2px solid rgba(96, 165, 250, 0.9);
      outline-offset: 2px;
      box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.6);
    }
    .dev-overlay__modifier-copy-icon {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
    }
    .dev-overlay__collapsible {
      border-top: 1px solid rgba(148, 163, 184, 0.35);
      padding-top: 12px;
      margin-top: 12px;
    }
    .dev-overlay__collapsible summary {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(226, 232, 240, 0.7);
      cursor: pointer;
      list-style: none;
    }
    .dev-overlay__collapsible summary::-webkit-details-marker {
      display: none;
    }
    .dev-overlay__collapsible summary::after {
      content: '';
      width: 8px;
      height: 8px;
      border-right: 2px solid rgba(226, 232, 240, 0.7);
      border-bottom: 2px solid rgba(226, 232, 240, 0.7);
      transform: rotate(45deg);
      margin-left: auto;
      transition: transform 0.2s ease;
    }
    .dev-overlay__collapsible[open] summary::after {
      transform: rotate(225deg);
    }
    .dev-overlay__collapsible-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 12px;
      margin-top: 12px;
      border-top: 1px solid rgba(148, 163, 184, 0.35);
    }
    .dev-overlay__modifier-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0 10px 10px;
    }
    .dev-overlay__description {
      margin: 0;
      color: rgba(226, 232, 240, 0.75);
      font-size: 12px;
    }
    .dev-overlay__buttons {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 16px;
    }
    .dev-overlay__buttons-row {
      display: flex;
      gap: 8px;
    }
    .dev-overlay__button {
      flex: 1;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: rgba(51, 65, 85, 0.6);
      color: inherit;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .dev-overlay__button:hover {
      background: rgba(71, 85, 105, 0.65);
      border-color: rgba(148, 163, 184, 0.6);
    }
    .dev-overlay input,
    .dev-overlay button,
    .dev-overlay select,
    .dev-overlay summary {
      touch-action: manipulation;
    }
    .dev-overlay__status {
      margin-top: 12px;
      font-size: 12px;
      color: rgba(148, 163, 184, 0.9);
    }
    .dev-overlay__status--error {
      color: #f87171;
    }
    .dev-overlay__scroll-top {
      width: 100%;
      margin-top: 12px;
    }
    .dev-overlay input[type='range'] {
      width: 100%;
    }
    .dev-overlay__text-input,
    .dev-overlay__select {
      width: 100%;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: rgba(15, 23, 42, 0.6);
      color: inherit;
      font-size: 13px;
      line-height: 1.3;
    }
    .dev-overlay__text-input::placeholder {
      color: rgba(226, 232, 240, 0.5);
    }
    .dev-overlay__select {
      appearance: none;
      -webkit-appearance: none;
      background-image: url('data:image/svg+xml;utf8,<svg fill="none" stroke="%23e2e8f0" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6"/></svg>');
      background-repeat: no-repeat;
      background-position: right 10px center;
      background-size: 16px 16px;
      padding-right: 32px;
    }
    .dev-overlay__color-input {
      width: 100%;
      height: 32px;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.35);
      background: rgba(15, 23, 42, 0.35);
      padding: 0;
      cursor: pointer;
    }
    .dev-overlay__color-input::-webkit-color-swatch-wrapper {
      padding: 0;
    }
    .dev-overlay__color-input::-webkit-color-swatch {
      border: none;
      border-radius: 6px;
    }
    .dev-overlay__color-input::-moz-color-swatch {
      border: none;
      border-radius: 6px;
    }
    .dev-overlay input[type='checkbox'] {
      width: 16px;
      height: 16px;
    }
  `
  document.head.appendChild(style)
  devOverlayStylesInjected = true
}

export function createDevOverlay(
  config: DevConfig,
  defaults: DevConfig,
  options: DevOverlayOptions = {},
): DevOverlayElement {
  ensureDevOverlayStyles()

  const overlay = document.createElement('div') as DevOverlayElement
  overlay.className = 'dev-overlay'
  overlay.classList.add('dev-overlay--docked')
  overlay.setAttribute('aria-hidden', 'true')

  const { onDockChange } = options

  interface ModifierEntry {
    element: HTMLDetailsElement
    section: ModifierSection
    key: string
    name: string
    description: string
    categories: FilterCategory[]
  }

  interface SectionState {
    container: HTMLElement
    list: HTMLDivElement
    emptyMessage: HTMLParagraphElement
  }

  const staticCollapsibleSections: HTMLDetailsElement[] = []
  const collapsibleSections: HTMLDetailsElement[] = []
  const modifierEntries: ModifierEntry[] = []
  const sectionStates: Partial<Record<ModifierSection, SectionState>> = {}
  let searchTerm = ''
  const activeFilters = new Set<FilterCategory>()

  const title = document.createElement('div')
  title.className = 'dev-overlay__title'

  const heading = document.createElement('span')
  heading.textContent = 'Dev Controls'

  const titleMeta = document.createElement('div')
  titleMeta.className = 'dev-overlay__title-meta'

  const titleActions = document.createElement('div')
  titleActions.className = 'dev-overlay__title-actions'

  const hint = document.createElement('span')
  hint.className = 'dev-overlay__hint'
  hint.textContent = 'Press ` or hold 3 fingers to open'

  const collapseAllButton = document.createElement('button')
  collapseAllButton.type = 'button'
  collapseAllButton.className = 'dev-overlay__collapse-all'
  collapseAllButton.textContent = 'Expand All'

  function updateCollapseButtonLabel() {
    const hasClosed = collapsibleSections.some(section => !section.open)
    collapseAllButton.textContent = hasClosed ? 'Expand All' : 'Collapse All'
  }

  function trackCollapsible(section: HTMLDetailsElement) {
    section.addEventListener('toggle', updateCollapseButtonLabel)
    return section
  }

  const dockToggleLabel = document.createElement('label')
  dockToggleLabel.className = 'dev-overlay__dock-toggle'

  const dockToggle = document.createElement('input')
  dockToggle.type = 'checkbox'
  dockToggle.checked = true
  dockToggle.addEventListener('change', () => {
    const docked = dockToggle.checked
    overlay.classList.toggle('dev-overlay--docked', docked)
    onDockChange?.(docked)
  })
  overlay.classList.toggle('dev-overlay--docked', dockToggle.checked)

  const dockToggleText = document.createElement('span')
  dockToggleText.textContent = 'Dock panel'

  dockToggleLabel.appendChild(dockToggle)
  dockToggleLabel.appendChild(dockToggleText)

  titleActions.appendChild(dockToggleLabel)
  titleActions.appendChild(collapseAllButton)

  titleMeta.appendChild(hint)
  titleMeta.appendChild(titleActions)
  title.appendChild(heading)
  title.appendChild(titleMeta)

  const searchContainer = document.createElement('div')
  searchContainer.className = 'dev-overlay__search'

  const searchControls = document.createElement('div')
  searchControls.className = 'dev-overlay__search-controls'

  const searchInput = document.createElement('input')
  searchInput.type = 'search'
  searchInput.className = 'dev-overlay__search-input'
  searchInput.placeholder = 'Search modifiers (regex)…'

  const filterWrapper = document.createElement('div')
  filterWrapper.className = 'dev-overlay__filter'

  const filterButton = document.createElement('button')
  filterButton.type = 'button'
  filterButton.className = 'dev-overlay__filter-button'
  filterButton.textContent = 'Filters'

  const filterMenu = document.createElement('div')
  filterMenu.className = 'dev-overlay__filter-menu'
  filterMenu.hidden = true

  const filterOptionsList = document.createElement('div')
  filterOptionsList.className = 'dev-overlay__filter-options'
  filterMenu.appendChild(filterOptionsList)

  const sortedFilterEntries = Object.entries(FILTER_CATEGORY_LABELS).sort((a, b) =>
    a[1].localeCompare(b[1]),
  )

  for (const [value, label] of sortedFilterEntries) {
    const option = document.createElement('label')
    option.className = 'dev-overlay__filter-option'

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.value = value
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        activeFilters.add(value as FilterCategory)
      } else {
        activeFilters.delete(value as FilterCategory)
      }
      applyFilters()
    })

    const optionLabel = document.createElement('span')
    optionLabel.textContent = label

    option.appendChild(checkbox)
    option.appendChild(optionLabel)
    filterOptionsList.appendChild(option)
  }

  filterButton.addEventListener('click', event => {
    event.stopPropagation()
    filterMenu.hidden = !filterMenu.hidden
  })

  filterMenu.addEventListener('click', event => {
    event.stopPropagation()
  })

  document.addEventListener('click', event => {
    if (filterMenu.hidden) return
    const target = event.target as Node | null
    if (!filterMenu.contains(target) && target !== filterButton) {
      filterMenu.hidden = true
    }
  })

  filterWrapper.appendChild(filterButton)
  filterWrapper.appendChild(filterMenu)

  searchControls.appendChild(searchInput)
  searchControls.appendChild(filterWrapper)

  const searchError = document.createElement('div')
  searchError.className = 'dev-overlay__search-error'

  searchContainer.appendChild(searchControls)
  searchContainer.appendChild(searchError)

  searchInput.addEventListener('input', () => {
    searchTerm = searchInput.value
    applyFilters()
  })

  const content = document.createElement('div')
  content.className = 'dev-overlay__content'

  function applyFilters() {
    const trimmed = searchTerm.trim()
    let regex: RegExp | null = null
    let regexValid = true
    let regexErrorMessage = ''

    if (trimmed) {
      try {
        regex = new RegExp(trimmed, 'i')
      } catch (error) {
        regexValid = false
        regexErrorMessage =
          error instanceof Error ? error.message : String(error)
      }
    }

    if (!regexValid && trimmed) {
      const message = regexErrorMessage || 'Unknown error'
      searchError.textContent = 'Invalid search pattern: ' + message
    } else {
      searchError.textContent = ''
    }

    const hasFilters = activeFilters.size > 0
    const hasSearch = trimmed.length > 0
    const hasValidSearch = !hasSearch || regex !== null

    if (hasSearch) {
      collapsibleSections.forEach(section => {
        if (section.open) {
          section.open = false
        }
      })
    }

    modifierEntries.forEach(entry => {
      const matchesSearch = !hasSearch
        ? true
        : regex
        ? regex.test(entry.name) || regex.test(entry.description)
        : false
      const matchesFilter =
        !hasFilters || entry.categories.some(category => activeFilters.has(category))
      const visible = matchesSearch && matchesFilter && hasValidSearch
      entry.element.style.display = visible ? '' : 'none'
    })

    const hasActiveConstraints = hasFilters || (hasSearch && hasValidSearch)

    Object.values(sectionStates).forEach(state => {
      if (!state) return
      const hasVisibleChild = Array.from(state.list.children).some(child => {
        return (child as HTMLElement).style.display !== 'none'
      })
      state.list.style.display = hasVisibleChild ? '' : 'none'
      state.emptyMessage.style.display = hasActiveConstraints && !hasVisibleChild ? '' : 'none'
    })

    filterButton.classList.toggle('dev-overlay__filter-button--active', hasFilters)

    if (hasSearch && !hasValidSearch) {
      collapsibleSections.forEach(section => {
        if (!section.open) {
          section.open = true
        }
      })
    }

    updateCollapseButtonLabel()
  }

  type MetricKey =
    | 'averageFps'
    | 'averageFrameTime'
    | 'onePercentLowFps'
    | 'longFrameShare'

  const statsCard = document.createElement('details')
  statsCard.className = 'dev-overlay__card'
  statsCard.open = false
  staticCollapsibleSections.push(trackCollapsible(statsCard))

  const statsHeader = document.createElement('div')
  statsHeader.className = 'dev-overlay__card-header'

  const statsTitle = document.createElement('div')
  statsTitle.className = 'dev-overlay__card-title'
  statsTitle.textContent = 'Performance Stats'

  const statsToggle = document.createElement('label')
  statsToggle.className = 'dev-overlay__toggle'

  const statsToggleInput = document.createElement('input')
  statsToggleInput.type = 'checkbox'
  statsToggleInput.className = 'dev-overlay__toggle-input'
  statsToggleInput.title = 'Enable performance stats'
  statsToggleInput.setAttribute('aria-label', 'Enable performance stats')

  const statsToggleLabel = document.createElement('span')
  statsToggleLabel.textContent = 'Show stats'

  const statsToggleStatus = document.createElement('span')
  statsToggleStatus.className = 'dev-overlay__toggle-status'

  statsToggle.appendChild(statsToggleInput)
  statsToggle.appendChild(statsToggleLabel)
  statsToggle.appendChild(statsToggleStatus)

  statsHeader.appendChild(statsTitle)
  statsHeader.appendChild(statsToggle)

  const statsSummary = document.createElement('summary')
  statsSummary.appendChild(statsHeader)

  const statsBody = document.createElement('div')
  statsBody.className = 'dev-overlay__card-body'

  const statsMetrics = document.createElement('div')
  statsMetrics.className = 'dev-overlay__metrics'
  statsMetrics.hidden = true

  const metricValueElements = {} as Record<MetricKey, HTMLSpanElement>
  let longFrameLabelEl: HTMLSpanElement | null = null

  const metricsConfig: Array<{
    key: MetricKey
    label: string
    description: string
  }> = [
    {
      key: 'averageFps',
      label: 'Average FPS',
      description: 'Rolling window',
    },
    {
      key: 'averageFrameTime',
      label: 'Avg Frame Time',
      description: 'Milliseconds',
    },
    {
      key: 'onePercentLowFps',
      label: '1% Low FPS',
      description: '99th percentile',
    },
    {
      key: 'longFrameShare',
      label: 'Long Frames (> 20 ms)',
      description: 'Share of slow frames',
    },
  ]

  for (const metric of metricsConfig) {
    const metricEl = document.createElement('div')
    metricEl.className = 'dev-overlay__metric'

    const metricLabel = document.createElement('span')
    metricLabel.className = 'dev-overlay__metric-label'
    metricLabel.textContent = metric.label
    if (metric.key === 'longFrameShare') {
      longFrameLabelEl = metricLabel
    }

    const metricValue = document.createElement('span')
    metricValue.className = 'dev-overlay__metric-value'
    metricValue.textContent = '–'

    const metricDescription = document.createElement('span')
    metricDescription.className = 'dev-overlay__metric-description'
    metricDescription.textContent = metric.description

    metricEl.appendChild(metricLabel)
    metricEl.appendChild(metricValue)
    metricEl.appendChild(metricDescription)
    statsMetrics.appendChild(metricEl)

    metricValueElements[metric.key] = metricValue
  }

  const statsEmpty = document.createElement('p')
  statsEmpty.className = 'dev-overlay__card-empty'
  statsEmpty.textContent = 'Performance stats are disabled.'

  const statsMeta = document.createElement('div')
  statsMeta.className = 'dev-overlay__card-meta'
  statsMeta.hidden = true

  const statsHint = document.createElement('div')
  statsHint.className = 'dev-overlay__card-hint'
  statsHint.textContent =
    'Rolling window: last 240 frames (~4s). Frame budget (60fps): 16.7 ms.'

  statsBody.appendChild(statsMetrics)
  statsBody.appendChild(statsEmpty)
  statsBody.appendChild(statsMeta)
  statsBody.appendChild(statsHint)

  statsCard.appendChild(statsSummary)
  statsCard.appendChild(statsBody)

  let statsEnabled = false
  let hasStatsData = false

  function formatNumber(value: number, fractionDigits: number) {
    if (!Number.isFinite(value)) return '–'
    return value.toFixed(fractionDigits)
  }

  function renderStats(stats: DevOverlayStatsSnapshot | null) {
    if (!statsEnabled) {
      hasStatsData = false
      statsMetrics.hidden = true
      statsMeta.hidden = true
      statsMeta.textContent = ''
      statsEmpty.hidden = false
      statsEmpty.textContent = 'Performance stats are disabled.'
      return
    }

    if (!stats) {
      hasStatsData = false
      statsMetrics.hidden = true
      statsMeta.hidden = true
      statsMeta.textContent = ''
      statsEmpty.hidden = false
      statsEmpty.textContent = 'Collecting samples…'
      return
    }

    hasStatsData = true
    statsMetrics.hidden = false
    statsEmpty.hidden = true
    statsMeta.hidden = false

    metricValueElements.averageFps.textContent = formatNumber(stats.averageFps, 1)
    metricValueElements.averageFrameTime.textContent = `${formatNumber(stats.averageFrameTime, 1)} ms`
    metricValueElements.onePercentLowFps.textContent = formatNumber(
      stats.onePercentLowFps,
      1,
    )
    metricValueElements.longFrameShare.textContent = `${formatNumber(
      stats.longFrameShare,
      1,
    )}%`

    if (longFrameLabelEl) {
      longFrameLabelEl.textContent = `Long Frames (> ${formatNumber(
        stats.longFrameThresholdMs,
        1,
      )} ms)`
    }

    statsMeta.textContent = `Samples: ${stats.sampleCount} • Worst: ${formatNumber(
      stats.worstFrameTime,
      1,
    )} ms`
  }

  function setStatsEnabled(
    next: boolean,
    { emitEvent = false }: { emitEvent?: boolean } = {},
  ) {
    const stateChanged = statsEnabled !== next
    statsEnabled = next
    statsToggleInput.checked = next
    statsToggleStatus.textContent = next ? 'On' : 'Off'
    statsCard.classList.toggle('dev-overlay__card--active', next)

    if (next) {
      statsCard.open = true
    }

    if (!next) {
      hasStatsData = false
      statsMetrics.hidden = true
      statsMeta.hidden = true
      statsMeta.textContent = ''
      statsEmpty.hidden = false
      statsEmpty.textContent = 'Performance stats are disabled.'
    } else if (!hasStatsData) {
      statsMetrics.hidden = true
      statsMeta.hidden = true
      statsMeta.textContent = ''
      statsEmpty.hidden = false
      statsEmpty.textContent = 'Collecting samples…'
    }

    if (emitEvent && stateChanged) {
      overlay.dispatchEvent(
        new CustomEvent<DevOverlayStatsToggleDetail>(
          DEV_OVERLAY_STATS_TOGGLE_EVENT,
          {
            detail: { enabled: next },
            bubbles: true,
          },
        ),
      )
    }
  }

  statsToggleInput.addEventListener('change', () => {
    setStatsEnabled(statsToggleInput.checked, { emitEvent: true })
  })

  overlay.__devtools = {
    setStatsEnabled,
    updateStats: renderStats,
  }

  setStatsEnabled(false)
  renderStats(null)

  content.appendChild(statsCard)

  const controls = document.createElement('div')
  controls.className = 'dev-overlay__controls'

  const paddleSection = document.createElement('div')

  const ballSection = document.createElement('div')

  const arenaSection = document.createElement('div')

  const buttons = document.createElement('div')
  buttons.className = 'dev-overlay__buttons'

  const buttonsRow = document.createElement('div')
  buttonsRow.className = 'dev-overlay__buttons-row'

  const status = document.createElement('div')
  status.className = 'dev-overlay__status'

  const scrollTopButton = createOverlayButton('Scroll to Top')
  scrollTopButton.classList.add('dev-overlay__scroll-top')
  scrollTopButton.addEventListener('click', () => {
    overlay.scrollTo({ top: 0, behavior: 'smooth' })
  })

  function setStatus(message: string, variant: 'default' | 'error' = 'default') {
    status.textContent = message
    status.classList.toggle('dev-overlay__status--error', variant === 'error')
  }

  function renderControls() {
    controls.innerHTML = ''
    paddleSection.innerHTML = ''
    ballSection.innerHTML = ''
    arenaSection.innerHTML = ''
    modifierEntries.length = 0

    const dynamicCollapsibleSections: HTMLDetailsElement[] = []

    const createHeading = (label: string) => {
      const heading = document.createElement('div')
      heading.className = 'dev-overlay__section-title'
      heading.textContent = label
      return heading
    }

    const createTextControl = (
      label: string,
      value: string,
      options: { placeholder?: string; onCommit: (value: string) => string },
    ) => {
      const wrapper = document.createElement('label')
      wrapper.className = 'dev-overlay__control'

      const title = document.createElement('div')
      title.className = 'dev-overlay__label'
      title.textContent = label

      const valueEl = document.createElement('span')
      valueEl.className = 'dev-overlay__value'
      valueEl.textContent = value
      title.appendChild(valueEl)

      const input = document.createElement('input')
      input.type = 'text'
      input.className = 'dev-overlay__text-input'
      input.value = value
      if (options.placeholder) {
        input.placeholder = options.placeholder
      }

      const commit = () => {
        const sanitized = options.onCommit(input.value.trim())
        valueEl.textContent = sanitized
        input.value = sanitized
      }

      input.addEventListener('change', commit)
      input.addEventListener('blur', commit)

      wrapper.appendChild(title)
      wrapper.appendChild(input)

      return wrapper
    }

    const createSelectControl = <Value extends string>(
      label: string,
      value: Value,
      options: { values: Value[]; format: (value: Value) => string; onChange: (value: Value) => void },
    ) => {
      const wrapper = document.createElement('label')
      wrapper.className = 'dev-overlay__control'

      const title = document.createElement('div')
      title.className = 'dev-overlay__label'
      title.textContent = label

      const valueEl = document.createElement('span')
      valueEl.className = 'dev-overlay__value'
      valueEl.textContent = options.format(value)
      title.appendChild(valueEl)

      const select = document.createElement('select')
      select.className = 'dev-overlay__select'

      for (const optionValue of options.values) {
        const option = document.createElement('option')
        option.value = optionValue
        option.textContent = options.format(optionValue)
        if (optionValue === value) {
          option.selected = true
        }
        select.appendChild(option)
      }

      select.addEventListener('change', () => {
        const next = select.value as Value
        options.onChange(next)
        valueEl.textContent = options.format(next)
      })

      wrapper.appendChild(title)
      wrapper.appendChild(select)

      return wrapper
    }

    const createModifierDetails = (
      section: ModifierSection,
      key: string,
    ): CreateModifierDetails => {
      const modPath = `${section}.${key}`

      return (modifier, buildBody) => {
        const details = document.createElement('details')
        details.className = 'dev-overlay__modifier'
        details.open = false

        const summary = document.createElement('summary')

        const summaryHeader = document.createElement('div')
        summaryHeader.className = 'dev-overlay__modifier-header'

        const toggle = document.createElement('input')
        toggle.type = 'checkbox'
        toggle.checked = modifier.enabled
        toggle.className = 'dev-overlay__modifier-toggle'
        toggle.addEventListener('click', event => event.stopPropagation())
        toggle.addEventListener('change', () => {
          modifier.enabled = toggle.checked
        })

        const summaryLabel = document.createElement('span')
        summaryLabel.className = 'dev-overlay__modifier-name'
        summaryLabel.textContent = modifier.name

        summaryHeader.appendChild(toggle)
        summaryHeader.appendChild(summaryLabel)
        summary.appendChild(summaryHeader)

        const copyButton = document.createElement('button')
        copyButton.type = 'button'
        copyButton.className = 'dev-overlay__modifier-copy-button'
        copyButton.title = `Copy trial parameters for ${modifier.name}`
        copyButton.setAttribute('aria-label', `Copy trial parameters for ${modifier.name}`)

        const copyIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        copyIcon.setAttribute('viewBox', '0 0 20 20')
        copyIcon.setAttribute('aria-hidden', 'true')
        copyIcon.classList.add('dev-overlay__modifier-copy-icon')

        const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        iconPath.setAttribute(
          'd',
          'M7 3a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zm-3 5a2 2 0 0 1 2-2h1v2H6v8h8v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
        )
        iconPath.setAttribute('fill', 'currentColor')
        copyIcon.appendChild(iconPath)

        const copyLabel = document.createElement('span')
        copyLabel.textContent = 'Copy Trial'

        copyButton.appendChild(copyIcon)
        copyButton.appendChild(copyLabel)
        summary.appendChild(copyButton)

        copyButton.addEventListener('click', async event => {
          event.stopPropagation()
          event.preventDefault()

          const parameters = collectNonCosmeticParameters(modPath, modifier)
          const snippet = JSON.stringify({ modPath, parameters }, null, 2)

          try {
            await navigator.clipboard.writeText(snippet)
            const count = Object.keys(parameters).length
            setStatus(
              count === 0
                ? `Copied trial config for ${modPath} (no parameters).`
                : `Copied trial config for ${modPath}.`,
            )
          } catch (error) {
            console.error(error)
            setStatus(`Failed to copy trial config for ${modPath}.`, 'error')
          }
        })

        details.appendChild(summary)

        const body = document.createElement('div')
        body.className = 'dev-overlay__modifier-body'

        const description = document.createElement('p')
        description.className = 'dev-overlay__description'
        description.textContent = modifier.description
        body.appendChild(description)

        body.appendChild(
          createToggleControl('Include in Random Selection', modifier.includeInRandom, {
            onChange: value => {
              modifier.includeInRandom = value
            },
          }),
        )

        buildBody(body)

        details.appendChild(body)

        dynamicCollapsibleSections.push(trackCollapsible(details))

        return details
      }
    }

    const lockModsControl = createToggleControl('Lock Mods', Boolean(config.lockMods), {
      onChange: value => {
        config.lockMods = value
        setStatus(
          value
            ? 'Mods locked. Automatic progression disabled.'
            : 'Mods unlocked. Automatic progression restored.',
        )
      },
    })
    const lockModsInput = lockModsControl.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement | null
    lockModsInput?.setAttribute('title', 'Prevent the game from changing mods automatically')
    controls.appendChild(lockModsControl)

    const baseSection = document.createElement('details')
    baseSection.className = 'dev-overlay__collapsible'
    baseSection.open = false

    const baseSummary = document.createElement('summary')
    baseSummary.textContent = 'Game Parameters'
    baseSection.appendChild(baseSummary)

    const baseBody = document.createElement('div')
    baseBody.className = 'dev-overlay__collapsible-body'
    baseSection.appendChild(baseBody)

    let insideOffsetInput: HTMLInputElement | null = null

    baseBody.appendChild(
      createToggleControl('Doubles Mode', config.doubles.enabled, {
        onChange: value => {
          config.doubles.enabled = value
          if (insideOffsetInput) insideOffsetInput.disabled = !value
        },
      }),
    )

    const insideOffsetControl = createSliderControl(
      'Inside Paddle Offset',
      config.doubles.insideOffset,
      {
        min: 0,
        max: 220,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => (config.doubles.insideOffset = v),
      },
    )

    insideOffsetInput = insideOffsetControl.querySelector('input') as HTMLInputElement | null
    if (insideOffsetInput) insideOffsetInput.disabled = !config.doubles.enabled
    baseBody.appendChild(insideOffsetControl)

    baseBody.appendChild(
      createSliderControl('Paddle Speed', config.paddleSpeed, {
        min: 120,
        max: 360,
        step: 5,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (config.paddleSpeed = v),
      }),
    )

    baseBody.appendChild(
      createSliderControl(
        'Left Paddle Speed Multiplier',
        config.leftPaddleSpeedMultiplier,
        {
          min: 0.5,
          max: 1.5,
          step: 0.05,
          format: v => `${v.toFixed(2)}×`,
          onInput: v => (config.leftPaddleSpeedMultiplier = v),
        },
      ),
    )

    baseBody.appendChild(
      createSliderControl(
        'Right Paddle Speed Multiplier',
        config.rightPaddleSpeedMultiplier,
        {
          min: 0.5,
          max: 1.5,
          step: 0.05,
          format: v => `${v.toFixed(2)}×`,
          onInput: v => (config.rightPaddleSpeedMultiplier = v),
        },
      ),
    )

    baseBody.appendChild(
      createSliderControl('Ball Base Speed', config.baseBallSpeed, {
        min: 120,
        max: 600,
        step: 10,
        format: v => `${Math.round(v)} px/s`,
        onInput: v => (config.baseBallSpeed = v),
      }),
    )

    baseBody.appendChild(
      createSliderControl('Min Horizontal Ratio', config.minHorizontalRatio, {
        min: 0.1,
        max: 1,
        step: 0.01,
        format: v => v.toFixed(2),
        onInput: v => (config.minHorizontalRatio = v),
      }),
    )

    baseBody.appendChild(
      createSliderControl('Hit Speed Multiplier', config.speedIncreaseOnHit, {
        min: 1,
        max: 1.3,
        step: 0.01,
        format: v => `${v.toFixed(2)}×`,
        onInput: v => (config.speedIncreaseOnHit = v),
      }),
    )

    baseBody.appendChild(
      createSliderControl('Shot Clock Duration', config.shotClockSeconds, {
        min: 0,
        max: 20,
        step: 0.5,
        format: v => `${v.toFixed(1)} s`,
        onInput: v => (config.shotClockSeconds = v),
      }),
    )

    baseBody.appendChild(
      createSliderControl('Max AI Misalignment', config.maxAiMisalignment, {
        min: 0,
        max: 100,
        step: 1,
        format: v => `${Math.round(v)} %`,
        onInput: v => (config.maxAiMisalignment = v),
      }),
    )

    baseBody.appendChild(
      createSliderControl(
        'Left Paddle Size Multiplier',
        config.leftPaddleSizeMultiplier,
        {
          min: 0.5,
          max: 1.75,
          step: 0.05,
          format: v => `${v.toFixed(2)}×`,
          onInput: v => (config.leftPaddleSizeMultiplier = v),
        },
      ),
    )

    baseBody.appendChild(
      createSliderControl(
        'Right Paddle Size Multiplier',
        config.rightPaddleSizeMultiplier,
        {
          min: 0.5,
          max: 1.75,
          step: 0.05,
          format: v => `${v.toFixed(2)}×`,
          onInput: v => (config.rightPaddleSizeMultiplier = v),
        },
      ),
    )
    dynamicCollapsibleSections.push(trackCollapsible(baseSection))
    controls.appendChild(baseSection)

    const uiSection = document.createElement('details')
    uiSection.className = 'dev-overlay__collapsible'
    uiSection.open = false

    const uiSummary = document.createElement('summary')
    uiSummary.textContent = 'UI Settings'
    uiSection.appendChild(uiSummary)

    const uiBody = document.createElement('div')
    uiBody.className = 'dev-overlay__collapsible-body'
    uiSection.appendChild(uiBody)

    const { typography, scaling, animations } = config.ui

    const formatCurveLabel = (curve: AnimationCurve) =>
      curve
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')

    uiBody.appendChild(createHeading('Typography'))
    uiBody.appendChild(
      createTextControl('Primary Font', typography.primaryFont, {
        placeholder: "'Inter', ui-sans-serif",
        onCommit: value => {
          const sanitized = value || "ui-sans-serif, system-ui, sans-serif"
          typography.primaryFont = sanitized
          return sanitized
        },
      }),
    )
    uiBody.appendChild(
      createTextControl('Secondary Font', typography.secondaryFont, {
        placeholder: "'Inter', ui-sans-serif",
        onCommit: value => {
          const sanitized = value || "ui-sans-serif, system-ui, sans-serif"
          typography.secondaryFont = sanitized
          return sanitized
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Score Font Size', typography.scoreFontSize, {
        min: 12,
        max: 72,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => {
          typography.scoreFontSize = v
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Countdown Font Scale', typography.countdownFontScale, {
        min: 0.1,
        max: 1,
        step: 0.01,
        format: v => `${v.toFixed(2)}×`,
        onInput: v => {
          typography.countdownFontScale = Number(v.toFixed(2))
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Countdown Min Font Size', typography.countdownMinFontSize, {
        min: 32,
        max: 240,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => {
          typography.countdownMinFontSize = v
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Announcement Font (1 Line)', typography.announcementSingleLineSize, {
        min: 72,
        max: 240,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => {
          typography.announcementSingleLineSize = v
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Announcement Font (2 Lines)', typography.announcementDoubleLineSize, {
        min: 72,
        max: 220,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => {
          typography.announcementDoubleLineSize = v
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Announcement Font (3 Lines)', typography.announcementTripleLineSize, {
        min: 60,
        max: 200,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => {
          typography.announcementTripleLineSize = v
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Voting Option Font Size', typography.votingOptionFontSize, {
        min: 24,
        max: 96,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => {
          typography.votingOptionFontSize = v
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Voting Random Font Size', typography.votingRandomFontSize, {
        min: 32,
        max: 110,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => {
          typography.votingRandomFontSize = v
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Voting Indicator Font Size', typography.votingIndicatorFontSize, {
        min: 24,
        max: 96,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => {
          typography.votingIndicatorFontSize = v
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Shot Clock Font Size', typography.shotClockFontSize, {
        min: 12,
        max: 72,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => {
          typography.shotClockFontSize = v
        },
      }),
    )

    uiBody.appendChild(createHeading('Layout & Scaling'))
    uiBody.appendChild(
      createSliderControl('Countdown Card Scale', scaling.countdownCardScale, {
        min: 0.5,
        max: 2,
        step: 0.05,
        format: v => `${v.toFixed(2)}×`,
        onInput: v => {
          scaling.countdownCardScale = Number(v.toFixed(2))
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Return Meter Scale', scaling.returnMeterScale, {
        min: 0.5,
        max: 2,
        step: 0.05,
        format: v => `${v.toFixed(2)}×`,
        onInput: v => {
          scaling.returnMeterScale = Number(v.toFixed(2))
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Return Meter Spacing', scaling.returnMeterSpacing, {
        min: 12,
        max: 48,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => {
          scaling.returnMeterSpacing = v
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Score Offset', scaling.scoreOffset, {
        min: 24,
        max: 140,
        step: 1,
        format: v => `${Math.round(v)} px`,
        onInput: v => {
          scaling.scoreOffset = v
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Halfcourt Line Thickness', scaling.halfcourtLineThickness, {
        min: 0.5,
        max: 8,
        step: 0.1,
        format: v => `${v.toFixed(1)} px`,
        onInput: v => {
          scaling.halfcourtLineThickness = Number(v.toFixed(1))
        },
      }),
    )
    uiBody.appendChild(
      createTextControl('Halfcourt Line Color', scaling.halfcourtLineColor, {
        placeholder: '#ffffff or rgba(...)',
        onCommit: value => {
          const sanitized = value || 'rgba(255,255,255,0.15)'
          scaling.halfcourtLineColor = sanitized
          return sanitized
        },
      }),
    )

    uiBody.appendChild(createHeading('Animations'))
    uiBody.appendChild(
      createSliderControl('Countdown Fade Seconds', animations.countdownFadeSeconds, {
        min: 0,
        max: 2,
        step: 0.05,
        format: v => `${v.toFixed(2)} s`,
        onInput: v => {
          animations.countdownFadeSeconds = Number(v.toFixed(2))
        },
      }),
    )
    uiBody.appendChild(
      createSelectControl('Countdown Fade Curve', animations.countdownFadeCurve, {
        values: ANIMATION_CURVE_OPTIONS,
        format: formatCurveLabel,
        onChange: value => {
          animations.countdownFadeCurve = value
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Voting Fade Seconds', animations.votingPanelFadeSeconds, {
        min: 0,
        max: 2,
        step: 0.05,
        format: v => `${v.toFixed(2)} s`,
        onInput: v => {
          animations.votingPanelFadeSeconds = Number(v.toFixed(2))
        },
      }),
    )
    uiBody.appendChild(
      createSelectControl('Voting Fade Curve', animations.votingPanelCurve, {
        values: ANIMATION_CURVE_OPTIONS,
        format: formatCurveLabel,
        onChange: value => {
          animations.votingPanelCurve = value
        },
      }),
    )
    uiBody.appendChild(
      createSelectControl('Announcement Fade Curve', animations.announcementFadeCurve, {
        values: ANIMATION_CURVE_OPTIONS,
        format: formatCurveLabel,
        onChange: value => {
          animations.announcementFadeCurve = value
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Mod Title Hold Seconds', animations.modTitleHoldSeconds, {
        min: 0.5,
        max: 6,
        step: 0.1,
        format: v => `${v.toFixed(1)} s`,
        onInput: v => {
          animations.modTitleHoldSeconds = Number(v.toFixed(1))
        },
      }),
    )
    uiBody.appendChild(
      createSliderControl('Mod Title Fade Seconds', animations.modTitleFadeSeconds, {
        min: 0,
        max: 3,
        step: 0.05,
        format: v => `${v.toFixed(2)} s`,
        onInput: v => {
          animations.modTitleFadeSeconds = Number(v.toFixed(2))
        },
      }),
    )

    dynamicCollapsibleSections.push(trackCollapsible(uiSection))
    controls.appendChild(uiSection)

    const paddleCollapsible = document.createElement('details')
    paddleCollapsible.className = 'dev-overlay__collapsible'
    paddleCollapsible.open = true

    const paddleSummary = document.createElement('summary')
    const paddleLabel = document.createElement('span')
    paddleLabel.className = 'dev-overlay__section-title'
    paddleLabel.textContent = 'Paddle Modifiers'
    paddleSummary.appendChild(paddleLabel)
    paddleCollapsible.appendChild(paddleSummary)

    const paddleBody = document.createElement('div')
    paddleBody.className = 'dev-overlay__collapsible-body'
    paddleCollapsible.appendChild(paddleBody)

    const paddleList = document.createElement('div')
    paddleList.className = 'dev-overlay__modifiers'
    paddleBody.appendChild(paddleList)

    const paddleEmpty = document.createElement('p')
    paddleEmpty.className = 'dev-overlay__section-empty'
    paddleEmpty.textContent = 'No paddle modifiers match the current filters.'
    paddleEmpty.style.display = 'none'
    paddleBody.appendChild(paddleEmpty)

    paddleSection.appendChild(paddleCollapsible)

    sectionStates.paddle = {
      container: paddleCollapsible,
      list: paddleList,
      emptyMessage: paddleEmpty,
    }

    dynamicCollapsibleSections.push(trackCollapsible(paddleCollapsible))

    const renderPaddleModifier = <K extends typeof PADDLE_MODIFIER_KEYS[number]>(key: K) => {
      const modifier = config.modifiers.paddle[key]
      const details = paddleModifierBuilders[key]({
        modifier,
        createDetails: createModifierDetails('paddle', key),
      })
      paddleList.appendChild(details)
      modifierEntries.push({
        element: details,
        section: 'paddle',
        key,
        name: modifier.name,
        description: modifier.description,
        categories: collectModifierCategories('paddle', key, modifier),
      })
    }

    for (const key of PADDLE_MODIFIER_KEYS) {
      renderPaddleModifier(key)
    }

    const ballCollapsible = document.createElement('details')
    ballCollapsible.className = 'dev-overlay__collapsible'
    ballCollapsible.open = true

    const ballSummary = document.createElement('summary')
    const ballLabel = document.createElement('span')
    ballLabel.className = 'dev-overlay__section-title'
    ballLabel.textContent = 'Ball Modifiers'
    ballSummary.appendChild(ballLabel)
    ballCollapsible.appendChild(ballSummary)

    const ballBody = document.createElement('div')
    ballBody.className = 'dev-overlay__collapsible-body'
    ballCollapsible.appendChild(ballBody)

    const ballList = document.createElement('div')
    ballList.className = 'dev-overlay__modifiers'
    ballBody.appendChild(ballList)

    const ballEmpty = document.createElement('p')
    ballEmpty.className = 'dev-overlay__section-empty'
    ballEmpty.textContent = 'No ball modifiers match the current filters.'
    ballEmpty.style.display = 'none'
    ballBody.appendChild(ballEmpty)

    ballSection.appendChild(ballCollapsible)

    sectionStates.ball = {
      container: ballCollapsible,
      list: ballList,
      emptyMessage: ballEmpty,
    }

    dynamicCollapsibleSections.push(trackCollapsible(ballCollapsible))

    const renderBallModifier = <K extends typeof BALL_MODIFIER_KEYS[number]>(key: K) => {
      const modifier = config.modifiers.ball[key]
      const details = ballModifierBuilders[key]({
        modifier,
        createDetails: createModifierDetails('ball', key),
      })
      ballList.appendChild(details)
      modifierEntries.push({
        element: details,
        section: 'ball',
        key,
        name: modifier.name,
        description: modifier.description,
        categories: collectModifierCategories('ball', key, modifier),
      })
    }

    for (const key of BALL_MODIFIER_KEYS) {
      renderBallModifier(key)
    }

    const arenaCollapsible = document.createElement('details')
    arenaCollapsible.className = 'dev-overlay__collapsible'
    arenaCollapsible.open = true

    const arenaSummary = document.createElement('summary')
    const arenaLabel = document.createElement('span')
    arenaLabel.className = 'dev-overlay__section-title'
    arenaLabel.textContent = 'Arena Modifiers'
    arenaSummary.appendChild(arenaLabel)
    arenaCollapsible.appendChild(arenaSummary)

    const arenaBody = document.createElement('div')
    arenaBody.className = 'dev-overlay__collapsible-body'
    arenaCollapsible.appendChild(arenaBody)

    const modifiersList = document.createElement('div')
    modifiersList.className = 'dev-overlay__modifiers'
    arenaBody.appendChild(modifiersList)

    const arenaEmpty = document.createElement('p')
    arenaEmpty.className = 'dev-overlay__section-empty'
    arenaEmpty.textContent = 'No arena modifiers match the current filters.'
    arenaEmpty.style.display = 'none'
    arenaBody.appendChild(arenaEmpty)

    arenaSection.appendChild(arenaCollapsible)

    sectionStates.arena = {
      container: arenaCollapsible,
      list: modifiersList,
      emptyMessage: arenaEmpty,
    }

    dynamicCollapsibleSections.push(trackCollapsible(arenaCollapsible))

    const renderArenaModifier = <K extends typeof GRAVITY_WELL_KEYS[number]>(key: K) => {
      const modifier = config.modifiers.arena[key]
      const details = arenaModifierBuilders[key]({
        modifier,
        createDetails: createModifierDetails('arena', key),
      })
      modifiersList.appendChild(details)
      modifierEntries.push({
        element: details,
        section: 'arena',
        key,
        name: modifier.name,
        description: modifier.description,
        categories: collectModifierCategories('arena', key, modifier),
      })
    }

    for (const key of GRAVITY_WELL_KEYS) {
      renderArenaModifier(key)
    }

    collapsibleSections.splice(
      0,
      collapsibleSections.length,
      ...staticCollapsibleSections,
      ...dynamicCollapsibleSections,
    )
    updateCollapseButtonLabel()
    applyFilters()
  }

  const copyButton = createOverlayButton('Copy to Clipboard')
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
      setStatus('Configuration copied to clipboard.')
    } catch (error) {
      console.error(error)
      setStatus('Failed to copy config to clipboard.', 'error')
    }
  })

  const loadButton = createOverlayButton('Load from Clipboard')
  loadButton.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText()
      const parsed = JSON.parse(text) as unknown
      if (!isDevConfig(parsed)) {
        setStatus('Clipboard contents are not a valid config.', 'error')
        return
      }
      applyConfig(config, parsed)
      renderControls()
      setStatus('Configuration loaded from clipboard.')
    } catch (error) {
      console.error(error)
      setStatus('Failed to load config from clipboard.', 'error')
    }
  })

  const clearModsButton = createOverlayButton('Clear Mods')
  clearModsButton.addEventListener('click', () => {
    let changed = false

    for (const key of GRAVITY_WELL_KEYS) {
      const modifier = config.modifiers.arena[key]
      if (modifier.enabled) {
        modifier.enabled = false
        changed = true
      }
    }

    for (const key of BALL_MODIFIER_KEYS) {
      const modifier = config.modifiers.ball[key]
      if (modifier.enabled) {
        modifier.enabled = false
        changed = true
      }
    }

    for (const key of PADDLE_MODIFIER_KEYS) {
      const modifier = config.modifiers.paddle[key]
      if (modifier.enabled) {
        modifier.enabled = false
        changed = true
      }
    }

    if (changed) {
      renderControls()
      setStatus('All modifiers have been disabled.')
    } else {
      setStatus('All modifiers are already disabled.')
    }
  })

  const resetButton = createOverlayButton('Reset to Defaults')
  resetButton.addEventListener('click', () => {
    applyConfig(config, defaults)
    renderControls()
    setStatus('Configuration reset to defaults.')
  })

  collapseAllButton.addEventListener('click', () => {
    const shouldExpand = collapsibleSections.some(section => !section.open)
    collapsibleSections.forEach(section => {
      section.open = shouldExpand
    })
    updateCollapseButtonLabel()
  })

  buttonsRow.appendChild(copyButton)
  buttonsRow.appendChild(loadButton)
  buttonsRow.appendChild(clearModsButton)
  buttonsRow.appendChild(resetButton)
  buttons.appendChild(buttonsRow)

  content.appendChild(controls)
  content.appendChild(paddleSection)
  content.appendChild(ballSection)
  content.appendChild(arenaSection)

  overlay.appendChild(title)
  overlay.appendChild(searchContainer)
  overlay.appendChild(content)
  overlay.appendChild(buttons)
  overlay.appendChild(status)
  overlay.appendChild(scrollTopButton)

  renderControls()

  return overlay
}

function applyConfig(target: DevConfig, source: DevConfig) {
  target.paddleSpeed = source.paddleSpeed
  target.leftPaddleSpeedMultiplier = source.leftPaddleSpeedMultiplier
  target.rightPaddleSpeedMultiplier = source.rightPaddleSpeedMultiplier
  target.leftPaddleSizeMultiplier = source.leftPaddleSizeMultiplier
  target.rightPaddleSizeMultiplier = source.rightPaddleSizeMultiplier
  target.baseBallSpeed = source.baseBallSpeed
  target.minHorizontalRatio = source.minHorizontalRatio
  target.speedIncreaseOnHit = source.speedIncreaseOnHit
  target.shotClockSeconds = source.shotClockSeconds
  if ('lockMods' in source) {
    target.lockMods = Boolean((source as Partial<DevConfig>).lockMods)
  }
  target.doubles = deepClone(source.doubles)
  target.modifiers = deepClone(source.modifiers)
  target.ui = deepClone(source.ui)
}

function isDevConfig(value: unknown): value is DevConfig {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DevConfig>
  if (
    typeof candidate.paddleSpeed !== 'number' ||
    typeof candidate.leftPaddleSpeedMultiplier !== 'number' ||
    typeof candidate.rightPaddleSpeedMultiplier !== 'number' ||
    typeof candidate.leftPaddleSizeMultiplier !== 'number' ||
    typeof candidate.rightPaddleSizeMultiplier !== 'number' ||
    typeof candidate.baseBallSpeed !== 'number' ||
    typeof candidate.minHorizontalRatio !== 'number' ||
    typeof candidate.speedIncreaseOnHit !== 'number' ||
    typeof candidate.shotClockSeconds !== 'number'
  ) {
    return false
  }

  if ('lockMods' in candidate && typeof candidate.lockMods !== 'boolean') {
    return false
  }

  if (!isDoublesConfig(candidate.doubles)) return false

  const modifiers = candidate.modifiers as Partial<ModifiersConfig> | undefined
  if (!modifiers || typeof modifiers !== 'object') return false

  const arena = modifiers.arena as Partial<Record<string, unknown>> | undefined
  if (!arena || typeof arena !== 'object') return false

  for (const key of GRAVITY_WELL_KEYS) {
    if (!isGravityWellModifier(arena[key])) return false
  }

  const ball = modifiers.ball as Partial<Record<string, unknown>> | undefined
  if (!ball || typeof ball !== 'object') return false

  if (!isKiteModifier(ball.kite)) return false
  if (!isBumShuffleModifier(ball.bumShuffle)) return false
  if (!isPollokModifier(ball.pollok)) return false
  if (!isSnowballModifier(ball.snowball)) return false
  if (!isMeteorModifier(ball.meteor)) return false

  const paddle = modifiers.paddle as Partial<Record<string, unknown>> | undefined
  if (!paddle || typeof paddle !== 'object') return false

  if (!isApparitionModifier(paddle.apparition)) return false
  if (!isOutOfBodyModifier(paddle.outOfBody)) return false
  if (!isBendyModifier(paddle.bendy)) return false
  if (!isChillyModifier(paddle.chilly)) return false
  if (!isBuckToothModifier(paddle.buckTooth)) return false
  if (!isOsteoWhatModifier(paddle.osteoWhat)) return false
  if (!isBrokePhysicsModifier(paddle.brokePhysics)) return false
  if (!isHadronModifier(paddle.hadron)) return false
  if (!isFoosballModifier(paddle.foosball)) return false
  if (!isDizzyModifier(paddle.dizzy)) return false
  if (!isBungeeModifier(paddle.bungee)) return false
  if (!isMissileCommanderModifier(paddle.missileCommander)) return false
  if (!isFrisbeeModifier(paddle.frisbee)) return false
  if (!isDundeeModifier(paddle.dundee)) return false

  return isUISettings(candidate.ui)
}

function isGravityWellModifier(value: unknown): value is GravityWellModifier {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GravityWellModifier>
  if (
    typeof candidate.name !== 'string' ||
    typeof candidate.description !== 'string' ||
    typeof candidate.enabled !== 'boolean' ||
    typeof candidate.includeInRandom !== 'boolean' ||
    typeof candidate.gravityStrength !== 'number' ||
    typeof candidate.gravityFalloff !== 'number' ||
    typeof candidate.radius !== 'number' ||
    typeof candidate.positiveTint !== 'string' ||
    typeof candidate.negativeTint !== 'string'
  ) {
    return false
  }

  if (
    'wanderWidthPercentage' in candidate &&
    typeof candidate.wanderWidthPercentage !== 'number'
  ) {
    return false
  }

  if ('pauseDuration' in candidate && typeof candidate.pauseDuration !== 'number') {
    return false
  }

  if ('wanderSpeed' in candidate && typeof candidate.wanderSpeed !== 'number') {
    return false
  }

  if ('maxDivots' in candidate && typeof (candidate as { maxDivots?: unknown }).maxDivots !== 'number') {
    return false
  }

  if (
    'spawnMargin' in candidate &&
    typeof (candidate as { spawnMargin?: unknown }).spawnMargin !== 'number'
  ) {
    return false
  }

  if ('wellCount' in candidate && typeof (candidate as { wellCount?: unknown }).wellCount !== 'number') {
    return false
  }

  if (
    'minGravityStrength' in candidate &&
    typeof (candidate as { minGravityStrength?: unknown }).minGravityStrength !== 'number'
  ) {
    return false
  }

  if (
    'maxGravityStrength' in candidate &&
    typeof (candidate as { maxGravityStrength?: unknown }).maxGravityStrength !== 'number'
  ) {
    return false
  }

  if (
    'minGravityFalloff' in candidate &&
    typeof (candidate as { minGravityFalloff?: unknown }).minGravityFalloff !== 'number'
  ) {
    return false
  }

  if (
    'maxGravityFalloff' in candidate &&
    typeof (candidate as { maxGravityFalloff?: unknown }).maxGravityFalloff !== 'number'
  ) {
    return false
  }

  if ('minRadius' in candidate && typeof (candidate as { minRadius?: unknown }).minRadius !== 'number') {
    return false
  }

  if ('maxRadius' in candidate && typeof (candidate as { maxRadius?: unknown }).maxRadius !== 'number') {
    return false
  }

  if ('maxHits' in candidate && typeof (candidate as { maxHits?: unknown }).maxHits !== 'number') {
    return false
  }

  if (
    'barricadeHealth' in candidate &&
    typeof (candidate as { barricadeHealth?: unknown }).barricadeHealth !== 'number'
  ) {
    return false
  }

  if (
    'barricadeCount' in candidate &&
    typeof (candidate as { barricadeCount?: unknown }).barricadeCount !== 'number'
  ) {
    return false
  }

  if (
    'barricadeSpacing' in candidate &&
    typeof (candidate as { barricadeSpacing?: unknown }).barricadeSpacing !== 'number'
  ) {
    return false
  }

  if (
    'barricadeDistance' in candidate &&
    typeof (candidate as { barricadeDistance?: unknown }).barricadeDistance !== 'number'
  ) {
    return false
  }

  if ('beamColor' in candidate && typeof (candidate as { beamColor?: unknown }).beamColor !== 'string') {
    return false
  }

  if ('coneLength' in candidate && typeof (candidate as { coneLength?: unknown }).coneLength !== 'number') {
    return false
  }

  if ('coneWidth' in candidate && typeof (candidate as { coneWidth?: unknown }).coneWidth !== 'number') {
    return false
  }

  if ('ballBrightness' in candidate) {
    return typeof (candidate as { ballBrightness?: unknown }).ballBrightness === 'number'
  }

  return true
}

function hasModifierBaseFields(value: unknown): value is ModifierBase {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ModifierBase>
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.enabled === 'boolean' &&
    typeof candidate.includeInRandom === 'boolean'
  )
}

function isKiteModifier(value: unknown): value is KiteModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<KiteModifier>
  return typeof candidate.tailLength === 'number'
}

function isBumShuffleModifier(value: unknown): value is BumShuffleModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<BumShuffleModifier>
  return typeof candidate.trailLength === 'number'
}

function isPollokModifier(value: unknown): value is PollokModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<PollokModifier>
  return (
    typeof candidate.trailLength === 'number' &&
    typeof candidate.leftColor === 'string' &&
    typeof candidate.rightColor === 'string' &&
    typeof candidate.neutralColor === 'string'
  )
}

function isSnowballModifier(value: unknown): value is SnowballModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<SnowballModifier>
  return (
    typeof candidate.minRadius === 'number' &&
    typeof candidate.maxRadius === 'number' &&
    typeof candidate.growthRate === 'number'
  )
}

function isMeteorModifier(value: unknown): value is MeteorModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<MeteorModifier>
  return (
    typeof candidate.startRadius === 'number' &&
    typeof candidate.minRadius === 'number' &&
    typeof candidate.shrinkRate === 'number'
  )
}

function isApparitionModifier(value: unknown): value is ApparitionModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<ApparitionModifier>
  return (
    typeof candidate.minOpacity === 'number' &&
    typeof candidate.fadeDuration === 'number' &&
    typeof candidate.visibleHoldDuration === 'number' &&
    typeof candidate.hiddenHoldDuration === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isOutOfBodyModifier(value: unknown): value is OutOfBodyModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<OutOfBodyModifier>
  return (
    typeof candidate.paddleOpacity === 'number' &&
    typeof candidate.trailLength === 'number' &&
    typeof candidate.sampleInterval === 'number' &&
    typeof candidate.trailFade === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isBendyModifier(value: unknown): value is BendyModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<BendyModifier>
  return (
    typeof candidate.paddleSizeMultiplier === 'number' &&
    typeof candidate.maxOffset === 'number' &&
    typeof candidate.oscillationSpeed === 'number' &&
    typeof candidate.speedForMaxBend === 'number'
  )
}

function isChillyModifier(value: unknown): value is ChillyModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<ChillyModifier>
  return (
    typeof candidate.startingHeight === 'number' &&
    typeof candidate.shrinkAmount === 'number' &&
    typeof candidate.minimumHeight === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isBuckToothModifier(value: unknown): value is BuckToothModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<BuckToothModifier>
  return (
    typeof candidate.gapSize === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isOsteoWhatModifier(value: unknown): value is OsteoWhatModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<OsteoWhatModifier>
  return (
    typeof candidate.segmentCount === 'number' &&
    typeof candidate.gapSize === 'number' &&
    typeof candidate.hitsBeforeBreak === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number' &&
    typeof candidate.strongColor === 'string' &&
    typeof candidate.weakColor === 'string'
  )
}

function isBrokePhysicsModifier(value: unknown): value is BrokePhysicsModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<BrokePhysicsModifier>
  return (
    typeof candidate.centerAngle === 'number' &&
    typeof candidate.edgeAngle === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isHadronModifier(value: unknown): value is HadronModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<HadronModifier>
  return (
    typeof candidate.splitAngle === 'number' &&
    typeof candidate.armedColor === 'string' &&
    typeof candidate.disarmedColor === 'string' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isFoosballModifier(value: unknown): value is FoosballModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<FoosballModifier>
  return (
    typeof candidate.gapSize === 'number' &&
    typeof candidate.paddleSizeMultiplier === 'number'
  )
}

function isDizzyModifier(value: unknown): value is DizzyModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<DizzyModifier>
  return typeof candidate.paddleSizeMultiplier === 'number'
}

function isBungeeModifier(value: unknown): value is BungeeModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<BungeeModifier>
  return (
    typeof candidate.paddleSizeMultiplier === 'number' &&
    typeof candidate.returnSpeed === 'number'
  )
}

function isMissileCommanderModifier(
  value: unknown,
): value is MissileCommanderModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<MissileCommanderModifier>
  return (
    typeof candidate.paddleSizeMultiplier === 'number' &&
    typeof candidate.launchSpeed === 'number' &&
    typeof candidate.cooldown === 'number' &&
    typeof candidate.missileHeight === 'number' &&
    typeof candidate.missileLifetime === 'number'
  )
}

function isFrisbeeModifier(value: unknown): value is FrisbeeModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<FrisbeeModifier>
  return (
    typeof candidate.paddleSizeMultiplier === 'number' &&
    typeof candidate.throwSpeed === 'number'
  )
}

function isDundeeModifier(value: unknown): value is DundeeModifier {
  if (!hasModifierBaseFields(value)) return false
  const candidate = value as Partial<DundeeModifier>
  return (
    typeof candidate.paddleSizeMultiplier === 'number' &&
    typeof candidate.baseSpeed === 'number' &&
    typeof candidate.acceleration === 'number' &&
    typeof candidate.maxSpeed === 'number'
  )
}

function isDoublesConfig(value: unknown): value is DoublesConfig {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DoublesConfig>
  return typeof candidate.enabled === 'boolean' && typeof candidate.insideOffset === 'number'
}

function isAnimationCurveValue(value: unknown): value is AnimationCurve {
  return typeof value === 'string' && ANIMATION_CURVE_OPTIONS.includes(value as AnimationCurve)
}

function isUITypographySettings(value: unknown): value is UISettings['typography'] {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<UISettings['typography']>
  return (
    typeof candidate.primaryFont === 'string' &&
    typeof candidate.secondaryFont === 'string' &&
    typeof candidate.scoreFontSize === 'number' &&
    typeof candidate.countdownFontScale === 'number' &&
    typeof candidate.countdownMinFontSize === 'number' &&
    typeof candidate.announcementSingleLineSize === 'number' &&
    typeof candidate.announcementDoubleLineSize === 'number' &&
    typeof candidate.announcementTripleLineSize === 'number' &&
    typeof candidate.votingOptionFontSize === 'number' &&
    typeof candidate.votingRandomFontSize === 'number' &&
    typeof candidate.votingIndicatorFontSize === 'number' &&
    typeof candidate.shotClockFontSize === 'number'
  )
}

function isUIScalingSettings(value: unknown): value is UISettings['scaling'] {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<UISettings['scaling']>
  return (
    typeof candidate.countdownCardScale === 'number' &&
    typeof candidate.returnMeterScale === 'number' &&
    typeof candidate.returnMeterSpacing === 'number' &&
    typeof candidate.scoreOffset === 'number' &&
    typeof candidate.halfcourtLineThickness === 'number' &&
    typeof candidate.halfcourtLineColor === 'string'
  )
}

function isUIAnimationSettings(value: unknown): value is UISettings['animations'] {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<UISettings['animations']>
  return (
    typeof candidate.countdownFadeSeconds === 'number' &&
    isAnimationCurveValue(candidate.countdownFadeCurve) &&
    typeof candidate.votingPanelFadeSeconds === 'number' &&
    isAnimationCurveValue(candidate.votingPanelCurve) &&
    isAnimationCurveValue(candidate.announcementFadeCurve) &&
    typeof candidate.modTitleHoldSeconds === 'number' &&
    typeof candidate.modTitleFadeSeconds === 'number'
  )
}

function isUISettings(value: unknown): value is UISettings {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<UISettings>
  return (
    isUITypographySettings(candidate.typography) &&
    isUIScalingSettings(candidate.scaling) &&
    isUIAnimationSettings(candidate.animations)
  )
}

function createOverlayButton(label: string) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'dev-overlay__button'
  button.textContent = label
  return button
}

export function toggleOverlay(overlay: HTMLDivElement) {
  const visible = overlay.classList.toggle('dev-overlay--visible')
  overlay.setAttribute('aria-hidden', visible ? 'false' : 'true')
}

export function showOverlay(overlay: HTMLDivElement) {
  if (overlay.classList.contains('dev-overlay--visible')) return
  overlay.classList.add('dev-overlay--visible')
  overlay.setAttribute('aria-hidden', 'false')
}

export type { DevConfig } from './devtools'
