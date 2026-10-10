import { expect, test } from './browserTest'
import { openGetResumeWindow } from './getResumeWindow'

import type { Locator } from '@playwright/test'

const VIEWPORT_HEIGHT = 800
// Phones, then each Tailwind breakpoint with the pixel before it, then desktops. The page
// once scrolled sideways at 320px, and again from 640px to 721px.
const VIEWPORT_WIDTHS = [
  320, 360, 375, 390, 414, 480, 600, 639, 640, 700, 721, 767, 768, 1024, 1280,
]

/** How many pixels of an element's content lie past its right edge. */
function readSidewaysOverflow(element: Locator): Promise<number> {
  return element.evaluate((node) => node.scrollWidth - node.clientWidth)
}

for (const width of VIEWPORT_WIDTHS) {
  test(`nothing scrolls sideways at ${width}px wide`, async ({ page }) => {
    await page.setViewportSize({ height: VIEWPORT_HEIGHT, width })
    await page.goto('/')
    await page.evaluate(async () => {
      await document.fonts.ready
    })

    expect(await readSidewaysOverflow(page.locator('html'))).toBe(0)

    const { scrollArea } = await openGetResumeWindow(page)
    await expect(scrollArea).toBeVisible()
    expect(await readSidewaysOverflow(scrollArea)).toBe(0)
  })
}
