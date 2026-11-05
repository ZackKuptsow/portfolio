import { expect, test } from './browserTest'
import { PHONE_VIEWPORT } from './constants'
import { waitForTerminal } from './terminal'
import { WALK_LIMIT_MILLISECONDS, walkEverySection } from './wholeRows'

const SCROLLBAR_WIDTH_PIXELS = 15
const SCROLLBAR_SETTLE_MILLISECONDS = 400

// Playwright hides scrollbars by default, which hid this bug: with one showing, 363 of 557 phone
// positions cut a line through the middle. The site hides its scrollbar too, and this proves the
// text is safe in a browser that shows one anyway. The option has to be at the top of a file.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } })

test.describe('every line can be read, whole, at every scroll position', () => {
  test.describe.configure({ timeout: WALK_LIMIT_MILLISECONDS })

  test('on a phone, with a real scrollbar showing', async ({ page }) => {
    await page.setViewportSize(PHONE_VIEWPORT)
    await page.goto('/')
    await waitForTerminal(page)
    await page.addStyleTag({
      content: `html.terminal-on .terminal-scroller { scrollbar-width: auto !important; }
        html.terminal-on .terminal-scroller::-webkit-scrollbar {
          display: block !important;
          width: ${SCROLLBAR_WIDTH_PIXELS}px;
        }`,
    })
    await page.waitForTimeout(SCROLLBAR_SETTLE_MILLISECONDS)

    // Without a scrollbar on screen this check would pass and prove nothing.
    const scrollbarWidth = await page
      .locator('.terminal-scroller')
      .evaluate((scroller: HTMLElement) => scroller.offsetWidth - scroller.clientWidth)
    expect(scrollbarWidth).toBe(SCROLLBAR_WIDTH_PIXELS)

    await walkEverySection(page)
  })
})
