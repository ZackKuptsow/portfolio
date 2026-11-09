import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'
import { chooseFromMenu, waitForTerminal } from './terminal'

import type { Page } from '@playwright/test'

const DOUBLE_TEXT_SIZE = '200%'
const TEXT_SIZE_SETTLE_MILLISECONDS = 400
const MARK = '.terminal-title-mark'
const MARK_PIXELS = 26
// The longest path the tour puts in the title bar, and the menu entry that leads to it.
const LONGEST_TOUR_PATH = '~/portfolio/work_experience'
const LONGEST_PATH_MENU_ENTRY = 'work_experience/'
// Phones from the smallest up. With the mark, the longest path broke across two lines at 320
// and 340 and fit from 360.
const PHONE_WIDTHS = [320, 340, 360, 375, 390, 414]
// Long enough that the bar is laid out in the fallback font first, as on a visitor's first load.
const LATE_FONT_MILLISECONDS = 1000
const FONT_FILES = '**/*.woff2'

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

  // With the threshold in `ch`, Chrome worked it out in the fallback font, whose character is
  // wider, and kept that answer after JetBrains Mono arrived: the mark stayed hidden all visit.
  test('shows on a phone when the font arrives after the first layout', async ({ page }) => {
    await page.route(FONT_FILES, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, LATE_FONT_MILLISECONDS))
      await route.continue()
    })
    await page.setViewportSize(PHONE_VIEWPORT)
    await page.goto('/')
    await waitForTerminal(page)
    await page.evaluate(() => document.fonts.ready)

    await expect(page.locator(MARK)).toBeVisible()
  })

  test('gives way on a phone with text at twice the size, so the path stays on one line', async ({
    page,
  }) => {
    await page.setViewportSize(PHONE_VIEWPORT)
    await openWithDoubleText(page)

    await expect(page.locator(MARK)).toBeHidden()
    expect(await countPathLines(page)).toBe(1)
  })

  for (const width of PHONE_WIDTHS) {
    test(`keeps the longest tour path on one line at ${width}px, giving way if it must`, async ({
      page,
    }) => {
      await page.setViewportSize({ height: PHONE_VIEWPORT.height, width })
      await page.goto('/')
      await waitForTerminal(page)
      await chooseFromMenu(page, LONGEST_PATH_MENU_ENTRY)
      await expect(page.locator('.terminal-title')).toContainText(LONGEST_TOUR_PATH)

      await expect.poll(() => countPathLines(page)).toBe(1)
    })
  }

  test('stays on a laptop with text at twice the size', async ({ page }) => {
    await page.setViewportSize(LAPTOP_VIEWPORT)
    await openWithDoubleText(page)

    await expect(page.locator(MARK)).toBeVisible()
    expect(await countPathLines(page)).toBe(1)
  })
})
