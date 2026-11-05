import { SCROLL_NOISE_PIXELS } from '@/components/Terminal/constants'
import { workExperience } from '@/data/profile'
import { projects } from '@/data/projects'

import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT, PHONE_VIEWPORT } from './constants'
import {
  HARD_FLICK,
  ORDINARY_FLICK,
  chooseFromMenu,
  fastForward,
  pointAtOutput,
  readCommands,
  readTerminal,
  recordCommands,
  swipe,
  waitForTerminal,
  waitUntilIdle,
  wheelUntilNextCommand,
} from './terminal'

import type { Page } from '@playwright/test'

const SETTLE_MILLISECONDS = 500
const LAST_WORK_CARD = workExperience.length - 1
const LAST_PROJECT_CARD = projects.length - 1
const LAST_PROJECT_BLOCK = `[data-block="projects-${LAST_PROJECT_CARD}"]`
const FIRST_PROJECT_LINK = '[data-block="projects-0"] a'
const ANY_PROJECT_LINK = '[data-scene="projects"] [data-block] a'
/** Part of a line, so the link is on the track and still cannot be read. */
const BEHIND_THE_PROMPT_PIXELS = 10
/** A swipe has to carry the output at least this far to prove it moved at all. */
const SHORTEST_MOVE_PIXELS = 100
const ROTATED_PHONE = { height: PHONE_VIEWPORT.width, width: PHONE_VIEWPORT.height }

/** Opens a section and reads on through a number of its cards, so there is output above. */
async function openCard(page: Page, menuLabel: string, cardsDown: number): Promise<void> {
  await page.goto('/')
  await waitForTerminal(page)
  await pointAtOutput(page)
  await chooseFromMenu(page, menuLabel)
  await fastForward(page)
  await waitUntilIdle(page)
  for (let card = 0; card < cardsDown; card += 1) {
    await wheelUntilNextCommand(page, 'down')
  }
  const { sectionStart, stepStart } = await readTerminal(page)
  // Without printed output above the card, these would pass and prove nothing.
  expect(stepStart).toBeGreaterThan(sectionStart)
  await recordCommands(page)
  await recordBusyStarts(page)
}

async function recordBusyStarts(page: Page): Promise<void> {
  await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('.terminal-root')
    if (!root) {
      throw new Error('The page has no terminal')
    }
    const counts = { busyStarts: 0 }
    new MutationObserver(() => {
      if (root.dataset.busy) {
        counts.busyStarts += 1
      }
    }).observe(root, { attributeFilter: ['data-busy'], attributes: true })
    ;(window as unknown as { commandCounts: typeof counts }).commandCounts = counts
  })
}

function readBusyStarts(page: Page): Promise<number> {
  return page.evaluate(
    () => (window as unknown as { commandCounts: { busyStarts: number } }).commandCounts.busyStarts,
  )
}

/** How far up the output has been moved, read from the section on screen. */
function readOutputOffset(page: Page): Promise<number> {
  return page.locator('.terminal-scene.is-active').evaluate((scene: HTMLElement) => {
    const match = /translate3d\(0px, (-?[\d.]+)px/.exec(scene.style.transform)
    if (!match) {
      throw new Error(`Unreadable transform: "${scene.style.transform}"`)
    }
    return Math.abs(Number(match[1]))
  })
}

// Zack, on the first build: "When scrolling up if the entry is already present it shouldn't have
// to redraw the whole page." Going up used to type `cat` and reprint the screen, 3.6 seconds to see
// what was just there, and to hide the card below it, which no terminal's `cat` does.
for (const [screen, viewport] of [
  ['a laptop', LAPTOP_VIEWPORT],
  ['a phone', PHONE_VIEWPORT],
] as const) {
  test.describe(`going back through what is printed, on ${screen}`, () => {
    test.use({ viewport })

    test('is a plain scroll: no command, nothing printed again, and the cards all stay', async ({
      page,
    }) => {
      await openCard(page, 'work_experience/', LAST_WORK_CARD)
      const before = await readTerminal(page)
      const offsetBefore = await readOutputOffset(page)

      await swipe(page, ORDINARY_FLICK, 'up')
      await page.waitForTimeout(SETTLE_MILLISECONDS)

      const after = await readTerminal(page)
      expect(await readCommands(page)).toEqual([])
      expect(await readBusyStarts(page)).toBe(0)
      expect(after.step).toBe(before.step)
      expect(before.scrollTop - after.scrollTop).toBeGreaterThan(SHORTEST_MOVE_PIXELS)
      // 1:1, with no jump in it.
      expect(offsetBefore - (await readOutputOffset(page))).toBeCloseTo(
        before.scrollTop - after.scrollTop,
        0,
      )
      await expect(page.locator('[data-scene="work"] .is-cleared')).toHaveCount(0)
    })

    test('a flick stops at the top of the section, and only the next one leaves it', async ({
      page,
    }) => {
      await openCard(page, 'work_experience/', LAST_WORK_CARD)

      await swipe(page, HARD_FLICK, 'up')
      await page.waitForTimeout(SETTLE_MILLISECONDS)

      const atTheTop = await readTerminal(page)
      expect(Math.abs(atTheTop.scrollTop - atTheTop.sectionStart)).toBeLessThanOrEqual(
        SCROLL_NOISE_PIXELS,
      )
      expect(await readOutputOffset(page)).toBe(0)
      expect(await readCommands(page)).toEqual([])

      await swipe(page, ORDINARY_FLICK, 'up')
      await page.waitForTimeout(SETTLE_MILLISECONDS)
      await waitUntilIdle(page)

      expect(await readCommands(page)).toEqual(['cd .. && cat developer.profile'])
      await expect(page.locator('[data-scene="about"]')).toBeVisible()
    })

    test('coming back down types nothing until past the last line, then the next card', async ({
      page,
    }) => {
      await openCard(page, 'work_experience/', 1)
      await swipe(page, ORDINARY_FLICK, 'up')
      await page.waitForTimeout(SETTLE_MILLISECONDS)

      await swipe(page, HARD_FLICK, 'down')
      await page.waitForTimeout(SETTLE_MILLISECONDS)

      const atTheEnd = await readTerminal(page)
      expect(Math.abs(atTheEnd.scrollTop - atTheEnd.stepEnd)).toBeLessThanOrEqual(
        SCROLL_NOISE_PIXELS,
      )
      expect(await readCommands(page)).toEqual([])

      await swipe(page, ORDINARY_FLICK, 'down')
      await page.waitForTimeout(SETTLE_MILLISECONDS)
      await waitUntilIdle(page)

      expect(await readCommands(page)).toEqual(['cat teampay.txt'])
    })
  })
}

test.describe('going back through what is printed', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  test('arriving from the section below, every card of that section is there to go back to', async ({
    page,
  }) => {
    await openCard(page, 'work_experience/', LAST_WORK_CARD)
    await wheelUntilNextCommand(page, 'down')
    await expect(page.locator('[data-scene="education"]')).toBeVisible()
    await wheelUntilNextCommand(page, 'up')
    expect((await readCommands(page)).at(-1)).toBe('cd .. && cat work_experience/qlik.txt')
    const landed = await readTerminal(page)
    const commandsWhenLanded = (await readCommands(page)).length

    await swipe(page, ORDINARY_FLICK, 'up')
    await page.waitForTimeout(SETTLE_MILLISECONDS)

    expect((await readCommands(page)).length).toBe(commandsWhenLanded)
    expect((await readTerminal(page)).scrollTop).toBeLessThan(landed.scrollTop)
    await expect(page.locator('[data-scene="work"] .is-cleared')).toHaveCount(0)
  })

  test('a link reached by keyboard in an earlier card comes on screen, and the card below stays', async ({
    page,
  }) => {
    await openCard(page, 'projects/', LAST_PROJECT_CARD)
    const before = await readTerminal(page)
    const link = page.locator(FIRST_PROJECT_LINK).first()

    await link.focus()

    const { dockTop, linkBottom, linkTop, titleBottom } = await link.evaluate((element) => {
      const box = element.getBoundingClientRect()
      return {
        dockTop: document.querySelector('.terminal-dock')?.getBoundingClientRect().top ?? 0,
        linkBottom: box.bottom,
        linkTop: box.top,
        titleBottom:
          document.querySelector('.terminal-title-bar')?.getBoundingClientRect().bottom ?? 0,
      }
    })
    expect(linkTop).toBeGreaterThanOrEqual(titleBottom)
    expect(linkBottom).toBeLessThanOrEqual(dockTop)
    expect((await readTerminal(page)).step).toBe(before.step)
    await expect(page.locator(LAST_PROJECT_BLOCK)).not.toHaveClass(/is-cleared/)
  })
})

test.describe('a link reached by keyboard', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  // A browser brings a focused link on screen by itself, except behind the prompt, which it takes
  // for part of the screen. So this is the case the engine has to answer for.
  test('comes out from behind the prompt, and the step stays', async ({ page }) => {
    await openCard(page, 'projects/', LAST_PROJECT_CARD)
    const before = await readTerminal(page)
    // The last link there is, since the first can never sit that low: the output stops at its top.
    const link = page.locator(ANY_PROJECT_LINK).last()
    const readLinkBelowDock = () =>
      link.evaluate((element) => {
        const dockTop = document.querySelector('.terminal-dock')?.getBoundingClientRect().top ?? 0
        return element.getBoundingClientRect().bottom - dockTop
      })
    await link.evaluate((element, pixelsBehindPrompt) => {
      const scroller = document.querySelector('.terminal-scroller')
      const dockTop = document.querySelector('.terminal-dock')?.getBoundingClientRect().top ?? 0
      if (scroller) {
        scroller.scrollTop += element.getBoundingClientRect().bottom - dockTop - pixelsBehindPrompt
      }
    }, BEHIND_THE_PROMPT_PIXELS)
    await expect.poll(readLinkBelowDock).toBe(BEHIND_THE_PROMPT_PIXELS)

    await link.focus()

    await expect.poll(readLinkBelowDock).toBeLessThanOrEqual(0)
    expect((await readTerminal(page)).step).toBe(before.step)
  })
})

test.describe('a re-measure while going back through what is printed', () => {
  test.use({ viewport: PHONE_VIEWPORT })

  test('rotating keeps the reader in what is printed, on the same step', async ({ page }) => {
    await openCard(page, 'work_experience/', LAST_WORK_CARD)
    const before = await readTerminal(page)
    const partWayBack = before.sectionStart + (before.stepStart - before.sectionStart) / 2
    await page.locator('.terminal-scroller').evaluate((scroller, top) => {
      scroller.scrollTo(0, top)
    }, partWayBack)

    await page.setViewportSize(ROTATED_PHONE)

    await expect.poll(async () => (await readTerminal(page)).stepEnd).not.toBe(before.stepEnd)
    const after = await readTerminal(page)
    expect(after.step).toBe(before.step)
    const shareOfWayBack =
      (after.scrollTop - after.sectionStart) / (after.stepStart - after.sectionStart)
    expect(shareOfWayBack).toBeGreaterThan(0.4)
    expect(shareOfWayBack).toBeLessThan(0.6)
    await expect(page.locator('[data-scene="work"] .is-cleared')).toHaveCount(0)
  })
})
