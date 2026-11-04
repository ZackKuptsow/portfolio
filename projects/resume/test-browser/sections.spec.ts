import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'

import type { Locator, Page } from '@playwright/test'

const HIDDEN_SECTION = '[data-reveal-phase="hidden"]'
const REVEALED_SECTION = '[data-reveal-phase="revealed"]'
const HEADER_CHECK_VIEWPORT_HEIGHT = 800
// A small phone, each side of Tailwind's `md` breakpoint, where the Skills cards become
// columns, and a laptop.
const HEADER_CHECK_VIEWPORT_WIDTHS = [PHONE_VIEWPORT.width, 767, 768, LAPTOP_VIEWPORT.width]
const SECTION_TITLES = ['Work Experience', 'Education', 'Skills']

/** Where a section's prompt and heading sit inside the section, to the nearest pixel. */
function readHeaderLayout(heading: Locator) {
  return heading.evaluate((headingElement) => {
    const promptElement = headingElement.previousElementSibling
    const sectionElement = headingElement.closest('section')
    if (!promptElement || !sectionElement) {
      throw new Error(`No prompt or section around the heading "${headingElement.textContent}"`)
    }

    const headingBox = headingElement.getBoundingClientRect()
    const promptBox = promptElement.getBoundingClientRect()
    const sectionBox = sectionElement.getBoundingClientRect()

    return {
      gapBelowPrompt: Math.round(headingBox.top - promptBox.bottom),
      headingInsetLeft: Math.round(headingBox.left - sectionBox.left),
      headingInsetRight: Math.round(sectionBox.right - headingBox.right),
      promptInsetLeft: Math.round(promptBox.left - sectionBox.left),
    }
  })
}

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

for (const width of HEADER_CHECK_VIEWPORT_WIDTHS) {
  // A class list meant for the Skills cards once reached the header as well, which set the
  // prompt and the heading side by side in the card columns. jsdom has no layout to see it.
  test(`every section header has the same layout at ${width}px wide`, async ({ page }) => {
    await page.setViewportSize({ height: HEADER_CHECK_VIEWPORT_HEIGHT, width })
    await page.goto('/')

    const layouts = await Promise.all(
      SECTION_TITLES.map((title) =>
        readHeaderLayout(page.getByRole('heading', { exact: true, level: 2, name: title })),
      ),
    )
    const [firstLayout] = layouts

    // Matching alone would pass with every header side by side.
    expect(firstLayout.gapBelowPrompt).toBeGreaterThanOrEqual(0)
    expect(layouts).toEqual(SECTION_TITLES.map(() => firstLayout))
  })
}
