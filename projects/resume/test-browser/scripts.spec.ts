import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'
import { openGetResumeWindow } from './getResumeWindow'
import { pointAtOutput, waitForTerminal, wheelUntilNextCommand } from './terminal'

const FAILSAFE_LIMIT_MILLISECONDS = 8_000
const SECTION_HEADINGS = ['Work Experience', 'Education', 'Skills', 'Projects']

test('the page and the get-resume window run without a script error', async ({ page }) => {
  const problems: string[] = []
  page.on('pageerror', (error) => problems.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      problems.push(message.text())
    }
  })

  await page.goto('/')
  const { closeButton } = await openGetResumeWindow(page)
  await expect(closeButton).toBeVisible()

  expect(problems).toEqual([])
})

test('the terminal runs without a script error, down through its sections', async ({ page }) => {
  const problems: string[] = []
  page.on('pageerror', (error) => problems.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') {
      problems.push(message.text())
    }
  })
  await page.setViewportSize(LAPTOP_VIEWPORT)

  await page.goto('/')
  await waitForTerminal(page)
  await pointAtOutput(page)
  await wheelUntilNextCommand(page, 'down')
  await wheelUntilNextCommand(page, 'down')

  expect(problems).toEqual([])
})

test.describe('when the script does not arrive', () => {
  test.use({ viewport: PHONE_VIEWPORT })

  test.beforeEach(async ({ page }) => {
    await page.route('**/_next/static/chunks/**', (route) => route.abort())
  })

  // Static HTML paints before any script could hide it, so the pre-paint script has to.
  test('the first paint shows the hero and not every section stacked up', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.terminal-hero-handle')).toBeVisible()
    await expect(page.locator('[data-scene="about"]')).toBeHidden()
    await expect(page.locator('[data-scene="work"]')).toBeHidden()
  })

  test('it falls back to the plain flow, so nobody is stranded on one screen', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('html')).not.toHaveClass(/terminal-on/, {
      timeout: FAILSAFE_LIMIT_MILLISECONDS,
    })
    for (const name of SECTION_HEADINGS) {
      const heading = page.getByRole('heading', { exact: true, level: 2, name })
      await heading.scrollIntoViewIfNeeded()
      await expect(heading).toBeInViewport()
    }
    // Controls that need the missing script stay out of the way.
    await expect(page.getByRole('button', { exact: true, name: 'Menu' })).toBeHidden()
  })
})
