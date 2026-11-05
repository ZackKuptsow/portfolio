import { CLOSE_BUTTON_LABEL } from '@/components/TerminalDialog/constants'
import { projects } from '@/data/projects'

import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'
import {
  chooseFromMenu,
  enterPlainView,
  fastForward,
  pointAtOutput,
  readCommands,
  readTerminal,
  recordCommands,
  waitForTerminal,
  waitUntilIdle,
  wheelUntilBusy,
  wheelUntilNextCommand,
} from './terminal'

import type { Page } from '@playwright/test'

const RESUME_COMMAND = 'wget kups.me/get_resume.sh && sh get_resume.sh'
const FIRST_PROJECTS_COMMAND = 'clear && cd ../projects && ls'
const DIALOG_NAME = 'Get the resume'
// DESIGN.md: about 6.5 seconds from the scroll point. This leaves room for a loaded machine
// without letting a skipped download pass.
const DOWNLOAD_SHORTEST_MILLISECONDS = 5_000
const DOWNLOAD_LONGEST_MILLISECONDS = 10_000
// DESIGN.md asks for under 100ms. A little more here, since a browser driven from outside has
// its own latency, and a real skip is still an order of magnitude under the wait it replaces.
const SKIPPED_DOWNLOAD_LONGEST_MILLISECONDS = 400
const DIALOG_OPEN_LIMIT_MILLISECONDS = 15_000
// The length of the `terminal-type` animation, in terminal.css.
const ECHO_TYPING_MILLISECONDS = 3_500
const ECHO_TYPING_MARGIN_MILLISECONDS = 300
// One row of the prompt: a 20 point line, 16 of padding and an edge.
const PROMPT_ONE_ROW_PIXELS = 37

/** The commands between the top of the page and Skills: About, 4 jobs, 2 degrees, then Skills. */
const COMMANDS_TO_SKILLS = 8
/** Counted from the first of Projects' cards. */
const LAST_PROJECT_CARD = projects.length - 1
/** Where cards that fit on screen together all end in one place. */
const SCREEN_THAT_FITS_EVERY_SECTION = { height: 6000, width: 1366 }

async function openTerminal(page: Page): Promise<void> {
  await page.goto('/')
  await waitForTerminal(page)
  await pointAtOutput(page)
  await recordCommands(page)
}

async function readToTheEndOfSkills(page: Page): Promise<void> {
  for (let command = 0; command < COMMANDS_TO_SKILLS; command += 1) {
    await wheelUntilNextCommand(page, 'down')
  }
}

/** Scrolls on from Skills, which types the `wget` command and runs the fake download. */
async function scrollIntoTheDownload(page: Page): Promise<void> {
  await wheelUntilBusy(page, 'down')
}

test.describe('on a laptop', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  test('a straight read down types the commands in the brief, word for word', async ({ page }) => {
    await openTerminal(page)

    await readToTheEndOfSkills(page)

    expect(await readCommands(page)).toEqual([
      'clear && cat developer.profile',
      'clear && cd ./work_experience && ls',
      'cat draynow.txt',
      'cat teampay.txt',
      'cat qlik.txt',
      'clear && cd ../education && ls',
      'cat eleg_university_of_delaware.txt',
      'clear && cd ../skills && ls -la',
    ])
  })

  // Zack: "My eleg entry is being completely skipped." Its command was typed, and the screen went on
  // to Skills: two cards that fit on screen end in one place, so the scroll read as past them both.
  for (const [screen, viewport] of [
    ['a laptop', LAPTOP_VIEWPORT],
    ['a screen that fits every section whole', SCREEN_THAT_FITS_EVERY_SECTION],
  ] as const) {
    test(`a read down lands on every card in turn, and prints it, on ${screen}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await openTerminal(page)

      for (let command = 1; command <= COMMANDS_TO_SKILLS; command += 1) {
        await wheelUntilNextCommand(page, 'down')
        expect((await readTerminal(page)).step).toBe(command)
      }
      await expect(page.locator('[data-scene="skills"]')).toBeVisible()

      await chooseFromMenu(page, 'education/')
      await waitUntilIdle(page)
      await expect(page.getByText('Bachelor of Electrical Engineering')).toBeHidden()

      await wheelUntilNextCommand(page, 'down')

      await expect(page.getByText('Bachelor of Electrical Engineering')).toBeVisible()
      expect((await readCommands(page)).at(-1)).toBe('cat eleg_university_of_delaware.txt')
    })

    // The last section has no track of its own after it, and cards that fit all end in one place.
    test(`every card of the last section can be reached by scrolling, on ${screen}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await openTerminal(page)
      await chooseFromMenu(page, 'projects/')
      await fastForward(page)
      await waitUntilIdle(page)
      const { step: firstCard } = await readTerminal(page)

      for (let card = 1; card <= LAST_PROJECT_CARD; card += 1) {
        await wheelUntilNextCommand(page, 'down')
        expect((await readTerminal(page)).step).toBe(firstCard + card)
      }
      // Without the whole section on screen here, the track has room anyway and this proves nothing.
      if (viewport === SCREEN_THAT_FITS_EVERY_SECTION) {
        const { sectionStart, stepEnd } = await readTerminal(page)
        expect(stepEnd).toBe(sectionStart)
      }
    })
  }

  test('the commands stay true going back up, and the prompt shows where they leave you', async ({
    page,
  }) => {
    await openTerminal(page)
    await readToTheEndOfSkills(page)
    await expect(page.locator('.terminal-title')).toHaveText('zack@kups: ~/portfolio/skills')

    await wheelUntilNextCommand(page, 'up')
    await expect(page.locator('.terminal-title')).toHaveText('zack@kups: ~/portfolio')
    await wheelUntilNextCommand(page, 'up')

    // The first card of Education was already on screen, so going up passes it and types nothing.
    const commands = await readCommands(page)
    expect(commands.at(-2)).toBe('cd .. && cat education/eleg_university_of_delaware.txt')
    expect(commands.at(-1)).toBe('cat work_experience/qlik.txt')
    await expect(page.locator('.terminal-title')).toHaveText('zack@kups: ~/portfolio')
  })

  test('the screen clears between sections, and cards stay within a section', async ({ page }) => {
    await openTerminal(page)
    await wheelUntilNextCommand(page, 'down')
    await expect(page.locator('[data-scene="about"]')).toBeVisible()
    await expect(page.locator('[data-scene="hero"]')).toBeHidden()

    await wheelUntilNextCommand(page, 'down')
    await expect(page.locator('[data-scene="about"]')).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Low Rate Co.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'DrayNow' })).toBeHidden()

    await wheelUntilNextCommand(page, 'down')
    await expect(page.getByRole('heading', { name: 'DrayNow' })).toBeVisible()
  })

  test('nothing but the prompt shows a command', async ({ page }) => {
    await openTerminal(page)
    await wheelUntilNextCommand(page, 'down')

    await expect(page.locator('.terminal-scene')).not.toContainText(['cat developer.profile'])
  })

  test('up from the first screen types exit and reprints the hero', async ({ page }) => {
    await openTerminal(page)

    await wheelUntilNextCommand(page, 'up')

    expect(await readCommands(page)).toEqual(['exit'])
    await expect(page.locator('.terminal-hero-handle')).toBeInViewport()
  })

  test('End and Home jump, instead of racing every command on the way', async ({ page }) => {
    await openTerminal(page)
    await page.locator('.terminal-scroller').focus()

    await page.keyboard.press('End')
    await waitUntilIdle(page)
    await expect(page.getByRole('heading', { name: 'This site' })).toBeVisible()
    await expect(page.locator('dialog[open]')).toHaveCount(0)

    await page.keyboard.press('Home')
    await waitUntilIdle(page)
    await expect(page.locator('.terminal-hero-handle')).toBeInViewport()

    expect(await readCommands(page)).toEqual([
      'clear && cd ~/portfolio/projects && ls',
      'clear && cd ~ && whoami',
    ])
  })

  test('the keyboard scrolls the output from the moment the page opens', async ({ page }) => {
    await page.goto('/')
    await waitForTerminal(page)

    await expect(page.locator('.terminal-scroller')).toBeFocused()
  })

  test('the menu closes, types the command and prints, skipping neither', async ({ page }) => {
    await openTerminal(page)

    await chooseFromMenu(page, 'education/')

    const drawer = page.getByRole('navigation', { name: 'Menu' })
    await expect(drawer).toBeHidden()
    await expect(page.locator('.terminal-root')).toHaveAttribute('data-busy', 'true')
    await waitUntilIdle(page)
    expect(await readCommands(page)).toEqual(['clear && cd ~/portfolio/education && ls'])
    await expect(page.getByRole('heading', { exact: true, name: 'Education' })).toBeVisible()
  })

  test('the menu marks the section on screen, and stays on this page to go there', async ({
    page,
  }) => {
    await openTerminal(page)

    await chooseFromMenu(page, 'projects/')
    await waitUntilIdle(page)

    await expect(page.getByRole('heading', { name: 'hermes-imessage-shortcuts' })).toBeVisible()
    expect(page.url()).not.toContain('projects.html')

    await page.getByRole('button', { exact: true, name: 'Menu' }).click()
    await expect(page.getByRole('button', { name: 'projects/' })).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  test('Escape closes the menu and gives the keyboard back to its button', async ({ page }) => {
    await openTerminal(page)
    const menuButton = page.getByRole('button', { exact: true, name: 'Menu' })

    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')

    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await expect(menuButton).toBeFocused()
  })

  test('plain view shows every section with no prompt, and terminal view comes back', async ({
    page,
  }) => {
    await openTerminal(page)
    await wheelUntilNextCommand(page, 'down')
    const stepBefore = (await readTerminal(page)).step

    await enterPlainView(page)
    await expect(page.locator('.terminal-prompt')).toBeHidden()
    for (const sceneId of ['hero', 'about', 'work', 'education', 'skills', 'projects']) {
      await expect(page.locator(`[data-scene="${sceneId}"]`)).toBeVisible()
    }
    await expect(page.getByRole('heading', { name: 'DrayNow' })).toBeVisible()

    await page.locator('.terminal-plain-toggle').click()
    await expect(page.locator('.terminal-root')).toHaveAttribute('data-engine-ready')
    await expect(page.locator('.terminal-prompt')).toBeVisible()
    expect((await readTerminal(page)).step).toBe(stepBefore)
    await expect(page.locator('[data-scene="hero"]')).toBeHidden()
  })

  test('find in page, reaching a hidden section, gets the plain flow that can show it', async ({
    page,
  }) => {
    await openTerminal(page)
    const hiddenScene = page.locator('[data-scene="skills"]')
    await expect(hiddenScene).toHaveAttribute('hidden', 'until-found')

    await hiddenScene.evaluate((scene) =>
      scene.dispatchEvent(new Event('beforematch', { bubbles: true })),
    )

    await expect(hiddenScene).toBeVisible()
    await expect(page.locator('.terminal-root')).not.toHaveAttribute('data-engine-ready')
  })

  test('the printed page is the plain flow, whichever section is on screen', async ({ page }) => {
    await openTerminal(page)
    await wheelUntilNextCommand(page, 'down')

    await page.emulateMedia({ media: 'print' })

    for (const sceneId of ['hero', 'about', 'work', 'education', 'skills', 'projects']) {
      await expect(page.locator(`[data-scene="${sceneId}"]`)).toBeVisible()
    }
    await expect(page.getByRole('heading', { name: 'DrayNow' })).toBeVisible()
    await expect(page.locator('.terminal-prompt')).toBeHidden()
    await expect(page.locator('.terminal-title-bar')).toBeHidden()
  })

  test('the echo line types when a reader arrives at it, not once at load', async ({ page }) => {
    await openTerminal(page)
    // Longer than the typing takes, so a line that started at load would be over by now.
    await page.waitForTimeout(ECHO_TYPING_MILLISECONDS + ECHO_TYPING_MARGIN_MILLISECONDS)

    await wheelUntilNextCommand(page, 'down')

    const typedFor = await page.locator('.terminal-typing').evaluate((element) => {
      const typing = element
        .getAnimations()
        .find((animation) => (animation as CSSAnimation).animationName === 'terminal-type')
      return typing ? Number(typing.currentTime) : null
    })
    expect(typedFor).not.toBeNull()
    expect(typedFor).toBeLessThan(ECHO_TYPING_MILLISECONDS)
  })

  test('the things that make it feel like the site are all still here', async ({ page }) => {
    await openTerminal(page)

    const readStyle = (selector: string, property: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property)

    expect(await readStyle('.terminal-hero-path', 'text-shadow')).not.toBe('none')
    expect(await readStyle('.terminal-hero-handle', 'text-shadow')).not.toBe('none')
    expect(await readStyle('.terminal-tagline .command-prompt', 'text-shadow')).not.toBe('none')
    expect(await readStyle('.terminal-hero-rule', 'animation-name')).toBe('terminal-pulse')

    await page.mouse.move(400, 400)
    await page.mouse.move(420, 420)
    await expect(page.locator('.glow-cursor')).toHaveCount(1)

    await wheelUntilNextCommand(page, 'down')
    await expect(page.getByText('Last updated:')).toBeVisible()
    await expect(page.getByText(/echo "Let's build something amazing together"/)).toBeVisible()

    await wheelUntilNextCommand(page, 'down')
    const heading = page.getByRole('heading', { name: 'Work Experience' })
    const shadowAtRest = await heading.evaluate((element) => getComputedStyle(element).textShadow)
    await heading.hover()
    await expect
      .poll(() => heading.evaluate((element) => getComputedStyle(element).textShadow))
      .not.toBe(shadowAtRest)
  })
})

test.describe('the resume, from the terminal', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  test('the end of Skills types the command, runs the download and opens the real window', async ({
    page,
  }) => {
    await openTerminal(page)
    await readToTheEndOfSkills(page)

    const startedAt = Date.now()
    await scrollIntoTheDownload(page)
    await expect(page.getByRole('dialog', { name: DIALOG_NAME })).toBeVisible({
      timeout: DIALOG_OPEN_LIMIT_MILLISECONDS,
    })
    const took = Date.now() - startedAt

    expect(took).toBeGreaterThan(DOWNLOAD_SHORTEST_MILLISECONDS)
    expect(took).toBeLessThan(DOWNLOAD_LONGEST_MILLISECONDS)
    expect((await readCommands(page)).at(-1)).toBe(RESUME_COMMAND)
    await expect(page.locator('[data-download-output]')).toContainText('Opening the resume...')
  })

  test('a click skips the download at once', async ({ page }) => {
    await openTerminal(page)
    await readToTheEndOfSkills(page)
    await scrollIntoTheDownload(page)
    // In the download itself, and not still typing the command.
    await expect(page.locator('[data-download-output]')).toContainText('Resolving', {
      timeout: DIALOG_OPEN_LIMIT_MILLISECONDS,
    })

    const took = await page.evaluate(() => {
      const output = document.querySelector<HTMLElement>('[data-download-output]')
      const startedAt = performance.now()
      output?.click()
      const dialog = document.querySelector('dialog.terminal-dialog[open]')
      return dialog ? performance.now() - startedAt : Number.POSITIVE_INFINITY
    })

    expect(took).toBeLessThan(SKIPPED_DOWNLOAD_LONGEST_MILLISECONDS)
    await expect(page.getByRole('dialog', { name: DIALOG_NAME })).toBeVisible()
  })

  test('the menu runs the whole download too, which only a timing can show', async ({ page }) => {
    await openTerminal(page)

    const startedAt = Date.now()
    await chooseFromMenu(page, 'get_resume.sh')
    await expect(page.getByRole('dialog', { name: DIALOG_NAME })).toBeVisible({
      timeout: DIALOG_OPEN_LIMIT_MILLISECONDS,
    })

    expect(Date.now() - startedAt).toBeGreaterThan(DOWNLOAD_SHORTEST_MILLISECONDS)
    expect((await readCommands(page)).at(-1)).toBe(RESUME_COMMAND)
  })

  for (const [route, closeWindow] of [
    ['Escape', (page: Page) => page.keyboard.press('Escape')],
    [
      'the close button',
      (page: Page) => page.getByRole('button', { name: CLOSE_BUTTON_LABEL }).click(),
    ],
    [
      'the backdrop',
      async (page: Page) => {
        await page.mouse.move(4, 400)
        await page.mouse.down()
        await page.mouse.up()
      },
    ],
  ] as const) {
    test(`closing the window with ${route} types the command and loads Projects`, async ({
      page,
    }) => {
      await openTerminal(page)
      await readToTheEndOfSkills(page)
      await scrollIntoTheDownload(page)
      const dialog = page.getByRole('dialog', { name: DIALOG_NAME })
      await expect(dialog).toBeVisible({ timeout: DIALOG_OPEN_LIMIT_MILLISECONDS })

      await closeWindow(page)
      await expect(dialog).toBeHidden()

      // A dialog reports its close a moment later, so the command starts a moment later too.
      await expect.poll(async () => (await readCommands(page)).at(-1)).toBe(FIRST_PROJECTS_COMMAND)
      await waitUntilIdle(page)
      await expect(page.getByRole('heading', { name: 'hermes-imessage-shortcuts' })).toBeVisible()
      await expect(page.locator('.terminal-title')).toContainText('~/portfolio/projects')
    })
  }

  test('going up from Projects never opens the window', async ({ page }) => {
    await openTerminal(page)
    await chooseFromMenu(page, 'projects/')
    await waitUntilIdle(page)

    await wheelUntilNextCommand(page, 'up')

    expect((await readCommands(page)).at(-1)).toBe('cd .. && ls -la skills/')
    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await expect(page.getByRole('heading', { exact: true, name: 'Skills' })).toBeVisible()
  })

  test('an email request survives closing, and Projects still loads', async ({ page }) => {
    await page.route('**/resume-requests', (route) =>
      route.fulfill({ headers: { 'access-control-allow-origin': '*' }, status: 202 }),
    )
    await openTerminal(page)
    await chooseFromMenu(page, 'get_resume.sh')
    const dialog = page.getByRole('dialog', { name: DIALOG_NAME })
    await expect(dialog).toBeVisible({ timeout: DIALOG_OPEN_LIMIT_MILLISECONDS })

    await dialog.getByRole('textbox', { name: 'Your email address' }).fill('you@company.com')
    await dialog.getByRole('button', { name: 'send' }).click()
    await page.keyboard.press('Escape')
    await waitUntilIdle(page)
    await expect(page.getByRole('heading', { name: 'hermes-imessage-shortcuts' })).toBeVisible()

    await chooseFromMenu(page, 'get_resume.sh')
    await expect(dialog).toBeVisible({ timeout: DIALOG_OPEN_LIMIT_MILLISECONDS })
    await expect(dialog.getByRole('status')).toContainText('Got it.')
  })
})

test.describe('on a phone', () => {
  test.use({ hasTouch: true, viewport: PHONE_VIEWPORT })

  test('plain view is in the menu, and the title bar has the path and the hamburger', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForTerminal(page)

    await expect(page.locator('.terminal-plain-toggle')).toBeHidden()
    await expect(page.locator('.terminal-title-user')).toBeHidden()
    await page.getByRole('button', { exact: true, name: 'Menu' }).click()
    await expect(page.locator('.terminal-plain-toggle-item')).toBeVisible()
  })

  test('the email placeholder fits the field in full', async ({ page }) => {
    await page.goto('/')
    await enterPlainView(page)
    await page.getByRole('button', { name: './get_resume.sh' }).click()
    const field = page.getByRole('dialog').getByRole('textbox')

    const room = await field.evaluate((input: HTMLInputElement) => {
      const context = document.createElement('canvas').getContext('2d')
      if (!context) {
        throw new Error('No canvas to measure the placeholder with')
      }
      context.font = getComputedStyle(input).font
      return input.clientWidth - context.measureText(input.placeholder).width
    })

    expect(room).toBeGreaterThanOrEqual(0)
  })

  // Zack reported this twice on the prototype: a long command wraps the prompt over the text. The
  // room is kept clear ahead of time, so this reads the prompt at its tallest, as it types.
  test('the prompt never covers a line of output, even typing the longest command', async ({
    page,
  }) => {
    await page.goto('/')
    await waitForTerminal(page)
    await pointAtOutput(page)
    await chooseFromMenu(page, 'projects/')
    await waitUntilIdle(page)
    await page.evaluate(() => {
      const typed = document.querySelector('.terminal-typed')
      const prompt = document.querySelector<HTMLElement>('.terminal-prompt')
      const reading = { overlap: 0, tallest: 0 }
      new MutationObserver(() => {
        const scene = document.querySelector<HTMLElement>('.terminal-scene.is-active')
        const bottomEdge = /calc\(100% - (-?[\d.]+)px\)/.exec(scene?.style.clipPath ?? '')?.[1]
        if (!prompt || !scene || bottomEdge === undefined) {
          return
        }
        const promptBox = prompt.getBoundingClientRect()
        const lastShownRow = scene.getBoundingClientRect().top + Number(bottomEdge)
        reading.overlap = Math.max(reading.overlap, lastShownRow - promptBox.top)
        reading.tallest = Math.max(reading.tallest, promptBox.height)
      }).observe(typed as Node, { characterData: true, childList: true, subtree: true })
      ;(window as unknown as { promptReading: typeof reading }).promptReading = reading
    })

    // Two cards on from the first is `cat a_household_assistant_by_text_and_...txt`. Typed at its
    // own pace, because a fast-forwarded command is gone before the prompt can be read.
    await wheelUntilBusy(page, 'down')
    await waitUntilIdle(page)
    await wheelUntilBusy(page, 'down')
    await waitUntilIdle(page)

    const { overlap, tallest } = await page.evaluate(
      () =>
        (window as unknown as { promptReading: { overlap: number; tallest: number } })
          .promptReading,
    )
    expect(overlap).toBeLessThanOrEqual(0)
    // Without a command long enough to wrap, this would pass and prove nothing.
    expect(tallest).toBeGreaterThan(PROMPT_ONE_ROW_PIXELS)
  })

  // The worst phone bug the prototype had: `render()` sent the reader back to the hero whenever
  // the size changed, which is what an address bar does on every scroll.
  for (const [label, nextViewport] of [
    ['rotating', { height: PHONE_VIEWPORT.width, width: PHONE_VIEWPORT.height }],
    ['the address bar changing size', { ...PHONE_VIEWPORT, height: PHONE_VIEWPORT.height - 60 }],
  ] as const) {
    test(`${label} keeps the reader on the same step, at the same point`, async ({ page }) => {
      await page.goto('/')
      await waitForTerminal(page)
      await chooseFromMenu(page, 'work_experience/')
      await waitUntilIdle(page)
      const before = await readTerminal(page)
      const halfway = before.stepStart + (before.stepEnd - before.stepStart) / 2
      await page.evaluate((top) => {
        document.querySelector('.terminal-scroller')?.scrollTo(0, top)
      }, halfway)

      await page.setViewportSize(nextViewport)

      await expect.poll(async () => (await readTerminal(page)).stepEnd).not.toBe(before.stepEnd)
      const after = await readTerminal(page)
      expect(after.step).toBe(before.step)
      const positionInStep = (after.scrollTop - after.stepStart) / (after.stepEnd - after.stepStart)
      expect(positionInStep).toBeGreaterThan(0.4)
      expect(positionInStep).toBeLessThan(0.6)
      await expect(page.locator('[data-scene="hero"]')).toBeHidden()
      await expect(page.locator('[data-scene="work"]')).toBeVisible()
    })
  }
})
