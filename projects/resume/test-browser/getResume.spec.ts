import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, SMALL_BREAKPOINT_PIXELS } from './constants'
import { openGetResumeWindow } from './getResumeWindow'

// Short enough that the window is taller than the screen and has to scroll.
const SHORT_SCREEN_HEIGHT = 500

test.describe('the get-resume window', () => {
  test('puts the keyboard on the close button, and gives it back on Escape', async ({ page }) => {
    await page.setViewportSize(LAPTOP_VIEWPORT)
    await page.goto('/')
    const { closeButton, trigger } = await openGetResumeWindow(page)

    await expect(closeButton).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  // Chrome gives the keyboard to a scrolling area before any button inside it, so on a
  // short screen the close button used to be passed over.
  test('puts the keyboard on the close button when the window has to scroll', async ({ page }) => {
    await page.setViewportSize({ ...LAPTOP_VIEWPORT, height: SHORT_SCREEN_HEIGHT })
    await page.goto('/')
    const { closeButton, scrollArea } = await openGetResumeWindow(page)

    const hiddenBelow = await scrollArea.evaluate((node) => node.scrollHeight - node.clientHeight)
    expect(hiddenBelow).toBeGreaterThan(0)
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
