import { test, expect } from '@playwright/test'

test('loads and shows canvas', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  await page.screenshot({ path: 'pong-snap.png' })
})

test('mutator toggles keep rendering stable', async ({ page }) => {
  await page.goto('/')

  await page.waitForFunction(() => typeof window.vibe?.toggleMod === 'function')

  const sampleCenterPixel = async () => {
    return page.evaluate(() => {
      const canvas = document.querySelector('canvas')!
      const ctx = canvas.getContext('2d')!
      const x = Math.floor(canvas.width / 2)
      const y = Math.floor(canvas.height / 2)
      return Array.from(ctx.getImageData(x, y, 1, 1).data)
    })
  }

  await page.waitForTimeout(500)
  const baselinePixel = await sampleCenterPixel()
  expect(baselinePixel.length).toBe(4)
  expect(baselinePixel.some((value) => value > 0)).toBe(true)

  const mutators = ['mod.giant-paddles', 'mod.speedball', 'mod.shrinking-arena']
  const available = await page.evaluate(() => window.vibe!.listMods())
  expect(available).toEqual(expect.arrayContaining(mutators))

  await page.evaluate((ids) => ids.forEach((id) => window.vibe!.toggleMod(id)), mutators)
  await page.waitForTimeout(300)
  const withMutators = await sampleCenterPixel()
  expect(withMutators.length).toBe(4)
  expect(withMutators.every((value) => Number.isFinite(value))).toBe(true)

  await page.evaluate((ids) => ids.forEach((id) => window.vibe!.toggleMod(id)), mutators)
  await page.waitForTimeout(300)
  const afterToggle = await sampleCenterPixel()
  expect(afterToggle.length).toBe(4)
  expect(afterToggle.some((value) => value > 0)).toBe(true)
})
