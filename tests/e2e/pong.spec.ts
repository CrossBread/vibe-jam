import { test, expect } from '@playwright/test'

test('loads and plays a rally', async ({ page }) => {
  await page.goto('/')
  // basic smoke: canvas exists
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()

  // move paddles to keep ball alive a bit
  await page.keyboard.down('ArrowDown')
  await page.waitForTimeout(150)
  await page.keyboard.up('ArrowDown')
  await page.keyboard.down('w')
  await page.waitForTimeout(150)
  await page.keyboard.up('w')

  // take a screenshot
  await page.screenshot({ path: 'pong.png', fullPage: true })
})
