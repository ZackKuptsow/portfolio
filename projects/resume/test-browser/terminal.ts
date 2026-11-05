import { expect } from '@playwright/test'

import type { Page } from '@playwright/test'

const ROOT = '.terminal-root'
const SCROLLER = '.terminal-scroller'
// Past the distance that triggers a command, which is 90 points, and short of a jump.
const WHEEL_NOTCH_PIXELS = 120
const WHEEL_NOTCH_MILLISECONDS = 30
const LANDING_LIMIT_MILLISECONDS = 15_000

/** What the terminal publishes about itself on its root. */
export type TerminalState = {
  isBusy: boolean
  scrollTop: number
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

/** Scrolls with the wheel, as a reader does, until a command starts and has finished. */
export async function wheelUntilNextCommand(page: Page, direction: 'down' | 'up'): Promise<void> {
  const notch = direction === 'down' ? WHEEL_NOTCH_PIXELS : -WHEEL_NOTCH_PIXELS
  await expect(async () => {
    await page.mouse.wheel(0, notch)
    await page.waitForTimeout(WHEEL_NOTCH_MILLISECONDS)
    expect((await readTerminal(page)).isBusy).toBe(true)
  }).toPass({ timeout: LANDING_LIMIT_MILLISECONDS })
  await waitUntilIdle(page)
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
    new MutationObserver(() => {
      const text = typed.textContent ?? ''
      if (text === '' && longestSoFar !== '') {
        commands.push(longestSoFar)
        longestSoFar = ''
      } else if (text.length > longestSoFar.length) {
        longestSoFar = text
      }
    }).observe(typed, { characterData: true, childList: true, subtree: true })
    ;(window as unknown as { typedCommands: string[] }).typedCommands = commands
  })
}

export function readCommands(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { typedCommands: string[] }).typedCommands)
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
