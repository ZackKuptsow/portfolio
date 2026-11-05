import {
  GESTURE_QUIET_MILLISECONDS,
  TYPING_TOTAL_MILLISECONDS,
} from '@/components/Terminal/constants'

import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'
import {
  chooseFromMenu,
  pointAtOutput,
  readCommands,
  readTerminal,
  recordCommands,
  swipe,
  waitForTerminal,
  waitUntilIdle,
} from './terminal'

import type { Swipe } from './terminal'
import type { Page } from '@playwright/test'

// About 225, 680, 970 and 3,800 points in all, momentum included, over 0.7, 0.7, 1.5 and 3 seconds.
const GENTLE_SWIPE: Swipe = { decay: 0.93, peak: 14 }
const QUICK_FLICK: Swipe = { decay: 0.9, peak: 50 }
const ORDINARY_FLICK: Swipe = { decay: 0.955, peak: 40 }
const HARD_FLICK: Swipe = { decay: 0.975, peak: 90 }
const LONGEST_FLICK: Swipe = { decay: 0.985, peak: 120 }

/** Long enough for anything a swipe set off to have started. */
const SETTLE_MILLISECONDS = 500
/** Longer than a swipe's pull is remembered, in `constants.ts`. */
const FORGOTTEN_AFTER_MILLISECONDS = 1_000
const MARGIN_MILLISECONDS = 50
/** `FIRST_COMMAND` takes over 3.2 seconds to type and print, and 2 when a second flick cuts it short. */
const COMMAND_LEFT_ALONE_SHORTEST_MILLISECONDS = 3_000
// A key held for about 2 seconds, at the rate keyboards repeat, which runs well past the card.
const HELD_KEY_REPEATS = 60
const HELD_KEY_REPEAT_MILLISECONDS = 33

const FIRST_COMMAND = 'clear && cat developer.profile'

async function openTerminal(page: Page): Promise<void> {
  await page.goto('/')
  await waitForTerminal(page)
  await pointAtOutput(page)
  await recordCommands(page)
}

async function settle(page: Page): Promise<void> {
  await page.waitForTimeout(SETTLE_MILLISECONDS)
  await waitUntilIdle(page)
}

/** How long each command has kept the terminal busy, read off the page as it runs. */
async function recordBusyTimes(page: Page): Promise<void> {
  await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('.terminal-root')
    if (!root) {
      throw new Error('The page has no terminal')
    }
    const busyTimes: number[] = []
    let busySince: number | null = null
    new MutationObserver(() => {
      if (root.dataset.busy && busySince === null) {
        busySince = performance.now()
      } else if (!root.dataset.busy && busySince !== null) {
        busyTimes.push(performance.now() - busySince)
        busySince = null
      }
    }).observe(root, { attributeFilter: ['data-busy'], attributes: true })
    ;(window as unknown as { busyTimes: number[] }).busyTimes = busyTimes
  })
}

function readBusyTimes(page: Page): Promise<number[]> {
  return page.evaluate(() => (window as unknown as { busyTimes: number[] }).busyTimes)
}

// Zack, trying the first build on his Mac: "It's spazzing out." macOS goes on sending wheel events
// for seconds after the fingers lift, and each of these read them as the reader scrolling on. Before
// this, one ordinary flick skipped About, and one hard one ran five commands into the download.
test.describe('one swipe does one thing', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  for (const [label, gesture] of [
    ['an ordinary flick', ORDINARY_FLICK],
    ['the hardest flick', HARD_FLICK],
  ] as const) {
    test(`${label} types one command in full, at its own pace, and lands on the next step`, async ({
      page,
    }) => {
      await openTerminal(page)
      await recordBusyTimes(page)

      await swipe(page, gesture, 'down')
      await settle(page)

      expect(await readCommands(page)).toEqual([FIRST_COMMAND])
      expect((await readTerminal(page)).step).toBe(1)
      const busyTimes = await readBusyTimes(page)
      expect(busyTimes).toHaveLength(1)
      expect(busyTimes[0]).toBeGreaterThan(TYPING_TOTAL_MILLISECONDS)
    })
  }

  test('a hard flick up goes back one step, and no further', async ({ page }) => {
    await openTerminal(page)
    await chooseFromMenu(page, 'skills/')
    await waitUntilIdle(page)
    const { step } = await readTerminal(page)

    await swipe(page, HARD_FLICK, 'up')
    await settle(page)

    expect((await readTerminal(page)).step).toBe(step - 1)
  })

  test('a flick up on the first screen types exit once', async ({ page }) => {
    await openTerminal(page)

    // The command is short, so this has to go on long after it, with plenty left to type it again.
    await swipe(page, LONGEST_FLICK, 'up')
    await settle(page)

    expect(await readCommands(page)).toEqual(['exit'])
  })

  test('a second flick finishes the command that is running, and goes no further', async ({
    page,
  }) => {
    await openTerminal(page)
    await recordBusyTimes(page)
    await swipe(page, QUICK_FLICK, 'down')
    expect((await readTerminal(page)).isBusy).toBe(true)
    // The first flick has run out, so this one is the reader asking to hurry.
    await page.waitForTimeout(GESTURE_QUIET_MILLISECONDS + MARGIN_MILLISECONDS)

    await swipe(page, ORDINARY_FLICK, 'down')
    await settle(page)

    expect(await readCommands(page)).toEqual([FIRST_COMMAND])
    expect((await readTerminal(page)).step).toBe(1)
    const [busyFor] = await readBusyTimes(page)
    expect(busyFor).toBeLessThan(COMMAND_LEFT_ALONE_SHORTEST_MILLISECONDS)
  })

  test('the next flick, after the last has finished, moves on one more', async ({ page }) => {
    await openTerminal(page)
    await swipe(page, ORDINARY_FLICK, 'down')
    await settle(page)

    await swipe(page, ORDINARY_FLICK, 'down')
    await settle(page)

    expect(await readCommands(page)).toEqual([FIRST_COMMAND, 'clear && cd ./work_experience && ls'])
  })
})

test.describe('a key held down', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  test('starts one command, and does not hurry it', async ({ page }) => {
    await openTerminal(page)
    await recordBusyTimes(page)
    await page.locator('.terminal-scroller').focus()

    for (let repeats = 0; repeats < HELD_KEY_REPEATS; repeats += 1) {
      await page.keyboard.down('ArrowDown')
      await page.waitForTimeout(HELD_KEY_REPEAT_MILLISECONDS)
    }
    await page.keyboard.up('ArrowDown')
    await settle(page)

    expect(await readCommands(page)).toEqual([FIRST_COMMAND])
    expect((await readTerminal(page)).step).toBe(1)
    const [busyFor] = await readBusyTimes(page)
    expect(busyFor).toBeGreaterThan(COMMAND_LEFT_ALONE_SHORTEST_MILLISECONDS)
  })
})

test.describe('a swipe that does not mean to leave', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  test('a gentle swipe types nothing', async ({ page }) => {
    await openTerminal(page)

    await swipe(page, GENTLE_SWIPE, 'down')
    await page.waitForTimeout(SETTLE_MILLISECONDS)

    expect(await readCommands(page)).toEqual([])
  })

  test('gentle swipes a while apart never add up to a command', async ({ page }) => {
    await openTerminal(page)

    for (let swipes = 0; swipes < 3; swipes += 1) {
      await swipe(page, GENTLE_SWIPE, 'down')
      await page.waitForTimeout(FORGOTTEN_AFTER_MILLISECONDS)
    }

    expect(await readCommands(page)).toEqual([])
  })

  test('a gentle swipe up on the first screen does not type exit', async ({ page }) => {
    await openTerminal(page)

    await swipe(page, GENTLE_SWIPE, 'up')
    await page.waitForTimeout(SETTLE_MILLISECONDS)

    expect(await readCommands(page)).toEqual([])
  })
})

test.describe('long output', () => {
  // On a phone a card runs well past the screen, so it has an end to stop at.
  test.use({ viewport: PHONE_VIEWPORT })

  async function openLongOutput(page: Page): Promise<void> {
    await openTerminal(page)
    await chooseFromMenu(page, 'work_experience/')
    await waitUntilIdle(page)
    const { stepEnd, stepStart } = await readTerminal(page)
    // Without output longer than the screen, these would pass and prove nothing.
    expect(stepEnd).toBeGreaterThan(stepStart)
  }

  test('a flick stops on its last line, and only the next one goes on', async ({ page }) => {
    await openLongOutput(page)
    const before = await readTerminal(page)
    const commandsBefore = (await readCommands(page)).length

    await swipe(page, HARD_FLICK, 'down')
    await page.waitForTimeout(SETTLE_MILLISECONDS)

    const atTheEnd = await readTerminal(page)
    expect(atTheEnd.step).toBe(before.step)
    expect(atTheEnd.scrollTop).toBeCloseTo(atTheEnd.stepEnd, 0)
    expect(await readCommands(page)).toHaveLength(commandsBefore)

    await swipe(page, ORDINARY_FLICK, 'down')
    await settle(page)

    expect(await readCommands(page)).toHaveLength(commandsBefore + 1)
    expect((await readTerminal(page)).step).toBe(before.step + 1)
  })

  test('a key held down stops on its last line too, and hurries nothing', async ({ page }) => {
    await openLongOutput(page)
    const before = await readTerminal(page)
    const commandsBefore = (await readCommands(page)).length
    await page.locator('.terminal-scroller').focus()

    for (let repeats = 0; repeats < HELD_KEY_REPEATS; repeats += 1) {
      await page.keyboard.down('ArrowDown')
      await page.waitForTimeout(HELD_KEY_REPEAT_MILLISECONDS)
    }

    const atTheEnd = await readTerminal(page)
    expect(atTheEnd.step).toBe(before.step)
    expect(atTheEnd.scrollTop).toBeCloseTo(atTheEnd.stepEnd, 0)
    expect(await readCommands(page)).toHaveLength(commandsBefore)
    await page.keyboard.up('ArrowDown')
  })
})
