import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT } from './constants'
import { waitForTerminal } from './terminal'

const THEME_COLOR_META = 'meta[name="theme-color"]'
// Every page without a terminal has the corner switch instead. The bucket serves these by file.
const PAGES_WITHOUT_A_TERMINAL = ['/sms.html', '/privacy.html', '/terms.html', '/404.html']

test.describe('the theme', () => {
  test.use({ colorScheme: 'light', viewport: LAPTOP_VIEWPORT })

  test('opens dark for everyone, whatever the system prefers', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
    await expect(page.locator(THEME_COLOR_META)).toHaveAttribute('content', '#121212')
  })

  test('the menu switches it, and the choice is there on the next visit', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await page.getByRole('button', { exact: true, name: 'Menu' }).click()
    await page.getByRole('button', { name: 'light mode' }).click()

    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
    await expect(page.locator(THEME_COLOR_META)).toHaveAttribute('content', '#ffffff')

    await page.reload()
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
    await waitForTerminal(page)
    await expect(page.locator(THEME_COLOR_META)).toHaveAttribute('content', '#ffffff')
    await page.getByRole('button', { exact: true, name: 'Menu' }).click()
    await expect(page.getByRole('button', { name: 'dark mode' })).toBeVisible()
  })

  test('a stored choice of dark wins over a system that prefers light', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
    await page.goto('/')

    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  })

  test('the terminal has no corner switch', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)

    await expect(page.getByRole('button', { name: /Switch to/ })).toHaveCount(0)
  })

  for (const path of PAGES_WITHOUT_A_TERMINAL) {
    test(`${path} keeps the corner switch, on the same theme`, async ({ page }) => {
      await page.goto(path)

      await expect(page.locator('html')).toHaveClass(/\bdark\b/)
      const toggle = page.getByRole('button', { name: 'Switch to light mode' })
      await expect(toggle).toBeVisible()

      await toggle.click()

      await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
      await page.reload()
      await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
    })
  }
})
