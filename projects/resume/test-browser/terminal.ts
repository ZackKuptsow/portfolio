import { expect } from '@playwright/test'

import type { Page } from '@playwright/test'

const ROOT = '.terminal-root'
const SCROLLER = '.terminal-scroller'
const PROMPT = '.terminal-prompt'
const WHEEL_NOTCH_PIXELS = 120
// Far enough apart to be separate swipes, as a stop at the end of the output needs, and close
// enough together for them to add up to a command.
const WHEEL_NOTCH_MILLISECONDS = 250
const LANDING_LIMIT_MILLISECONDS = 15_000

/** What the terminal publishes about itself on its root. */
export type TerminalState = {
  isBusy: boolean
  scrollTop: number
  /** Where the section on screen starts on the track. Above the step is what is already printed. */
  sectionStart: number
  step: number
  stepEnd: number
  stepStart: number
}

/** Waits until the script has taken over from the plain flow. */
export async function waitForTerminal(page: Page): Promise<void> {
  await page.locator(`${ROOT}[data-engine-ready]`).waitFor({ state: 'attached' })
  await page.evaluate(() => document.fonts.ready)
}

export function readTerminal(page: Page): Promise<TerminalState> {
  return page.evaluate(
    ([rootSelector, scrollerSelector]) => {
      const root = document.querySelector<HTMLElement>(rootSelector)
      const scroller = document.querySelector<HTMLElement>(scrollerSelector)
      if (!root || !scroller) {
        throw new Error('The page has no terminal')
      }
      return {
        isBusy: root.dataset.busy === 'true',
        scrollTop: scroller.scrollTop,
        sectionStart: Number(root.dataset.sectionStart),
        step: Number(root.dataset.currentStep),
        stepEnd: Number(root.dataset.stepEnd),
        stepStart: Number(root.dataset.stepStart),
      }
    },
    [ROOT, SCROLLER],
  )
}

/** Waits for the running command, if any, to finish printing. */
export async function waitUntilIdle(page: Page): Promise<void> {
  await page
    .locator(`${ROOT}:not([data-busy])`)
    .waitFor({ state: 'attached', timeout: LANDING_LIMIT_MILLISECONDS })
}

/** Reads on to the last line of the step on screen, and stops there. */
export async function scrollToTheEndOfTheStep(page: Page): Promise<void> {
  const { stepEnd } = await readTerminal(page)
  await page.locator(SCROLLER).evaluate((scroller, top) => scroller.scrollTo(0, top), stepEnd)
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  )
}

/** Puts the wheel over the output, so that the wheel scrolls it. */
export async function pointAtOutput(page: Page): Promise<void> {
  const viewport = page.viewportSize()
  if (!viewport) {
    throw new Error('The page has no viewport')
  }
  await page.mouse.move(viewport.width / 2, viewport.height / 2)
}

/** Scrolls with the wheel, a notch at a time as a reader does, until a command starts. */
export async function wheelUntilBusy(page: Page, direction: 'down' | 'up'): Promise<void> {
  const notch = direction === 'down' ? WHEEL_NOTCH_PIXELS : -WHEEL_NOTCH_PIXELS
  const deadline = Date.now() + LANDING_LIMIT_MILLISECONDS
  while (!(await readTerminal(page)).isBusy) {
    if (Date.now() > deadline) {
      throw new Error(`Scrolling ${direction} did not start a command`)
    }
    await page.mouse.wheel(0, notch)
    await page.waitForTimeout(WHEEL_NOTCH_MILLISECONDS)
  }
}

/** Skips the rest of a command the way a click does, for checks that are not about its pace. */
export async function fastForward(page: Page): Promise<void> {
  await page.locator(PROMPT).evaluate((prompt: HTMLElement) => prompt.click())
}

/** Scrolls on until a command starts, and skips to the end of it. */
export async function wheelUntilNextCommand(page: Page, direction: 'down' | 'up'): Promise<void> {
  await wheelUntilBusy(page, direction)
  await fastForward(page)
  await waitUntilIdle(page)
}

/** What macOS sends for one swipe: the fingers speed up, lift, and momentum runs down from there. */
export type Swipe = {
  /** How much of its speed the momentum keeps from one frame to the next. */
  decay: number
  /** The fastest it goes, in pixels a frame. */
  peak: number
}

// About 225, 680, 970 and 3,800 points in all, momentum included, over 0.7, 0.7, 1.5 and 3 seconds.
export const GENTLE_SWIPE: Swipe = { decay: 0.93, peak: 14 }
export const QUICK_FLICK: Swipe = { decay: 0.9, peak: 50 }
export const ORDINARY_FLICK: Swipe = { decay: 0.955, peak: 40 }
export const HARD_FLICK: Swipe = { decay: 0.975, peak: 90 }
export const LONGEST_FLICK: Swipe = { decay: 0.985, peak: 120 }

const FRAME_MILLISECONDS = 16
const FINGERS_SPEEDING_UP = [0.15, 0.3, 0.5, 0.7, 0.85, 1]
const MOMENTUM_ENDS_BELOW_PIXELS = 0.8

function buildSwipe({ decay, peak }: Swipe): number[] {
  const deltas = FINGERS_SPEEDING_UP.map((share) => peak * share)
  for (let speed = peak * decay; speed > MOMENTUM_ENDS_BELOW_PIXELS; speed *= decay) {
    deltas.push(speed)
  }
  return deltas
}

/** Plays one swipe with its momentum, a frame at a time, as a trackpad does. */
export async function swipe(page: Page, gesture: Swipe, direction: 'down' | 'up'): Promise<void> {
  const sign = direction === 'down' ? 1 : -1
  const startedAt = Date.now()
  const deltas = buildSwipe(gesture)
  for (const [frame, delta] of deltas.entries()) {
    await page.mouse.wheel(0, sign * delta)
    const wait = startedAt + (frame + 1) * FRAME_MILLISECONDS - Date.now()
    if (wait > 0) {
      await page.waitForTimeout(wait)
    }
  }
}

/**
 * Records each command as it is typed, in full, in the order typed. Read it with
 * `readCommands`. It goes on the page, because a command is on screen for only a moment.
 */
export async function recordCommands(page: Page): Promise<void> {
  await page.evaluate(() => {
    const typed = document.querySelector('.terminal-typed')
    if (!typed) {
      throw new Error('The page has no prompt')
    }
    const commands: string[] = []
    let longestSoFar = ''
    new MutationObserver((records) => {
      // Each record and not the element: fast-forwarded, a command is written and wiped in one go.
      for (const record of records) {
        const text = record.addedNodes[0]?.textContent ?? ''
        if (text === '' && longestSoFar !== '') {
          commands.push(longestSoFar)
          longestSoFar = ''
        } else if (text.length > longestSoFar.length) {
          longestSoFar = text
        }
      }
    }).observe(typed, { characterData: true, childList: true, subtree: true })
    ;(window as unknown as { typedCommands: string[] }).typedCommands = commands
  })
}

export function readCommands(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { typedCommands: string[] }).typedCommands)
}

const SESSION_OUTPUT = '[data-session-output]'
const TYPED = '.terminal-typed'

/** Types a line at the prompt as a visitor does, runs it, and waits for it to print. */
export async function typeCommand(page: Page, line: string): Promise<void> {
  await page.keyboard.type(line)
  await page.keyboard.press('Enter')
  await waitUntilIdle(page)
}

export function readTypedLine(page: Page): Promise<string> {
  return page.locator(TYPED).evaluate((typed) => typed.textContent ?? '')
}

/** What the typed shell has printed, as one string, or null when it has printed nothing. */
export function readSessionOutput(page: Page): Promise<string | null> {
  return page.evaluate(
    (selector) => document.querySelector(selector)?.textContent ?? null,
    SESSION_OUTPUT,
  )
}

/** How the typed shell's output sits on screen at the current scroll position. */
export type SessionOutputView = {
  /** Text rows of the output that the clip cuts through. */
  cutRows: string[]
  /** Text rows of the output shown whole, inside the clip. */
  shownRows: string[]
  /** Rows shown behind the prompt or footer, where nobody can read them. */
  overlappingDock: string[]
}

/** Reads the typed shell's output against the scene's clip, in the page, like `wholeRows.ts` does. */
export function readSessionOutputView(page: Page): Promise<SessionOutputView> {
  return page.evaluate((selector) => {
    const scene = document.querySelector<HTMLElement>('.terminal-scene.is-active')
    const container = scene?.querySelector<HTMLElement>(selector)
    const dock = document.querySelector<HTMLElement>('.terminal-dock')
    if (!scene || !container || !dock) {
      throw new Error('The typed shell has printed nothing on the section on screen')
    }
    const match = /^inset\((-?[\d.]+)px .*calc\(100% - (-?[\d.]+)px\)/.exec(scene.style.clipPath)
    if (!match) {
      throw new Error(`Unreadable clip: "${scene.style.clipPath}"`)
    }
    const topEdge = Number(match[1])
    const bottomEdge = Number(match[2])
    const sceneBox = scene.getBoundingClientRect()
    const dockTop = dock.getBoundingClientRect().top
    const tolerance = 0.5
    const view: SessionOutputView = { cutRows: [], overlappingDock: [], shownRows: [] }
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    while (walker.nextNode()) {
      const node = walker.currentNode
      if (!node.textContent?.trim()) {
        continue
      }
      const range = document.createRange()
      range.selectNodeContents(node)
      for (const rect of range.getClientRects()) {
        const top = rect.top - sceneBox.top
        const bottom = rect.bottom - sceneBox.top
        const text = node.textContent.trim().slice(0, 40)
        const isAbove = bottom <= topEdge + tolerance
        const isBelow = top >= bottomEdge - tolerance
        const isInside = top >= topEdge - tolerance && bottom <= bottomEdge + tolerance
        if (!isAbove && !isBelow && !isInside) {
          view.cutRows.push(text)
        }
        if (isInside) {
          view.shownRows.push(text)
          if (rect.bottom > dockTop + tolerance) {
            view.overlappingDock.push(text)
          }
        }
      }
    }
    return view
  }, SESSION_OUTPUT)
}

/** Switches to the plain flow, the way a visitor does: in the title bar, or on a phone the menu. */
export async function enterPlainView(page: Page): Promise<void> {
  await waitForTerminal(page)
  const titleBarToggle = page.locator('.terminal-plain-toggle')
  if (await titleBarToggle.isVisible()) {
    await titleBarToggle.click()
  } else {
    await page.getByRole('button', { exact: true, name: 'Menu' }).click()
    await page.locator('.terminal-plain-toggle-item').click()
  }
  await expect(page.locator(ROOT)).not.toHaveAttribute('data-engine-ready')
}

/** Opens the menu and chooses an entry by its label. */
export async function chooseFromMenu(page: Page, label: string): Promise<void> {
  await page.getByRole('button', { exact: true, name: 'Menu' }).click()
  await page.getByRole('navigation', { name: 'Menu' }).getByRole('button', { name: label }).click()
}

/** How many pixels of a section's text lie past its right edge, hidden sections included. */
export function readWidestSceneOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    let widest = 0
    for (const scene of document.querySelectorAll<HTMLElement>('[data-scene]')) {
      const hidden = scene.getAttribute('hidden')
      scene.removeAttribute('hidden')
      widest = Math.max(widest, scene.scrollWidth - scene.clientWidth)
      if (hidden !== null) {
        scene.setAttribute('hidden', hidden)
      }
    }
    return widest
  })
}
