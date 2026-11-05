import { expect } from '@playwright/test'

import { SCROLL_PAST_END_TO_TRIGGER_PIXELS } from '@/components/Terminal/constants'

import { chooseFromMenu, fastForward, waitUntilIdle } from './terminal'

import type { Page } from '@playwright/test'

/** The menu entries that land on the first step of each section with text to read. */
const SECTION_MENU_LABELS = [
  'developer.profile',
  'work_experience/',
  'education/',
  'skills/',
  'projects/',
] as const
/** Under the smallest line height on the page, so no row can fall between two checks. */
const DEFAULT_POSITION_STEP_PIXELS = 5

/** Every position of every section takes a long while, on purpose. */
export const WALK_LIMIT_MILLISECONDS = 280_000

type Walk = {
  /** Text rows the clip cut through at some position. */
  cutRows: string[]
  /** Text rows of this step that no position ever showed. */
  neverShown: string[]
  /** Rows shown behind the prompt or footer, where nobody can read them. */
  overlappingDock: string[]
  /** How many positions were checked, so a walk of nothing cannot pass. */
  positions: number
  /** How many rows this step's own card holds, for the same reason. */
  textRows: number
}

/**
 * Walks every scroll position of the step on screen, in the page, and reports every line that
 * the clip cut through, that sat behind the prompt, or that was never reachable at all.
 */
function walkStep(page: Page, positionStep: number): Promise<Walk> {
  return page.evaluate(async (positionStep) => {
    const SETTLE_AFTER_WRAP_MILLISECONDS = 50
    const waitForDraw = async () => {
      // The scroll event arrives on the next frame, and the engine draws in the one after it.
      await new Promise(requestAnimationFrame)
      await new Promise(requestAnimationFrame)
    }
    const root = document.querySelector<HTMLElement>('.terminal-root')
    const scroller = document.querySelector<HTMLElement>('.terminal-scroller')
    const scene = document.querySelector<HTMLElement>('.terminal-scene.is-active')
    const dock = document.querySelector<HTMLElement>('.terminal-dock')
    if (!root || !scroller || !scene || !dock) {
      throw new Error('The terminal is not on the page')
    }
    // The `echo` line can wrap when it finishes typing, which moves rows, so walk what it settles
    // into. Only the pulsing line runs for good, and it holds no text.
    await Promise.all(
      scene
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished),
    )
    await new Promise((resolve) => setTimeout(resolve, SETTLE_AFTER_WRAP_MILLISECONDS))
    await waitForDraw()
    const readTextBoxes = (within: HTMLElement) => {
      const sceneBox = scene.getBoundingClientRect()
      const boxes: { bottom: number; text: string; top: number }[] = []
      const walker = document.createTreeWalker(within, NodeFilter.SHOW_TEXT)
      while (walker.nextNode()) {
        const node = walker.currentNode
        const parent = node.parentElement
        if (
          !node.textContent?.trim() ||
          !parent ||
          parent.closest('.sr-only, dialog, .is-cleared')
        ) {
          continue
        }
        const range = document.createRange()
        range.selectNodeContents(node)
        for (const box of range.getClientRects()) {
          boxes.push({
            bottom: box.bottom - sceneBox.top,
            text: node.textContent.trim().slice(0, 40),
            top: box.top - sceneBox.top,
          })
        }
      }
      return boxes
    }
    const readClip = () => {
      const match = /^inset\((-?[\d.]+)px .*calc\(100% - (-?[\d.]+)px\)/.exec(scene.style.clipPath)
      if (!match) {
        throw new Error(`Unreadable clip: "${scene.style.clipPath}"`)
      }
      return { bottomEdge: Number(match[2]), topEdge: Number(match[1]) }
    }
    const start = Number(root.dataset.stepStart)
    const end = Number(root.dataset.stepEnd)
    const walk: Walk = {
      cutRows: [],
      neverShown: [],
      overlappingDock: [],
      positions: 0,
      textRows: 0,
    }
    const shown = new Set<string>()
    const dockTop = dock.getBoundingClientRect().top
    for (let position = start; position <= end + positionStep; position += positionStep) {
      scroller.scrollTop = Math.min(position, end)
      await waitForDraw()
      walk.positions += 1
      const sceneTop = scene.getBoundingClientRect().top
      const { bottomEdge, topEdge } = readClip()
      const tolerance = 0.5
      for (const box of readTextBoxes(scene)) {
        const isAbove = box.bottom <= topEdge + tolerance
        const isBelow = box.top >= bottomEdge - tolerance
        const isInside = box.top >= topEdge - tolerance && box.bottom <= bottomEdge + tolerance
        if (!isAbove && !isBelow && !isInside) {
          walk.cutRows.push(`${box.text} at ${position}`)
        }
        if (isInside) {
          shown.add(`${box.text}@${Math.round(box.top)}`)
          if (sceneTop + box.bottom > dockTop + tolerance) {
            walk.overlappingDock.push(`${box.text} at ${position}`)
          }
        }
      }
    }
    // This step's own card, the last one reached. Earlier cards had their turn in their own step.
    const ownBlock = [...scene.querySelectorAll<HTMLElement>('[data-block]:not(.is-cleared)')].at(
      -1,
    )
    if (!ownBlock) {
      throw new Error('The section on screen shows no block')
    }
    walk.textRows = readTextBoxes(ownBlock).length
    for (const box of readTextBoxes(ownBlock)) {
      if (!shown.has(`${box.text}@${Math.round(box.top)}`)) {
        walk.neverShown.push(box.text)
      }
    }
    return walk
  }, positionStep)
}

/** Walks every step of a section by scrolling on, as far as the section goes. */
async function walkSection(page: Page, label: string, positionStep: number): Promise<void> {
  await chooseFromMenu(page, label)
  await waitUntilIdle(page)
  const readSection = () =>
    page
      .locator('.terminal-scene.is-active')
      .evaluate((scene) => (scene as HTMLElement).dataset.scene)
  const readStep = () => page.locator('.terminal-root').getAttribute('data-current-step')
  const sectionId = await readSection()

  for (;;) {
    const walk = await walkStep(page, positionStep)
    expect.soft(walk.positions, `${label}: positions`).toBeGreaterThan(0)
    expect.soft(walk.textRows, `${label}: rows in the card`).toBeGreaterThan(0)
    expect.soft(walk.cutRows, `${label}: rows cut through`).toEqual([])
    expect.soft(walk.overlappingDock, `${label}: rows behind the prompt`).toEqual([])
    expect.soft(walk.neverShown, `${label}: rows never shown`).toEqual([])

    // Scroll on to the next card, or stop at the end of the section or the site.
    const stepBefore = await readStep()
    await page.evaluate((pastTheEnd) => {
      const root = document.querySelector<HTMLElement>('.terminal-root')
      const scroller = document.querySelector<HTMLElement>('.terminal-scroller')
      if (root && scroller) {
        scroller.scrollTop = Number(root.dataset.stepEnd) + pastTheEnd
      }
    }, SCROLL_PAST_END_TO_TRIGGER_PIXELS + 1)
    await page.waitForTimeout(100)
    await fastForward(page)
    await waitUntilIdle(page)
    // The end of Skills runs the download and opens the resume window. Close it to go on.
    if (await page.locator('dialog[open]').count()) {
      await page.keyboard.press('Escape')
      await waitUntilIdle(page)
      return
    }
    if ((await readStep()) === stepBefore || (await readSection()) !== sectionId) {
      return
    }
  }
}

/** Reads the whole site, section by section, from the menu. */
export async function walkEverySection(
  page: Page,
  positionStep = DEFAULT_POSITION_STEP_PIXELS,
): Promise<void> {
  for (const label of SECTION_MENU_LABELS) {
    await walkSection(page, label, positionStep)
    await waitUntilIdle(page)
  }
}
