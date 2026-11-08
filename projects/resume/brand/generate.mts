/**
 * Makes every image file that shows the mark from `ACTIVE_MARK`, and records what it made them
 * from, which `test/brand/generatedFiles.test.ts` checks. Run it from `projects/resume` after
 * changing the mark:
 *
 *     yarn brand
 *
 * It renders in the installed Chrome through Playwright, like the browser checks, and needs no
 * network: the share image loads the committed JetBrains Mono. It stops rather than save a share
 * image drawn in a fallback font or missing the mark.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { chromium } from '@playwright/test'

import { GENERATED_FILES, GENERATED_RECORD_PATH, hashBytes, hashMark } from './generatedRecord.ts'
import { packIco } from './icoFile.ts'
import { ACTIVE_MARK, MARKS } from './marks.ts'
import { toMarkSvg } from './markSvg.ts'

import type { GeneratedRecord } from './generatedRecord.ts'
import type { Browser } from '@playwright/test'

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..')
const SHARE_IMAGE_SOURCE = 'share-image/opengraph-image.html'
const SHARE_IMAGE_SIZE = { height: 630, width: 1200 }
const SHARE_IMAGE_FONT_FAMILY = 'JetBrains Mono'
const FAVICON_SIZES = [16, 32, 48]
const APPLE_ICON_PIXELS = 180
const EMAIL_MARK_PIXELS = 72
const GITHUB_PICTURE_PIXELS = 1024
const JSON_INDENT = 2

function projectPath(relativePath: string): string {
  return path.join(PROJECT_ROOT, relativePath)
}

/**
 * The SVG at an exact pixel size, as a PNG, with transparent corners kept transparent. Each
 * render gets a fresh page made at that size: resizing one page between renders let a screenshot
 * run before the new size applied, and the 180 pixel icon came out as two stitched, cut-off tiles.
 */
async function renderSvg(browser: Browser, svg: string, pixels: number): Promise<Uint8Array> {
  const page = await browser.newPage({
    deviceScaleFactor: 1,
    viewport: { height: pixels, width: pixels },
  })
  try {
    const sized = svg.replace('<svg ', `<svg width="${pixels}" height="${pixels}" `)
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:transparent"><div style="display:flex">${sized}</div></body></html>`,
    )
    return await page.screenshot({
      clip: { height: pixels, width: pixels, x: 0, y: 0 },
      omitBackground: true,
    })
  } finally {
    await page.close()
  }
}

async function renderShareImage(browser: Browser): Promise<Uint8Array> {
  const page = await browser.newPage({ deviceScaleFactor: 1, viewport: SHARE_IMAGE_SIZE })
  try {
    await page.goto(pathToFileURL(projectPath(SHARE_IMAGE_SOURCE)).href, { waitUntil: 'load' })
    // Not document.fonts.check(): it says yes for a family with no face at all, so it passed with
    // the font blocked. A face of that family has to have loaded, and the mark's image too.
    const inputs = await page.evaluate(async (family) => {
      await document.fonts.ready
      const faces = [...document.fonts].filter(
        (face) => face.family.replace(/^["']|["']$/g, '') === family,
      )
      const mark = document.querySelector('img.mark')
      return {
        fontLoaded: faces.some((face) => face.status === 'loaded'),
        markLoaded: mark instanceof HTMLImageElement && mark.complete && mark.naturalWidth > 0,
      }
    }, SHARE_IMAGE_FONT_FAMILY)
    if (!inputs.fontLoaded) {
      throw new Error(
        `${SHARE_IMAGE_FONT_FAMILY} did not load for the share image, so it would be drawn in a fallback font. Check its @font-face in ${SHARE_IMAGE_SOURCE}.`,
      )
    }
    if (!inputs.markLoaded) {
      throw new Error(
        `The mark did not load in ${SHARE_IMAGE_SOURCE}, so the share image would have none. Check its <img> path.`,
      )
    }
    return await page.screenshot({ clip: { ...SHARE_IMAGE_SIZE, x: 0, y: 0 } })
  } finally {
    await page.close()
  }
}

function writeProjectFile(relativePath: string, contents: Uint8Array | string): void {
  writeFileSync(projectPath(relativePath), contents)
}

async function main(): Promise<void> {
  const mark = MARKS[ACTIVE_MARK]
  const roundedSvg = toMarkSvg(mark, 'rounded')
  const squareSvg = toMarkSvg(mark, 'square')
  writeProjectFile(GENERATED_FILES.markSvg, roundedSvg)

  const browser = await chromium.launch({ channel: 'chrome' })
  try {
    const faviconImages = []
    for (const pixels of FAVICON_SIZES) {
      faviconImages.push({ pixels, png: await renderSvg(browser, roundedSvg, pixels) })
    }
    writeProjectFile(GENERATED_FILES.favicon, packIco(faviconImages))
    writeProjectFile(
      GENERATED_FILES.appleIcon,
      await renderSvg(browser, squareSvg, APPLE_ICON_PIXELS),
    )
    writeProjectFile(
      GENERATED_FILES.gitHubPicture,
      await renderSvg(browser, squareSvg, GITHUB_PICTURE_PIXELS),
    )
    writeProjectFile(
      GENERATED_FILES.emailMark,
      await renderSvg(browser, roundedSvg, EMAIL_MARK_PIXELS),
    )
    writeProjectFile(GENERATED_FILES.shareImage, await renderShareImage(browser))
  } finally {
    await browser.close()
  }

  const record: GeneratedRecord = {
    files: Object.fromEntries(
      Object.values(GENERATED_FILES).map((relativePath) => [
        relativePath,
        hashBytes(readFileSync(projectPath(relativePath))),
      ]),
    ),
    mark: ACTIVE_MARK,
    markHash: hashMark(mark),
  }
  writeProjectFile(GENERATED_RECORD_PATH, `${JSON.stringify(record, null, JSON_INDENT)}\n`)
  console.log(`Made ${Object.keys(record.files).length} files from ${ACTIVE_MARK}.`)
}

await main()
