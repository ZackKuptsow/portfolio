import { CLOSE_BUTTON_LABEL } from '@/components/TerminalDialog/constants'
import { PROJECTS_PAGE_PATH, SAVE_STATE_TOUR, projects } from '@/data/projects'

import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'
import {
  pointAtOutput,
  readTerminal,
  scrollToTheEndOfTheStep,
  waitForTerminal,
  wheelUntilNextCommand,
} from './terminal'

import type { Locator, Page } from '@playwright/test'

const TRIGGER_NAME = `${SAVE_STATE_TOUR.triggerLabel} (${SAVE_STATE_TOUR.durationLabel})`
const SAVE_STATE_INDEX = projects.findIndex((project) => project.video === SAVE_STATE_TOUR)

/** How many pixels of an element's content lie past its right edge. */
function readSidewaysOverflow(element: Locator): Promise<number> {
  return element.evaluate((node) => node.scrollWidth - node.clientWidth)
}

/**
 * Opens the tour the way a visitor does: the page opens at the first project, so scroll on to
 * the project with the recording, and press its control.
 */
async function openTour(page: Page): Promise<Locator> {
  await waitForTerminal(page)
  await pointAtOutput(page)
  for (let printed = 0; printed < SAVE_STATE_INDEX; printed += 1) {
    await wheelUntilNextCommand(page, 'down')
  }
  // On a phone the control is further down than a screen, so read on to it.
  await scrollToTheEndOfTheStep(page)
  const trigger = page.getByRole('button', { name: TRIGGER_NAME })
  const dialog = page.getByRole('dialog', { name: SAVE_STATE_TOUR.title })
  // As laid out, which a flex box would run together: `watch the tour(1:31)`.
  expect(await trigger.innerText()).toBe(`→ ${TRIGGER_NAME}`)
  await trigger.click()
  await expect(dialog).toBeVisible()
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

  const dialog = await openTour(page)
  await dialog.getByRole('button', { name: CLOSE_BUTTON_LABEL }).click()

  await expect(dialog).toBeHidden()
  expect(await readSidewaysOverflow(page.locator('html'))).toBe(0)
})

test('no script error on load or when the tour opens', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(PROJECTS_PAGE_PATH)
  await openTour(page)

  expect(errors).toEqual([])
})

test.describe(`the terminal at ${PROJECTS_PAGE_PATH}`, () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  test('opens already at Projects, with one main heading once every section is on the page', async ({
    page,
  }) => {
    await page.goto(PROJECTS_PAGE_PATH)
    await waitForTerminal(page)

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('# Projects')
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('.terminal-title')).toContainText('~/portfolio/projects')
    await expect(page.getByRole('heading', { name: projects[0].title })).toBeInViewport()
    await expect(page.locator('[data-scene="hero"]')).toBeHidden()
    expect((await readTerminal(page)).step).toBeGreaterThan(0)
  })

  test('goes up into Skills like the home page, since it is the same terminal', async ({
    page,
  }) => {
    await page.goto(PROJECTS_PAGE_PATH)
    await waitForTerminal(page)
    await pointAtOutput(page)

    await wheelUntilNextCommand(page, 'up')

    await expect(page.getByRole('heading', { exact: true, name: 'Skills' })).toBeInViewport()
    await expect(page.locator('dialog[open]')).toHaveCount(0)
  })
})
