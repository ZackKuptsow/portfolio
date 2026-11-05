import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'
import { enterPlainView } from './terminal'

import type { Page } from '@playwright/test'

/** The window on Zack's screen when he reported this. */
const WIDE_SHORT_VIEWPORT = { height: 754, width: 2000 }
const ROOM_FOR_ROUNDING_PIXELS = 2

async function expectHeroToFillTheFirstScreen(page: Page, screenHeight: number): Promise<void> {
  const { aboutTop, contentMiddle, heroBottom, spaceMiddle } = await page.evaluate(() => {
    const read = (selector: string) => {
      const element = document.querySelector(selector)
      if (!element) {
        throw new Error(`The page has no ${selector}`)
      }
      return element.getBoundingClientRect()
    }
    const titleBottom = read('.terminal-title-bar').bottom
    const hero = read('[data-scene="hero"]')
    return {
      aboutTop: read('[data-scene="about"] .terminal-field').top,
      contentMiddle: (read('.terminal-hero-path').top + read('.terminal-hero-rule').bottom) / 2,
      heroBottom: hero.bottom,
      spaceMiddle: (titleBottom + hero.bottom) / 2,
    }
  })

  expect(Math.abs(heroBottom - screenHeight)).toBeLessThanOrEqual(ROOM_FOR_ROUNDING_PIXELS)
  expect(aboutTop).toBeGreaterThanOrEqual(screenHeight)
  expect(Math.abs(contentMiddle - spaceMiddle)).toBeLessThanOrEqual(ROOM_FOR_ROUNDING_PIXELS)
}

// Zack, on the first build: "let's make sure in plain view the hero page still fits the screen
// properly." It took 72% of the screen, a figure that suits the terminal, with About cut off under it.
test.describe('the hero, in the plain flow, fills the first screen and no more', () => {
  for (const [screen, viewport] of [
    ['a laptop', LAPTOP_VIEWPORT],
    ['a phone', PHONE_VIEWPORT],
    ['a wide, short window', WIDE_SHORT_VIEWPORT],
  ] as const) {
    test(`from plain view, on ${screen}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')

      await enterPlainView(page)

      await expectHeroToFillTheFirstScreen(page, viewport.height)
    })
  }

  test('with reduced motion', async ({ page }) => {
    await page.setViewportSize(LAPTOP_VIEWPORT)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    await expectHeroToFillTheFirstScreen(page, LAPTOP_VIEWPORT.height)
  })

  test.describe('without a script', () => {
    test.use({ javaScriptEnabled: false, viewport: LAPTOP_VIEWPORT })

    test('as well', async ({ page }) => {
      await page.goto('/')

      await expect(page.locator('[data-scene="about"]')).toBeVisible()
      // Checked from outside the page, since it runs no script of its own.
      const heroBox = await page.locator('[data-scene="hero"]').boundingBox()
      const aboutBox = await page
        .locator('[data-scene="about"] .terminal-field')
        .first()
        .boundingBox()
      expect(
        Math.abs((heroBox?.y ?? 0) + (heroBox?.height ?? 0) - LAPTOP_VIEWPORT.height),
      ).toBeLessThanOrEqual(ROOM_FOR_ROUNDING_PIXELS)
      expect(aboutBox?.y ?? 0).toBeGreaterThanOrEqual(LAPTOP_VIEWPORT.height)
    })
  })
})

test.describe('the terminal, before its script has taken over', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  // The first paint and the running terminal centre the hero about the same line. A plain-flow height
  // here would make the name jump when the script takes over.
  test('shows the hero where the running terminal will', async ({ page }) => {
    await page.route('**/_next/static/chunks/**', (route) => route.abort())
    await page.goto('/')
    const handle = page.locator('.terminal-hero-handle')
    await expect(handle).toBeVisible()
    const firstPaint = await handle.boundingBox()
    await page.unroute('**/_next/static/chunks/**')

    await page.goto('/')
    await page.locator('.terminal-root[data-engine-ready]').waitFor({ state: 'attached' })
    await page.evaluate(() => document.fonts.ready)
    const running = await handle.boundingBox()

    expect(Math.abs((firstPaint?.y ?? 0) - (running?.y ?? 0))).toBeLessThanOrEqual(8)
  })
})
