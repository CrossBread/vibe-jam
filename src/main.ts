/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import { createPong, type RoundRatingRecord } from './game/pong'

const BASE_WIDTH = 800
const BASE_HEIGHT = 480
const ASPECT_RATIO = BASE_WIDTH / BASE_HEIGHT

const app = document.getElementById('app')!
const canvas = document.createElement('canvas')
canvas.width = BASE_WIDTH
canvas.height = BASE_HEIGHT
canvas.style.maxWidth = '100%'
canvas.style.maxHeight = '100%'
app.appendChild(canvas)

const game = createPong(canvas)

const shareStyle = document.createElement('style')
shareStyle.textContent = `
  .round-feedback-share {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: rgba(15,23,42,0.88);
    padding: 14px 22px;
    border-radius: 999px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.35);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.2s ease, visibility 0.2s ease;
    z-index: 20;
  }

  .round-feedback-share--visible {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  .round-feedback-share__button {
    border: none;
    border-radius: 999px;
    background: #38bdf8;
    color: #0f172a;
    font-weight: 700;
    font-size: 16px;
    padding: 10px 26px;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
  }

  .round-feedback-share__button:hover:not(:disabled) {
    background: #0ea5e9;
    transform: translateY(-1px);
  }

  .round-feedback-share__button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .round-feedback-share__disclaimer {
    margin: 0;
    font-size: 12px;
    color: rgba(226,232,240,0.78);
    text-align: center;
  }
`
document.head.appendChild(shareStyle)

const shareContainer = document.createElement('div')
shareContainer.className = 'round-feedback-share'
const shareButton = document.createElement('button')
shareButton.type = 'button'
shareButton.className = 'round-feedback-share__button'
shareButton.textContent = 'Share ratings with developer?'
const shareDisclaimer = document.createElement('p')
shareDisclaimer.className = 'round-feedback-share__disclaimer'
shareDisclaimer.textContent = 'JUST ratings and the mod settings, no personal info'
shareContainer.appendChild(shareButton)
shareContainer.appendChild(shareDisclaimer)
document.body.appendChild(shareContainer)
shareButton.disabled = true

const SHARE_EMAIL = 'jeff@pxlpug.com'
let shareBusy = false

function escapeCsvValue(value: string): string {
  const safe = value.replace(/"/g, '""')
  return `"${safe}"`
}

function ratingsToCsv(records: RoundRatingRecord[]): string {
  const header = [
    'id',
    'player',
    'value',
    'recordedAt',
    'activeArenaModKey',
    'arenaMods',
    'ballMods',
    'paddleMods',
  ]

  const rows = records.map(record => [
    record.id,
    record.player,
    String(record.value),
    record.recordedAt,
    record.activeArenaModKey ?? '',
    JSON.stringify(record.mods.arena),
    JSON.stringify(record.mods.ball),
    JSON.stringify(record.mods.paddle),
  ])

  return [header, ...rows]
    .map(cells => cells.map(cell => escapeCsvValue(String(cell ?? ''))).join(','))
    .join('\r\n')
}

async function shareRatings(): Promise<void> {
  const ratings = game.getRoundRatings()
  if (ratings.length === 0 || shareBusy) return

  const csv = ratingsToCsv(ratings)
  const shareFile = new File([csv], 'round-ratings.csv', { type: 'text/csv' })
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [shareFile] })

  shareBusy = true
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && canShareFiles) {
      await navigator.share({
        title: 'Vibe Jam Round Ratings',
        text: `Ratings for ${SHARE_EMAIL}`,
        files: [shareFile],
      })
      return
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'round-ratings.csv'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    const subject = encodeURIComponent('Vibe Jam round ratings')
    const body = encodeURIComponent(
      'Download "round-ratings.csv" (just saved) and attach it in this email so it reaches the dev team.',
    )
    const mailto = document.createElement('a')
    mailto.href = `mailto:${SHARE_EMAIL}?subject=${subject}&body=${body}`
    mailto.style.display = 'none'
    document.body.appendChild(mailto)
    mailto.click()
    document.body.removeChild(mailto)
  } catch (error) {
    console.error('Unable to share ratings', error)
  } finally {
    shareBusy = false
  }
}

shareButton.addEventListener('click', () => {
  void shareRatings()
})

let previousWinner: typeof game.state.winner = null

const syncShareUi = () => {
  const winner = game.state.winner
  if (winner !== previousWinner) {
    shareContainer.classList.toggle('round-feedback-share--visible', Boolean(winner))
    previousWinner = winner
  }

  const hasRatings = game.getRoundRatings().length > 0
  const shouldDisable = !hasRatings || shareBusy
  if (shareButton.disabled !== shouldDisable) {
    shareButton.disabled = shouldDisable
  }

  requestAnimationFrame(syncShareUi)
}

requestAnimationFrame(syncShareUi)

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>
  msRequestFullscreen?: () => Promise<void>
}

const fullscreenTarget: FullscreenCapableElement = app

const requestFullscreen = () => {
  if (document.fullscreenElement === fullscreenTarget) {
    return Promise.resolve()
  }

  if (document.fullscreenEnabled === false) {
    return Promise.reject(new Error('Fullscreen disabled'))
  }

  const requestMethod =
    fullscreenTarget.requestFullscreen?.bind(fullscreenTarget) ??
    fullscreenTarget.webkitRequestFullscreen?.bind(fullscreenTarget) ??
    fullscreenTarget.msRequestFullscreen?.bind(fullscreenTarget)

  if (!requestMethod) {
    return Promise.reject(new Error('Fullscreen not supported'))
  }

  try {
    const result = requestMethod()
    if (result && typeof (result as Promise<void>).then === 'function') {
      return result as Promise<void>
    }
    return Promise.resolve()
  } catch (error) {
    return Promise.reject(error)
  }
}

const interactionEvents: Array<keyof WindowEventMap> = [
  'pointerdown',
  'touchend',
  'keydown',
]

const handleUserInteraction = () => {
  requestFullscreen().catch(() => {
    // ignore rejection – browsers will throw if user interaction is required
  })
}

const removeFullscreenInteractionListeners = () => {
  interactionEvents.forEach((event) =>
    window.removeEventListener(event, handleUserInteraction),
  )
}

const addFullscreenInteractionListeners = () => {
  removeFullscreenInteractionListeners()
  interactionEvents.forEach((event) =>
    window.addEventListener(event, handleUserInteraction, { passive: true }),
  )
}

const handleFullscreenChange = () => {
  if (document.fullscreenElement === fullscreenTarget) {
    removeFullscreenInteractionListeners()
  } else {
    addFullscreenInteractionListeners()
  }
}

const shouldAutoRequestFullscreen = (() => {
  const ua = navigator.userAgent ?? ''
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  if (mobileRegex.test(ua)) {
    return true
  }

  const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false
  const maxViewportDimension = Math.max(window.innerWidth, window.innerHeight)
  const isCompactViewport = Number.isFinite(maxViewportDimension)
    ? maxViewportDimension <= 900
    : false

  return hasCoarsePointer && isCompactViewport
})()

if (shouldAutoRequestFullscreen) {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener(
    'webkitfullscreenchange',
    handleFullscreenChange as EventListener,
  )

  addFullscreenInteractionListeners()
  requestFullscreen().catch(() => {
    // ignore rejection – browsers will throw if user interaction is required
  })
}

function parsePixelValue(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getOverlayInfo(container: HTMLElement) {
  const overlay = container.querySelector<HTMLDivElement>(
    '.dev-overlay.dev-overlay--visible.dev-overlay--docked',
  )
  if (!overlay) {
    return { width: 0, gap: 0 }
  }

  const styles = window.getComputedStyle(container)
  const gapRaw = styles.columnGap || styles.gap || '0'
  const gap = gapRaw === 'normal' ? 0 : parsePixelValue(gapRaw)

  return {
    width: overlay.getBoundingClientRect().width,
    gap,
  }
}

const applyResize = () => {
  const container = canvas.parentElement as HTMLElement | null
  if (!container) return

  const overlayInfo = getOverlayInfo(container)
  const containerStyles = window.getComputedStyle(container)
  const paddingX =
    parsePixelValue(containerStyles.paddingLeft) +
    parsePixelValue(containerStyles.paddingRight)
  const paddingY =
    parsePixelValue(containerStyles.paddingTop) +
    parsePixelValue(containerStyles.paddingBottom)

  const contentWidth =
    container.clientWidth - paddingX - overlayInfo.width - overlayInfo.gap
  const contentHeight = container.clientHeight - paddingY
  const viewportWidth = window.innerWidth - overlayInfo.width - overlayInfo.gap
  const viewportHeight = window.innerHeight

  const maxWidth = Math.max(0, Math.min(contentWidth, viewportWidth))
  const maxHeight = Math.max(0, Math.min(contentHeight, viewportHeight))

  let targetWidth = Math.min(maxWidth, maxHeight * ASPECT_RATIO)

  if (!Number.isFinite(targetWidth) || targetWidth <= 0) {
    const fallbackWidth = Math.min(
      Math.max(0, viewportWidth),
      Math.max(0, viewportHeight) * ASPECT_RATIO,
    )
    targetWidth = fallbackWidth > 0 ? fallbackWidth : BASE_WIDTH
  }

  targetWidth = Math.max(0, targetWidth)
  const targetHeight =
    targetWidth > 0 ? targetWidth / ASPECT_RATIO : BASE_HEIGHT

  canvas.style.width = `${targetWidth}px`
  canvas.style.height = `${targetHeight}px`
}

let resizeRaf: number | null = null
const scheduleResize = () => {
  if (resizeRaf !== null) return
  resizeRaf = window.requestAnimationFrame(() => {
    resizeRaf = null
    applyResize()
  })
}

scheduleResize()

window.addEventListener('resize', scheduleResize)
window.addEventListener('orientationchange', scheduleResize)
window.visualViewport?.addEventListener('resize', scheduleResize)
window.visualViewport?.addEventListener('scroll', scheduleResize)

if (typeof ResizeObserver !== 'undefined') {
  const observer = new ResizeObserver(() => scheduleResize())
  observer.observe(app)
}

app.addEventListener('pong:layout-changed', scheduleResize)

// expose for e2e tests
// @ts-expect-error test hook
window.__pong = game
