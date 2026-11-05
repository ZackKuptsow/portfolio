import { test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'
import { waitForTerminal } from './terminal'
import { WALK_LIMIT_MILLISECONDS, walkEverySection } from './wholeRows'

const DOUBLE_TEXT_SIZE = '200%'
const TEXT_SIZE_SETTLE_MILLISECONDS = 400
// The lines are twice as tall and the track several times as long, so this can step further.
const DOUBLE_TEXT_POSITION_STEP_PIXELS = 10

// A recruiter who cannot read part of the resume sees no error anywhere, so this walks all of it.
test.describe('every line can be read, whole, at every scroll position', () => {
  test.describe.configure({ timeout: WALK_LIMIT_MILLISECONDS })

  test('on a laptop', async ({ page }) => {
    await page.setViewportSize(LAPTOP_VIEWPORT)
    await page.goto('/')
    await waitForTerminal(page)

    await walkEverySection(page)
  })

  test('on a phone', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT)
    await page.goto('/')
    await waitForTerminal(page)

    await walkEverySection(page)
  })

  test('on a phone, with text at twice the size', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT)
    await page.goto('/')
    await waitForTerminal(page)
    await page.addStyleTag({ content: `html { font-size: ${DOUBLE_TEXT_SIZE}; }` })
    await page.waitForTimeout(TEXT_SIZE_SETTLE_MILLISECONDS)

    await walkEverySection(page, DOUBLE_TEXT_POSITION_STEP_PIXELS)
  })
})
