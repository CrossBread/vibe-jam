import { createPong } from './game/pong'

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
