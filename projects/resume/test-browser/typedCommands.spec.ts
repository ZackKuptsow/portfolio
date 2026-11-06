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
const SCROLLER = '.terminal-scroller'
const BLANK = '.terminal-session-blank'
const HERO_BLOCK = '[data-block="hero-0"]'
const SECOND_WORK_BLOCK = '[data-block="work-1"]'
const ART = '.terminal-session-art'
const YOU_SUFFER_VIDEO = '9Z1IGjr2cT0'
const PASSWORD_GUESS = 'hunter2-not-a-password'
/** Too short for the Vault's rows, with the title bar, prompt and footer around them. */
const SHORT_WINDOW = { height: 360, width: LAPTOP_VIEWPORT.width }
/** Part of a line, so the link is on the track and still cannot be read. */
const BEHIND_THE_PROMPT_PIXELS = 10
/** The gap between two cards, `margin-top: 2rem` in terminal.css. */
const CARD_GAP_PIXELS = 32
/** `pwd` takes about 180 ms from Enter to idle, and a blank must not print like output, at 1800. */
const CLEAR_LONGEST_MILLISECONDS = 800
const DRAW_SETTLE_MILLISECONDS = 200
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

async function readTopOf(page: Page, selector: string): Promise<number> {
  const box = await page.locator(selector).boundingBox()
  if (!box) {
    throw new Error(`Nothing on the page matches ${selector}`)
  }
  return box.y
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

  test('coming back to a screen that held typed output shows it as if nothing was typed', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await pointAtOutput(page)
    const untouched = await readTerminal(page)
    const untouchedTop = await readTopOf(page, HERO_BLOCK)

    await typeCommand(page, 'cat work_experience/low_rate_co.txt')
    expect((await readTerminal(page)).stepEnd).toBeGreaterThan(untouched.stepEnd)
    await wheelUntilNextCommand(page, 'down')
    await wheelUntilNextCommand(page, 'up')

    const back = await readTerminal(page)
    expect(back.step).toBe(untouched.step)
    expect(back.stepEnd).toBe(untouched.stepEnd)
    expect(await page.locator(SESSION_OUTPUT).count()).toBe(0)
    expect(await readTopOf(page, HERO_BLOCK)).toBe(untouchedTop)
  })

  test('typing on the next card keeps what was typed on the card before, until the screen changes', async ({
    page,
  }) => {
    await openAt(page, 'work_experience/')
    await typeCommand(page, 'pwd')
    await wheelUntilNextCommand(page, 'down')
    expect(await page.locator(SESSION_OUTPUT).count()).toBe(1)

    await typeCommand(page, 'whoami')

    const outputs = await page.locator(SESSION_OUTPUT).allTextContents()
    expect(outputs).toHaveLength(2)
    expect(outputs[0]).toContain('$ pwd')
    expect(outputs[1]).toContain('$ whoami')
    const firstOutputBox = await page.locator(SESSION_OUTPUT).first().boundingBox()
    const nextCardTop = await readTopOf(page, SECOND_WORK_BLOCK)
    expect(nextCardTop - ((firstOutputBox?.y ?? 0) + (firstOutputBox?.height ?? 0))).toBe(
      CARD_GAP_PIXELS,
    )

    await wheelUntilNextCommand(page, 'up')

    expect(await readActiveScene(page)).toBe('about')
    expect(await page.locator(SESSION_OUTPUT).count()).toBe(0)
  })

  test('clear is at once, empties the screen, and leaves what was printed reachable above', async ({
    page,
  }) => {
    await openAt(page, 'developer.profile')
    await page.keyboard.type('clear')

    const startedAt = Date.now()
    await page.keyboard.press('Enter')
    await waitUntilIdle(page)

    expect(Date.now() - startedAt).toBeLessThan(CLEAR_LONGEST_MILLISECONDS)
    expect((await readSessionOutputView(page)).shownRows).toEqual([])
    const blankHeight = await page
      .locator(BLANK)
      .evaluate((blank) => (blank as HTMLElement).offsetHeight)
    const { stepEnd } = await readTerminal(page)
    await page
      .locator(SCROLLER)
      .evaluate((scroller, top) => scroller.scrollTo(0, top), stepEnd - blankHeight)
    await page.waitForTimeout(DRAW_SETTLE_MILLISECONDS)
    expect((await readSessionOutputView(page)).shownRows.join(' ')).toContain('clear')
  })

  // A link off screen needs nothing: Chrome's own scroll on focus centers it. One still inside the
  // scroller and under the prompt counts as visible to the browser, so only the engine can move it.
  test('Tab to a link in typed output behind the prompt brings it clear of the prompt', async ({
    page,
  }) => {
    await openAt(page, 'developer.profile')
    await typeCommand(page, 'cat projects/hermes_imessage_shortcuts.txt')
    const link = page.locator(`${SESSION_OUTPUT} a`).first()
    const readLinkBelowDock = () =>
      link.evaluate((element) => {
        const dockTop = document.querySelector('.terminal-dock')?.getBoundingClientRect().top ?? 0
        return Math.round(element.getBoundingClientRect().bottom - dockTop)
      })
    await link.evaluate((element, pixelsBehindPrompt) => {
      const scroller = document.querySelector('.terminal-scroller')
      const dockTop = document.querySelector('.terminal-dock')?.getBoundingClientRect().top ?? 0
      if (scroller) {
        scroller.scrollTop += element.getBoundingClientRect().bottom - dockTop - pixelsBehindPrompt
      }
    }, BEHIND_THE_PROMPT_PIXELS)
    await expect.poll(readLinkBelowDock).toBe(BEHIND_THE_PROMPT_PIXELS)

    await page.keyboard.press('Tab')

    await expect(link).toBeFocused()
    await expect.poll(readLinkBelowDock).toBeLessThanOrEqual(0)
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

test.describe('what typing reaches outside the output', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  // Every request off this host is aborted, so nothing leaves: the request is the proof a tab opened.
  for (const [line, address] of [
    ['open github', 'github.com/ZackKuptsow'],
    ['sudo rm -rf /', 'dQw4w9WgXcQ'],
    ['fade', 'KvMY1uzSC1E'],
  ]) {
    test(`${line} opens its fixed address in a new tab`, async ({ context, page }) => {
      await page.goto('/')
      await waitForTerminal(page)
      const opened = context.waitForEvent('request', (request) => request.url().includes(address))

      await typeCommand(page, line)

      await opened
      await expect(page.locator('.terminal-prompt')).toBeVisible()
    })
  }

  test('special occasion warns first, opens nothing on a no, and plays on a yes', async ({
    context,
    page,
  }) => {
    await page.goto('/')
    await waitForTerminal(page)
    const opened: string[] = []
    context.on('request', (request) => {
      if (request.url().includes(YOU_SUFFER_VIDEO)) {
        opened.push(request.url())
      }
    })

    await typeCommand(page, 'special occasion')
    expect(await readSessionOutput(page)).toContain('Warning: this is loud. Play it? [y/N]')
    await page.keyboard.press('Enter')
    await waitUntilIdle(page)
    await page.waitForTimeout(DRAW_SETTLE_MILLISECONDS)
    expect(opened).toEqual([])

    await typeCommand(page, 'special occasion')
    const played = context.waitForEvent('request', (request) =>
      request.url().includes(YOU_SUFFER_VIDEO),
    )
    await typeCommand(page, 'y')

    await played
    expect(await readSessionOutput(page)).toContain('ALERT: the price of Bitcoin has changed.')
  })

  test('the password never shows, anywhere, and any guess gets in', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await typeCommand(page, 'ls -a')
    expect(await readSessionOutput(page)).toContain('.yougottagive')

    await typeCommand(page, 'cat .yougottagive')
    expect(await readSessionOutput(page)).toContain('Password:')
    await page.keyboard.type(PASSWORD_GUESS)
    expect(await readTypedLine(page)).toBe('')
    await page.keyboard.press('Enter')
    await waitUntilIdle(page)

    const output = await readSessionOutput(page)
    expect(output).toContain('Are you sure about that?')
    await expect(
      page.locator(`${SESSION_OUTPUT} a[href="https://getcalicocutpants.com/"]`),
    ).toBeVisible()
    await typeCommand(page, 'history')
    const pageText = await page.evaluate(() => document.documentElement.outerHTML)
    expect(pageText).not.toContain(PASSWORD_GUESS)
  })

  test('legen really pauses before its ending', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await page.keyboard.type('legen')
    await page.keyboard.press('Enter')

    await expect.poll(() => readSessionOutput(page)).toContain('wait for it...')
    expect(await readSessionOutput(page)).not.toContain('dary!')
    await expect.poll(() => readSessionOutput(page)).toContain('wait for it... dary!')
  })

  test('theme light switches the theme, and the menu follows', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await expect(page.locator('html')).toHaveClass(/dark/)

    await typeCommand(page, 'theme light')

    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await page.getByRole('button', { exact: true, name: 'Menu' }).click()
    await expect(
      page.getByRole('navigation', { name: 'Menu' }).getByRole('button', { name: 'dark mode' }),
    ).toBeVisible()
  })

  test('wget plays the download under what is on screen, and opens no window', async ({ page }) => {
    await openAt(page, 'developer.profile')

    await typeCommand(page, 'wget kups.me/get_resume.sh')

    const output = await readSessionOutput(page)
    expect(output).toContain('Resolving kups.me... done.')
    expect(output).toContain("'get_resume.sh' saved")
    await expect(page.getByRole('dialog', { name: DIALOG_NAME })).toHaveCount(0)
  })

  test('sh get_resume.sh opens the resume window, and closing it stays where the reader was', async ({
    page,
  }) => {
    await openAt(page, 'developer.profile')

    await typeCommand(page, 'sh get_resume.sh')

    const dialog = page.getByRole('dialog', { name: DIALOG_NAME })
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await waitUntilIdle(page)
    expect(await readActiveScene(page)).toBe('about')
  })
})

test.describe('the drawings', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  for (const name of ['triforce', 'vault']) {
    test(`${name} prints whole and clear of the prompt`, async ({ page }) => {
      await openAt(page, 'developer.profile')

      await typeCommand(page, name)

      const view = await readSessionOutputView(page)
      expect(view.cutRows).toEqual([])
      expect(view.overlappingDock).toEqual([])
      const fitsItsBox = await page
        .locator(ART)
        .evaluate((art) => art.scrollWidth <= art.clientWidth)
      expect(fitsItsBox).toBe(true)
    })
  }

  // Lines of a drawing that overlap read as one row to the engine, and then it can only clip all or
  // nothing: on a short window the drawing would never show in part.
  test('a window too short for the drawing scrolls through it a row at a time', async ({
    page,
  }) => {
    await page.setViewportSize(SHORT_WINDOW)
    await openAt(page, 'developer.profile')

    await typeCommand(page, 'vault')

    const rowsHigh = await page
      .locator(ART)
      .evaluate((art) => art.textContent?.split('\n').length ?? 0)
    const view = await readSessionOutputView(page)
    expect(view.cutRows).toEqual([])
    expect(view.shownRows.length).toBeGreaterThan(0)
    expect(view.shownRows.length).toBeLessThan(rowsHigh)
  })
})

test.describe('typing at the prompt, on a phone-sized window with a keyboard', () => {
  test.use({ viewport: PHONE_VIEWPORT })

  test('a drawing too wide for the window says so instead', async ({ page }) => {
    await openAt(page, 'developer.profile')

    await typeCommand(page, 'vault')

    expect(await page.locator(ART).count()).toBe(0)
    expect(await readSessionOutput(page)).toContain('vault: window too narrow')
  })

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
