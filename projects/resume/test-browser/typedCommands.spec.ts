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
import {
  PROMPT_HINT_FADE_MILLISECONDS,
  PROMPT_HINT_WAIT_MILLISECONDS,
} from '../components/Terminal/constants'

import type { Page } from '@playwright/test'

const SESSION_OUTPUT = '[data-session-output]'
const SCROLLER = '.terminal-scroller'
const BLANK = '.terminal-session-blank'
const HERO_BLOCK = '[data-block="hero-0"]'
const SECOND_WORK_BLOCK = '[data-block="work-1"]'
const ART = '.terminal-session-art'
const YOU_SUFFER_VIDEO = '9Z1IGjr2cT0'
const FADE_VIDEO = 'KvMY1uzSC1E'
const THE_TEXT_ENDING = 'every single detail is'
const PROMPT = '.terminal-prompt'
/** The hint on screen, if any. Playwright counts its wait at opacity 0 as shown, so these do too. */
const SHOWN_PROMPT_HINT = '.terminal-prompt-hint:visible'
const FIRST_SCREEN_ROOT = '.terminal-root[data-prompt-hint="first-screen"]'
const END_OF_TOUR_ROOT = '.terminal-root[data-prompt-hint="end-of-tour"]'
/** Past the wait and the fade, with room for a slow machine. */
const PROMPT_HINT_LIMIT_MILLISECONDS =
  PROMPT_HINT_WAIT_MILLISECONDS + PROMPT_HINT_FADE_MILLISECONDS + 2_000
/** Less than a screen, and less than it takes to start a command. */
const SMALL_WHEEL_PIXELS = 40
/** A swipe short of a command is forgotten after 700 ms. */
const PULL_FORGOTTEN_SETTLE_MILLISECONDS = 1_000
const ANIMATION_LIMIT_MILLISECONDS = 10_000
const KONAMI_CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]
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

/** The End key's trip to the last step, with its command skipped. */
async function goToTheEndOfTheTour(page: Page): Promise<void> {
  await page.goto('/')
  await waitForTerminal(page)
  await page.keyboard.press('End')
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
  test('fade plays its song right in the output, and clear of the prompt', async ({
    context,
    page,
  }) => {
    await page.goto('/')
    await waitForTerminal(page)
    const requested = context.waitForEvent('request', (request) =>
      request.url().includes(`youtube-nocookie.com/embed/${FADE_VIDEO}`),
    )

    await typeCommand(page, 'fade')

    await requested
    const player = page.locator(`${SESSION_OUTPUT} iframe`)
    await expect(player).toBeVisible()
    const box = await player.boundingBox()
    const dock = await page.locator('.terminal-dock').boundingBox()
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(dock?.y ?? 0)
  })

  test('scrolling on stops the song', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await pointAtOutput(page)
    await typeCommand(page, 'fade')
    await expect(page.locator(`${SESSION_OUTPUT} iframe`)).toBeVisible()

    await wheelUntilNextCommand(page, 'down')

    await expect(page.locator('iframe')).toHaveCount(0)
  })

  for (const [line, address] of [
    ['open github', 'github.com/ZackKuptsow'],
    ['sudo rm -rf /', 'dQw4w9WgXcQ'],
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

  test('bitcoin warns first, opens nothing on a no, and plays on a yes', async ({
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

    await typeCommand(page, 'bitcoin')
    expect(await readSessionOutput(page)).toContain('Warning: this is loud. Play it? [y/N]')
    await page.keyboard.press('Enter')
    await waitUntilIdle(page)
    await page.waitForTimeout(DRAW_SETTLE_MILLISECONDS)
    expect(opened).toEqual([])

    await typeCommand(page, 'bitcoin')
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
    // The password, then each "Are you sure about that?", all hidden: someone may retype it.
    for (const answer of ['password', 'first doubt', 'second doubt']) {
      await page.keyboard.type(`${PASSWORD_GUESS}-${answer}`)
      expect(await readTypedLine(page)).toBe('')
      await page.keyboard.press('Enter')
      await waitUntilIdle(page)
    }

    const output = await readSessionOutput(page)
    expect(output?.match(/Are you sure about that\?/g)).toHaveLength(2)
    expect(output).toContain("I'm joking. I'm joking")
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

  for (const [name, line] of [
    ['link', "It's dangerous to go alone! Take this."],
    ['guns', '87 bazillion'],
  ]) {
    test(`${name} prints its drawing whole, with its line under it`, async ({ page }) => {
      await openAt(page, 'developer.profile')

      await typeCommand(page, name)

      const artBox = await page.locator(ART).boundingBox()
      const lineBox = await page.locator(`${SESSION_OUTPUT} p`, { hasText: line }).boundingBox()
      expect(lineBox?.y).toBeGreaterThan(artBox?.y ?? Infinity)
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

    await typeCommand(page, 'guns')

    const rowsHigh = await page
      .locator(ART)
      .evaluate((art) => art.textContent?.split('\n').length ?? 0)
    const view = await readSessionOutputView(page)
    expect(view.cutRows).toEqual([])
    expect(view.shownRows.length).toBeGreaterThan(0)
    expect(view.shownRows.length).toBeLessThan(rowsHigh)
  })
})

test.describe('the animations', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  test('encrypt drops the dot, and decrypt brings it back', async ({ page }) => {
    await openAt(page, 'developer.profile')
    await page.keyboard.type('encrypt')
    await page.keyboard.press('Enter')

    await expect.poll(() => readSessionOutput(page)).toContain(`${THE_TEXT_ENDING}....perfect`)
    await expect
      .poll(() => readSessionOutput(page), { timeout: ANIMATION_LIMIT_MILLISECONDS })
      .toContain(`${THE_TEXT_ENDING}...perfect`)
    await waitUntilIdle(page)
    const view = await readSessionOutputView(page)
    expect(view.cutRows).toEqual([])
    expect(view.overlappingDock).toEqual([])

    await typeCommand(page, 'decrypt')
    await expect
      .poll(() => page.locator(`${SESSION_OUTPUT} pre`).last().textContent())
      .toContain(`${THE_TEXT_ENDING}....perfect`)
  })

  test('a key hurries an animation straight to its end', async ({ page }) => {
    await openAt(page, 'developer.profile')
    await page.keyboard.type('deepthought')
    await page.keyboard.press('Enter')
    await expect.poll(() => readSessionOutput(page)).toContain('years remaining')

    await page.keyboard.press('Escape')
    await waitUntilIdle(page)

    expect(await readSessionOutput(page)).toContain('42')
    await typeCommand(page, 'echo $?')
    expect(await readSessionOutput(page)).toMatch(/echo \$\?\s*42/)
  })

  test('the Konami code works from the keyboard', async ({ page }) => {
    await openAt(page, 'developer.profile')

    for (const key of KONAMI_CODE) {
      await page.keyboard.press(key)
    }
    await waitUntilIdle(page)

    expect(await readSessionOutput(page)).toContain('+30 lives')
    expect(await readTypedLine(page)).toBe('')
  })
})

test.describe('the guidance', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  test('the first screen says it scrolls, but only after a wait', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    const hint = page.locator(SHOWN_PROMPT_HINT)

    await expect(hint).toHaveText('scroll, or try: help')
    await page.waitForTimeout(PROMPT_HINT_WAIT_MILLISECONDS / 2)
    await expect(hint).toHaveCSS('opacity', '0')

    await expect(hint).toHaveCSS('opacity', '1', { timeout: PROMPT_HINT_LIMIT_MILLISECONDS })
  })

  test('a page that opens further on says it too', async ({ page }) => {
    await page.goto('/projects.html')
    await waitForTerminal(page)

    await expect(page.locator(SHOWN_PROMPT_HINT)).toHaveText('scroll, or try: help')
  })

  test('the first scroll puts the hint away, and it stays away', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await pointAtOutput(page)
    const hint = page.locator(SHOWN_PROMPT_HINT)
    await expect(hint).toHaveCount(1)

    await page.mouse.wheel(0, SMALL_WHEEL_PIXELS)
    await expect(hint).toHaveCount(0)

    await page.waitForTimeout(PULL_FORGOTTEN_SETTLE_MILLISECONDS)
    await expect(hint).toHaveCount(0)
  })

  test('a wheel up at the very top counts, though nothing moves', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await pointAtOutput(page)
    const hint = page.locator(SHOWN_PROMPT_HINT)
    await expect(hint).toHaveCount(1)

    await page.mouse.wheel(0, -SMALL_WHEEL_PIXELS)

    await expect(hint).toHaveCount(0)
  })

  test('a dragged scrollbar counts, with no wheel or key to go by', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    const hint = page.locator(SHOWN_PROMPT_HINT)
    await expect(hint).toHaveCount(1)

    await page
      .locator(SCROLLER)
      .evaluate((scroller, top) => scroller.scrollTo(0, top), SMALL_WHEEL_PIXELS)

    await expect(hint).toHaveCount(0)
  })

  test('a scrolling key counts', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    const hint = page.locator(SHOWN_PROMPT_HINT)
    await expect(hint).toHaveCount(1)

    await page.keyboard.press('ArrowDown')

    await expect(hint).toHaveCount(0)
  })

  test('a section being read says nothing', async ({ page }) => {
    await openAt(page, 'developer.profile')

    await expect(page.locator(SHOWN_PROMPT_HINT)).toHaveCount(0)
  })

  test('typing puts the hint away, and emptying the line starts the wait again', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForTerminal(page)
    const hint = page.locator(SHOWN_PROMPT_HINT)
    await expect(hint).toHaveCount(1)

    await page.keyboard.type('p')
    await expect(hint).toHaveCount(0)

    await page.keyboard.press('Escape')
    await expect(hint).toHaveCount(1)
    await expect(hint).toHaveCSS('opacity', '0')

    await typeCommand(page, 'pwd')
    await expect(hint).toHaveCount(0)
  })

  test('the hint steps aside while the tour types', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await pointAtOutput(page)

    await wheelUntilBusy(page, 'down')

    await expect(page.locator(SHOWN_PROMPT_HINT)).toHaveCount(0)
  })

  test('the end of the tour offers the shell, after the same wait', async ({ page }) => {
    await goToTheEndOfTheTour(page)
    await scrollToTheEndOfTheStep(page)
    const hint = page.locator(SHOWN_PROMPT_HINT)

    await expect(hint).toHaveText('try: help')
    await expect(hint).toHaveCSS('opacity', '0')

    await expect(hint).toHaveCSS('opacity', '1', { timeout: PROMPT_HINT_LIMIT_MILLISECONDS })
  })

  test('someone who has typed has found the shell, so the end of the tour stays quiet', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await typeCommand(page, 'pwd')

    await page.keyboard.press('End')
    await fastForward(page)
    await waitUntilIdle(page)
    await scrollToTheEndOfTheStep(page)

    await expect(page.locator(END_OF_TOUR_ROOT)).toHaveCount(1)
    await expect(page.locator(SHOWN_PROMPT_HINT)).toHaveCount(0)
  })

  test('the menu has a help entry that types it at the prompt', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await recordCommands(page)

    await chooseFromMenu(page, 'help')
    await waitUntilIdle(page)

    expect(await readCommands(page)).toContain('help')
    const output = await readSessionOutput(page)
    expect(output).toContain('~/portfolio $ help')
    expect(output).toContain("There's more in /usr/games")
    await page.keyboard.type('p')
    expect(await readTypedLine(page)).toBe('p')
  })

  test('plain view has no help entry, because it has no prompt', async ({ page }) => {
    await page.goto('/')
    await enterPlainView(page)
    await page.getByRole('button', { exact: true, name: 'Menu' }).click()

    await expect(
      page.getByRole('navigation', { name: 'Menu' }).getByRole('button', { name: 'help' }),
    ).toHaveCount(0)
  })

  test('print leaves out what was typed', async ({ page }) => {
    await openAt(page, 'developer.profile')
    await typeCommand(page, 'pwd')

    await page.emulateMedia({ media: 'print' })

    await expect(page.locator(SESSION_OUTPUT)).toBeHidden()
  })
})

test.describe('the end of the tour, with more output than fits on screen', () => {
  test.use({ viewport: SHORT_WINDOW })

  test('says nothing until the last line is on screen, or after going back up', async ({
    page,
  }) => {
    await goToTheEndOfTheTour(page)
    const { stepEnd, stepStart } = await readTerminal(page)
    expect(stepEnd).toBeGreaterThan(stepStart)
    const hint = page.locator(SHOWN_PROMPT_HINT)
    await expect(hint).toHaveCount(0)

    await scrollToTheEndOfTheStep(page)
    await expect(hint).toHaveText('try: help')

    await page.locator(SCROLLER).evaluate((scroller, top) => scroller.scrollTo(0, top), stepStart)
    await expect(hint).toHaveCount(0)
  })
})

test.describe('on a phone, which has no keyboard to type with', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: PHONE_VIEWPORT })

  test('neither the prompt hint nor the menu entry shows', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)

    // The engine still says which hint is due, so only the phone rule is keeping it off screen.
    await expect(page.locator(FIRST_SCREEN_ROOT)).toHaveCount(1)
    await expect(page.locator(SHOWN_PROMPT_HINT)).toHaveCount(0)
    await page.getByRole('button', { exact: true, name: 'Menu' }).click()
    await expect(
      page.getByRole('navigation', { name: 'Menu' }).getByRole('button', { name: 'help' }),
    ).toBeHidden()
  })
})

test.describe('typing at the prompt, on a phone-sized window with a keyboard', () => {
  test.use({ viewport: PHONE_VIEWPORT })

  test('the hint fits on the prompt line, so it moves nothing when it goes', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await pointAtOutput(page)
    const hint = page.locator(SHOWN_PROMPT_HINT)
    await expect(hint).toHaveCount(1)
    const withHint = await page.locator(PROMPT).boundingBox()

    await page.mouse.wheel(0, -SMALL_WHEEL_PIXELS)
    await expect(hint).toHaveCount(0)

    expect((await page.locator(PROMPT).boundingBox())?.height).toBe(withHint?.height)
  })

  test('a drawing too wide for the window stays out, and its line still prints', async ({
    page,
  }) => {
    await openAt(page, 'developer.profile')

    await typeCommand(page, 'guns')

    expect(await page.locator(ART).count()).toBe(0)
    expect(await readSessionOutput(page)).toContain('87 bazillion')
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
