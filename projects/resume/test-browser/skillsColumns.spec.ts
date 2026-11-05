import { expect, test } from './browserTest'
import { LAPTOP_VIEWPORT } from './constants'
import {
  chooseFromMenu,
  enterPlainView,
  fastForward,
  pointAtOutput,
  waitForTerminal,
  waitUntilIdle,
} from './terminal'

import type { Page } from '@playwright/test'

const COLUMN = '.terminal-columns > *'
const COLUMN_COUNT = 3
const HOW_MUCH_COUNTS_AS_WHOLE = 0.999

type PrintingSample = {
  /** How much of each column shows, from nothing to all of it. */
  shown: number[]
  /** Whether the listing above the columns has printed in full. */
  hasListingPrinted: boolean
}

type PrintingRecord = {
  /** Lines the edge of a column went through as it printed. */
  cutLines: string[]
  samples: PrintingSample[]
}

/** Reads every frame, from now until the command has printed. Read it with `readPrintingRecord`. */
async function recordPrinting(page: Page): Promise<void> {
  await page.evaluate((columnSelector) => {
    const record: PrintingRecord = { cutLines: [], samples: [] }
    const readBottomEdge = (element: HTMLElement) => {
      const clip = element.style.clipPath
      if (!clip) {
        return Number.POSITIVE_INFINITY
      }
      // A clip with no distance in it is the one that shows nothing yet.
      const match = /calc\(100% - (-?[\d.]+)px\)/.exec(clip)
      return match ? Number(match[1]) : 0
    }
    const sample = () => {
      const scene = document.querySelector<HTMLElement>('[data-scene="skills"]')
      const listing = scene?.querySelector<HTMLElement>('.terminal-listing')
      if (scene && listing && scene.classList.contains('is-active') && scene.style.clipPath) {
        const sceneBox = scene.getBoundingClientRect()
        const sceneEdge = readBottomEdge(scene)
        const shown: number[] = []
        for (const column of scene.querySelectorAll<HTMLElement>(columnSelector)) {
          const box = column.getBoundingClientRect()
          const ownEdge = box.top - sceneBox.top + readBottomEdge(column)
          const edge = Math.min(sceneEdge, ownEdge)
          const height = Math.max(0, Math.min(edge - (box.top - sceneBox.top), box.height))
          shown.push(height / box.height)
          const walker = document.createTreeWalker(column, NodeFilter.SHOW_TEXT)
          while (walker.nextNode()) {
            const range = document.createRange()
            range.selectNodeContents(walker.currentNode)
            for (const line of range.getClientRects()) {
              const top = line.top - sceneBox.top
              const bottom = line.bottom - sceneBox.top
              const tolerance = 0.5
              if (top < edge - tolerance && bottom > edge + tolerance) {
                record.cutLines.push(walker.currentNode.textContent?.trim() ?? '')
              }
            }
          }
        }
        const listingBottom = listing.getBoundingClientRect().bottom - sceneBox.top
        record.samples.push({ hasListingPrinted: listingBottom <= sceneEdge, shown })
      }
      requestAnimationFrame(sample)
    }
    sample()
    ;(window as unknown as { printingRecord: PrintingRecord }).printingRecord = record
  }, COLUMN)
}

function readPrintingRecord(page: Page): Promise<PrintingRecord> {
  return page.evaluate(
    () => (window as unknown as { printingRecord: PrintingRecord }).printingRecord,
  )
}

async function openTerminal(page: Page): Promise<void> {
  await page.goto('/')
  await waitForTerminal(page)
  await pointAtOutput(page)
}

function readColumnClips(page: Page): Promise<string[]> {
  return page
    .locator(COLUMN)
    .evaluateAll((columns) => columns.map((column) => (column as HTMLElement).style.clipPath))
}

// Zack, on the first build: "It looked like it's loading top to bottom. It should type out column 1
// and then 2 then 3."
test.describe('Skills', () => {
  test.use({ viewport: LAPTOP_VIEWPORT })

  test('prints its columns one at a time, each in whole lines', async ({ page }) => {
    await openTerminal(page)
    await recordPrinting(page)

    await chooseFromMenu(page, 'skills/')
    await waitUntilIdle(page)

    const { cutLines, samples } = await readPrintingRecord(page)
    const printing = samples.filter(({ shown }) =>
      shown.some((share) => share < HOW_MUCH_COUNTS_AS_WHOLE),
    )
    // Without seeing each column part way through, the rest would pass and prove nothing.
    expect(printing.length).toBeGreaterThan(0)
    expect(samples[0].shown).toHaveLength(COLUMN_COUNT)
    expect(samples.some(({ hasListingPrinted }) => !hasListingPrinted)).toBe(true)
    for (let column = 0; column < COLUMN_COUNT; column += 1) {
      const partWay = printing.filter(
        ({ shown }) => shown[column] > 0 && shown[column] < HOW_MUCH_COUNTS_AS_WHOLE,
      )
      expect(partWay.length, `column ${column + 1} part way through`).toBeGreaterThan(0)
    }

    for (const { hasListingPrinted, shown } of printing) {
      shown.forEach((share, column) => {
        if (share > 0) {
          expect(hasListingPrinted).toBe(true)
          expect(Math.min(...shown.slice(0, column), 1)).toBeGreaterThanOrEqual(
            HOW_MUCH_COUNTS_AS_WHOLE,
          )
        }
      })
    }
    expect(cutLines).toEqual([])
    expect(await readColumnClips(page)).toEqual(['', '', ''])
  })

  test('a click finishes it at once, with every column showing', async ({ page }) => {
    await openTerminal(page)
    await chooseFromMenu(page, 'skills/')
    // In the printing itself, and not still typing the command.
    await expect.poll(async () => (await readColumnClips(page)).join('')).not.toBe('')

    await fastForward(page)
    await waitUntilIdle(page)

    expect(await readColumnClips(page)).toEqual(['', '', ''])
  })

  test('plain view, part way through, leaves no column half printed', async ({ page }) => {
    await openTerminal(page)
    await chooseFromMenu(page, 'skills/')
    await expect.poll(async () => (await readColumnClips(page)).join('')).not.toBe('')

    await enterPlainView(page)

    expect(await readColumnClips(page)).toEqual(['', '', ''])
  })
})
