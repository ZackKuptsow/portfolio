import { expect, test } from './browserTest'
import { openGetResumeWindow } from './getResumeWindow'

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
