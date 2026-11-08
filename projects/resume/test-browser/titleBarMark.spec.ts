import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'
import { waitForTerminal } from './terminal'

import type { Page } from '@playwright/test'

const DOUBLE_TEXT_SIZE = '200%'
const TEXT_SIZE_SETTLE_MILLISECONDS = 400
const MARK = '.terminal-title-mark'
const MARK_PIXELS = 18

/** How many lines the title bar's path takes, read from where its text lands. */
function countPathLines(page: Page): Promise<number> {
  return page.locator('.terminal-title').evaluate((title) => {
    const range = document.createRange()
    range.selectNodeContents(title)
    return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size
  })
}

async function openWithDoubleText(page: Page): Promise<void> {
  await page.goto('/')
  await waitForTerminal(page)
  await page.addStyleTag({ content: `html { font-size: ${DOUBLE_TEXT_SIZE}; }` })
  await page.waitForTimeout(TEXT_SIZE_SETTLE_MILLISECONDS)
}

test.describe('the mark in the title bar', () => {
  test('shows at its size on a phone', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT)
    await page.goto('/')
    await waitForTerminal(page)

    const box = await page.locator(MARK).boundingBox()
    expect(box?.width).toBe(MARK_PIXELS)
    expect(box?.height).toBe(MARK_PIXELS)
  })

  test('gives way on a phone with text at twice the size, so the path stays on one line', async ({
    page,
  }) => {
    await page.setViewportSize(PHONE_VIEWPORT)
    await openWithDoubleText(page)

    await expect(page.locator(MARK)).toBeHidden()
    expect(await countPathLines(page)).toBe(1)
  })

  test('stays on a laptop with text at twice the size', async ({ page }) => {
    await page.setViewportSize(LAPTOP_VIEWPORT)
    await openWithDoubleText(page)

    await expect(page.locator(MARK)).toBeVisible()
    expect(await countPathLines(page)).toBe(1)
  })
})
