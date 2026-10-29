import { CLOSE_BUTTON_LABEL } from '@/components/TerminalDialog/constants'
import { PROJECTS_PAGE_PATH, SAVE_STATE_TOUR } from '@/data/projects'

import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'

import type { Locator, Page } from '@playwright/test'

// The window opens in the same instant as a click that lands, so this only has to outlast
// one repaint.
const OPENED_CHECK_MILLISECONDS = 1_000
const OPENING_LIMIT_MILLISECONDS = 10_000
const TRIGGER_NAME = `${SAVE_STATE_TOUR.triggerLabel} (${SAVE_STATE_TOUR.durationLabel})`

/** How many pixels of an element's content lie past its right edge. */
function readSidewaysOverflow(element: Locator): Promise<number> {
  return element.evaluate((node) => node.scrollWidth - node.clientWidth)
}

/**
 * Opens the tour the way a visitor does, with a click on its control. The page can be read
 * before its script has given the control something to do, and a click in that gap does
 * nothing, so the click is repeated until the window is open.
 */
async function openTour(page: Page): Promise<Locator> {
  const trigger = page.getByRole('button', { name: TRIGGER_NAME })
  const dialog = page.getByRole('dialog', { name: SAVE_STATE_TOUR.title })
  await expect(async () => {
    await trigger.click()
    await expect(dialog).toBeVisible({ timeout: OPENED_CHECK_MILLISECONDS })
  }).toPass({ timeout: OPENING_LIMIT_MILLISECONDS })
  return dialog
}

for (const [label, viewport] of [
  ['a phone', PHONE_VIEWPORT],
  ['a laptop', LAPTOP_VIEWPORT],
] as const) {
  test(`on ${label}, the tour opens in a window that fits the screen, and Escape closes it`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto(PROJECTS_PAGE_PATH)

    const dialog = await openTour(page)
    const player = dialog.locator('video')

    await expect(player).toBeVisible()
    const playerBox = await player.boundingBox()
    expect(playerBox).not.toBeNull()
    expect(playerBox!.y).toBeGreaterThanOrEqual(0)
    expect(playerBox!.y + playerBox!.height).toBeLessThanOrEqual(viewport.height)
    expect(await readSidewaysOverflow(page.locator('html'))).toBe(0)

    await page.keyboard.press('Escape')

    await expect(dialog).toBeHidden()
  })
}

test('the close button closes the tour and the page does not scroll sideways on a phone', async ({
  page,
}) => {
  await page.setViewportSize(PHONE_VIEWPORT)
  await page.goto(PROJECTS_PAGE_PATH)
  await page.evaluate(async () => {
    await document.fonts.ready
  })

  expect(await readSidewaysOverflow(page.locator('html'))).toBe(0)

  const dialog = await openTour(page)
  await dialog.getByRole('button', { name: CLOSE_BUTTON_LABEL }).click()

  await expect(dialog).toBeHidden()
})

test('no script error on load or when the tour opens', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(PROJECTS_PAGE_PATH)
  await openTour(page)

  expect(errors).toEqual([])
})
