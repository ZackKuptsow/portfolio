import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'

const SECTION_HEADINGS = ['Work Experience', 'Education', 'Skills', 'Projects']

for (const [label, viewport] of [
  ['a small phone', PHONE_VIEWPORT],
  ['a laptop', LAPTOP_VIEWPORT],
] as const) {
  // Reduced motion gets the plain flow, the same as a visitor without a script. jsdom has no
  // layout, so no unit test can see that a section has room and stays on screen.
  test.describe(`the plain flow on ${label}`, () => {
    test.use({ reducedMotion: 'reduce', viewport })

    test('shows every section in one column, in order', async ({ page }) => {
      await page.goto('/')

      const tops: number[] = []
      for (const name of SECTION_HEADINGS) {
        const heading = page.getByRole('heading', { exact: true, level: 2, name })
        await heading.scrollIntoViewIfNeeded()
        await expect(heading).toBeInViewport()
        tops.push(
          await heading.evaluate((element) => element.getBoundingClientRect().top + window.scrollY),
        )
      }

      expect(tops).toEqual([...tops].sort((first, second) => first - second))
    })
  })
}

test.describe('without a script', () => {
  test.use({ javaScriptEnabled: false, viewport: PHONE_VIEWPORT })

  test('the whole page can be read', async ({ page }) => {
    await page.goto('/')

    for (const name of SECTION_HEADINGS) {
      const heading = page.getByRole('heading', { exact: true, level: 2, name })
      await heading.scrollIntoViewIfNeeded()
      await expect(heading).toBeInViewport()
    }
  })
})
