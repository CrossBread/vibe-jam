/*
 * Copyright (c) 2025. CrossBread Tech All rights reserved.
 */

import { test, expect } from '@playwright/test'

test('loads and shows canvas', async ({ page }) => {
  await page.goto('/')
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  await page.screenshot({ path: 'pong-snap.png' })
})
