import { TRIGGER_COMMAND } from '@/components/GetResume/constants'
import { CLOSE_BUTTON_LABEL } from '@/components/TerminalDialog/constants'

import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, SMALL_BREAKPOINT_PIXELS } from './constants'
import { openGetResumeWindow } from './getResumeWindow'
import {
  chooseFromMenu,
  enterPlainView,
  fastForward,
  pointAtOutput,
  waitForTerminal,
  waitUntilIdle,
  wheelUntilBusy,
} from './terminal'

import type { Locator } from '@playwright/test'

// Short enough that the window is taller than the screen and has to scroll.
const SHORT_SCREEN_HEIGHT = 500
const SOLID_OUTLINE = 'solid'
const NO_OUTLINE = 'none'

function readOutlineStyle(element: Locator): Promise<string> {
  return element.evaluate((node) => getComputedStyle(node).outlineStyle)
}

test.describe('the get-resume window', () => {
  // Zack, on the first build: "the esc is focused on open." It opens without a click, so a browser
  // draws a ring around whatever gets the focus, which made the way out the loudest thing on it.
  test('starts the keyboard on the window, and gives it back on Escape', async ({ page }) => {
    await page.setViewportSize(LAPTOP_VIEWPORT)
    await page.goto('/')
    const { closeButton, scrollArea, trigger } = await openGetResumeWindow(page)

    await expect(scrollArea).toBeFocused()
    await expect(closeButton).not.toBeFocused()

    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  test('draws no ring on opening, even from the keyboard, and one as soon as Tab moves', async ({
    page,
  }) => {
    await page.setViewportSize(LAPTOP_VIEWPORT)
    await page.goto('/')
    await enterPlainView(page)
    await page.getByRole('button', { name: TRIGGER_COMMAND }).focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    const scrollArea = dialog.locator('.terminal-window')
    const closeButton = dialog.getByRole('button', { name: CLOSE_BUTTON_LABEL })
    await expect(scrollArea).toBeFocused()

    // Opened from the keyboard, the browser would draw a ring here if the page let it.
    expect(await scrollArea.evaluate((node) => node.matches(':focus-visible'))).toBe(true)
    expect(await readOutlineStyle(scrollArea)).toBe(NO_OUTLINE)

    await page.keyboard.press('Tab')

    await expect(closeButton).toBeFocused()
    expect(await readOutlineStyle(closeButton)).toBe(SOLID_OUTLINE)
  })

  test('opened by scrolling in the terminal, leaves the close button alone', async ({ page }) => {
    await page.setViewportSize(LAPTOP_VIEWPORT)
    await page.goto('/')
    await waitForTerminal(page)
    await pointAtOutput(page)
    await chooseFromMenu(page, 'skills/')
    await fastForward(page)
    await waitUntilIdle(page)

    await wheelUntilBusy(page, 'down')
    await fastForward(page)

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: CLOSE_BUTTON_LABEL })).not.toBeFocused()
    await expect(dialog.locator('.terminal-window')).toBeFocused()
  })

  // Chrome gives the keyboard to a scrolling area before any button inside it, so on a short screen
  // where the keyboard lands used to depend on the height of the browser window.
  test('lets the keyboard scroll it, and reach the close button, when it has to scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ ...LAPTOP_VIEWPORT, height: SHORT_SCREEN_HEIGHT })
    await page.goto('/')
    const { closeButton, scrollArea } = await openGetResumeWindow(page)

    const hiddenBelow = await scrollArea.evaluate((node) => node.scrollHeight - node.clientHeight)
    expect(hiddenBelow).toBeGreaterThan(0)
    await expect(scrollArea).toBeFocused()

    await page.keyboard.press('ArrowDown')
    await expect.poll(() => scrollArea.evaluate((node) => node.scrollTop)).toBeGreaterThan(0)

    await page.keyboard.press('Tab')
    await expect(closeButton).toBeFocused()
  })
})

// jsdom ignores media queries. The unit tests check that the section carries the class, and
// only a browser can check what the class does.
test.describe('the QR code', () => {
  test('is shown on a screen as wide as the `sm` breakpoint', async ({ page }) => {
    await page.setViewportSize({ ...LAPTOP_VIEWPORT, width: SMALL_BREAKPOINT_PIXELS })
    await page.goto('/')
    const { qrCode } = await openGetResumeWindow(page)

    await expect(qrCode).toBeVisible()
  })

  test('is not shown one pixel narrower, where a phone could not scan it', async ({ page }) => {
    await page.setViewportSize({ ...LAPTOP_VIEWPORT, width: SMALL_BREAKPOINT_PIXELS - 1 })
    await page.goto('/')
    const { closeButton, qrCode } = await openGetResumeWindow(page)

    // The window is open, so a code that cannot be seen is hidden and not just unopened.
    await expect(closeButton).toBeVisible()
    await expect(qrCode).toBeHidden()
    await expect(qrCode).toHaveCount(1)
  })
})
