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
