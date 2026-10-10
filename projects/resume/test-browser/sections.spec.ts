import { expect, test } from './browserTest'
import { PHONE_VIEWPORT } from './constants'

import type { Page } from '@playwright/test'

const HIDDEN_SECTION = '[data-reveal-phase="hidden"]'
const REVEALED_SECTION = '[data-reveal-phase="revealed"]'

/** Scrolls down half a screen at a time, the way a reader does, until the page ends. */
async function scrollToTheEnd(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const BEFORE_THE_FIRST_SCROLL = -1
    const SCREENS_PER_STEP = 0.5
    const waitForNextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

    let previousScrollTop = BEFORE_THE_FIRST_SCROLL
    while (window.scrollY > previousScrollTop) {
      previousScrollTop = window.scrollY
      window.scrollBy(0, window.innerHeight * SCREENS_PER_STEP)
      await waitForNextFrame()
    }
  })
}

test.describe('on a small phone', () => {
  test.use({ viewport: PHONE_VIEWPORT })

  // jsdom has no layout, so no unit test can see this. A section many screens tall once
  // stayed hidden for good, because the observer waited for a tenth of it to be on screen.
  test('every section a visitor scrolls to appears', async ({ page }) => {
    await page.goto('/')
    // The script hides what starts below the first screen. Until it has, there is nothing
    // to check, and this test would pass on a page that never hides anything.
    await expect(page.locator(HIDDEN_SECTION).first()).toBeAttached()

    await scrollToTheEnd(page)

    await expect(page.locator(HIDDEN_SECTION)).toHaveCount(0)
    await expect(page.locator(REVEALED_SECTION)).not.toHaveCount(0)
  })
})
