import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'
import {
  chooseFromMenu,
  enterPlainView,
  fastForward,
  pointAtOutput,
  readCommands,
  readSessionOutput,
  readSessionOutputView,
  readTerminal,
  readTypedLine,
  recordCommands,
  scrollToTheEndOfTheStep,
  typeCommand,
  waitForTerminal,
  waitUntilIdle,
  wheelUntilBusy,
  wheelUntilNextCommand,
} from './terminal'

import type { Page } from '@playwright/test'

const SESSION_OUTPUT = '[data-session-output]'
const ACTIVE_SCENE = '.terminal-scene.is-active'
const DIALOG_NAME = 'Get the resume'
const DIALOG_OPEN_LIMIT_MILLISECONDS = 15_000
/** The size observer settles after 150 ms; the re-measure follows on the next frame. */
const RESIZE_SETTLE_MILLISECONDS = 600
/** A short laptop, as a window shrunk by hand. */
const SHORTER_LAPTOP = { height: 600, width: LAPTOP_VIEWPORT.width }

async function openAt(page: Page, menuLabel: string): Promise<void> {
  await page.goto('/')
  await waitForTerminal(page)
  await pointAtOutput(page)
  await chooseFromMenu(page, menuLabel)
  await fastForward(page)
  await waitUntilIdle(page)
}

function readActiveScene(page: Page): Promise<string | undefined> {
  return page.locator(ACTIVE_SCENE).evaluate((scene) => (scene as HTMLElement).dataset.scene)
}

test.describe('typing at the prompt', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  test('from About, cat prints the card under the profile in whole rows, with the prompt visible', async ({
    page,
  }) => {
    await openAt(page, 'developer.profile')

    await typeCommand(page, 'cat work_experience/teampay.txt')

    const output = await readSessionOutput(page)
    expect(output).toContain('~/portfolio $ cat work_experience/teampay.txt')
    expect(output).toContain('Teampay')
    expect(await readActiveScene(page)).toBe('about')
    const view = await readSessionOutputView(page)
    expect(view.shownRows.length).toBeGreaterThan(0)
    expect(view.cutRows).toEqual([])
    expect(view.overlappingDock).toEqual([])
    const prompt = await page.locator('.terminal-prompt').boundingBox()
    const viewport = page.viewportSize()
    expect(prompt).not.toBeNull()
    expect((prompt?.y ?? 0) + (prompt?.height ?? 0)).toBeLessThanOrEqual(viewport?.height ?? 0)
  })

  test('scrolling on prints the next section and the session output is gone', async ({ page }) => {
    await openAt(page, 'developer.profile')
    await typeCommand(page, 'ls')
    expect(await readSessionOutput(page)).toContain('developer.profile')

    await wheelUntilNextCommand(page, 'down')

    expect(await page.locator(SESSION_OUTPUT).count()).toBe(0)
    expect(await readActiveScene(page)).toBe('work')
  })

  test('cd ../projects && ls, then a scroll, types a cd that is true from projects', async ({
    page,
  }) => {
    await openAt(page, 'education/')
    await recordCommands(page)

    await typeCommand(page, 'cd ../projects && ls')

    expect(await readSessionOutput(page)).toContain('akin.txt')
    await expect(page.locator('.terminal-prompt-path-full')).toHaveText('~/portfolio/projects')
    await wheelUntilNextCommand(page, 'down')
    expect((await readCommands(page)).at(-1)).toBe(
      'cat ~/portfolio/education/eleg_university_of_delaware.txt',
    )
    await wheelUntilNextCommand(page, 'down')
    expect((await readCommands(page)).at(-1)).toBe('clear && cd ../skills && ls -la')
  })

  test('Tab with an empty line moves focus', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)

    await page.keyboard.press('Tab')

    const isScrollerFocused = await page.evaluate(
      () => document.activeElement?.classList.contains('terminal-scroller') ?? false,
    )
    expect(isScrollerFocused).toBe(false)
    expect(await readTypedLine(page)).toBe('')
  })

  test('the menu and the resume window take keys, the shell does not', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await pointAtOutput(page)

    await page.getByRole('button', { exact: true, name: 'Menu' }).click()
    await page.keyboard.type('ls')
    expect(await readTypedLine(page)).toBe('')
    await page.keyboard.press('Escape')

    await chooseFromMenu(page, 'get_resume.sh')
    await fastForward(page)
    const dialog = page.getByRole('dialog', { name: DIALOG_NAME })
    await expect(dialog).toBeVisible({ timeout: DIALOG_OPEN_LIMIT_MILLISECONDS })
    await page.keyboard.type('ls')
    expect(await readTypedLine(page)).toBe('')
    expect(await page.locator(SESSION_OUTPUT).count()).toBe(0)
  })

  test('plain view has no shell', async ({ page }) => {
    await page.goto('/')
    await enterPlainView(page)

    await page.keyboard.type('ls')
    await page.keyboard.press('Enter')

    expect(await page.locator(SESSION_OUTPUT).count()).toBe(0)
  })

  test('a resize with session output on screen keeps it whole and on the same step', async ({
    page,
  }) => {
    await openAt(page, 'developer.profile')
    await typeCommand(page, 'ls -a')
    const before = await readTerminal(page)
    expect((await readSessionOutputView(page)).shownRows.length).toBeGreaterThan(0)

    await page.setViewportSize(SHORTER_LAPTOP)
    await page.waitForTimeout(RESIZE_SETTLE_MILLISECONDS)
    await waitUntilIdle(page)

    // The output no longer fits a shorter screen, so the step has length, and the typed output is
    // counted in it: the reader keeps the top line and reaches the rest by scrolling, whole.
    const after = await readTerminal(page)
    expect(after.step).toBe(before.step)
    expect(after.stepEnd).toBeGreaterThan(after.stepStart)
    expect(await page.locator(SESSION_OUTPUT).count()).toBe(1)
    await scrollToTheEndOfTheStep(page)
    const view = await readSessionOutputView(page)
    expect(view.cutRows).toEqual([])
    expect(view.overlappingDock).toEqual([])
    expect(view.shownRows.length).toBeGreaterThan(0)
  })

  test('typing while a tour command runs fast-forwards it and keeps the keys', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await pointAtOutput(page)
    await wheelUntilBusy(page, 'down')

    await page.keyboard.type('ls')
    await waitUntilIdle(page)

    expect(await readTypedLine(page)).toBe('ls')
    expect(await page.locator(SESSION_OUTPUT).count()).toBe(0)
    expect(await readActiveScene(page)).toBe('about')
    await page.keyboard.press('Enter')
    await waitUntilIdle(page)
    expect(await readSessionOutput(page)).toContain('developer.profile')
  })
})

test.describe('typing at the prompt, on a phone-sized window with a keyboard', () => {
  test.use({ viewport: PHONE_VIEWPORT })

  test('Space with an empty line scrolls the output', async ({ page }) => {
    await openAt(page, 'work_experience/')
    const { scrollTop, stepEnd, stepStart } = await readTerminal(page)
    expect(stepEnd).toBeGreaterThan(stepStart)

    await page.keyboard.press(' ')
    await page.waitForTimeout(RESIZE_SETTLE_MILLISECONDS)

    expect((await readTerminal(page)).scrollTop).toBeGreaterThan(scrollTop)
    expect(await readTypedLine(page)).toBe('')
  })
})
