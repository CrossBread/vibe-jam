/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import { beforeAll } from 'vitest'

beforeAll(() => {
  if (typeof globalThis.requestAnimationFrame !== 'function') {
    globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      return setTimeout(() => callback(performance.now()), 16) as unknown as number
    }) as typeof globalThis.requestAnimationFrame
  }

  if (typeof globalThis.cancelAnimationFrame !== 'function') {
    globalThis.cancelAnimationFrame = ((handle: number) => {
      clearTimeout(handle as unknown as ReturnType<typeof setTimeout>)
    }) as typeof globalThis.cancelAnimationFrame
  }
})
