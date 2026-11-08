import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  GENERATED_FILES,
  GENERATED_RECORD_PATH,
  hashBytes,
  hashMark,
} from '@/brand/generatedRecord'
import type { GeneratedRecord } from '@/brand/generatedRecord'
import { ACTIVE_MARK, MARKS } from '@/brand/marks'
import { toMarkSvg } from '@/brand/markSvg'

const PROJECT_ROOT = path.resolve(__dirname, '../..')
// Where a PNG's width and height sit: after the 8-byte signature, the IHDR length and type.
const PNG_WIDTH_OFFSET = 16
const PNG_HEIGHT_OFFSET = 20
const ICO_HEADER_BYTES = 6
const ICO_ENTRY_BYTES = 16
const ICO_COUNT_OFFSET = 4

// The sizes the design sets for each file, written out here so a changed size fails by name.
const PNG_SIZES: Record<string, { height: number; width: number }> = {
  [GENERATED_FILES.appleIcon]: { height: 180, width: 180 },
  [GENERATED_FILES.emailMark]: { height: 72, width: 72 },
  [GENERATED_FILES.gitHubPicture]: { height: 1024, width: 1024 },
  [GENERATED_FILES.shareImage]: { height: 630, width: 1200 },
}
const FAVICON_SIZES = [16, 32, 48]

function readProjectFile(relativePath: string): Buffer {
  return readFileSync(path.join(PROJECT_ROOT, relativePath))
}

function readRecord(): GeneratedRecord {
  return JSON.parse(readProjectFile(GENERATED_RECORD_PATH).toString('utf8')) as GeneratedRecord
}

/**
 * The image files are rendered in Chrome by `yarn brand` and committed, so a test cannot make
 * them again. It checks instead that they were made from the mark `ACTIVE_MARK` names, as it is
 * drawn now: switching the mark, or changing its shapes, without running `yarn brand` fails here.
 */
describe('the generated mark files', () => {
  it('were made from the active mark', () => {
    expect(readRecord().mark).toBe(ACTIVE_MARK)
  })

  it('were made from the active mark as it is drawn now', () => {
    expect(readRecord().markHash).toBe(hashMark(MARKS[ACTIVE_MARK]))
  })

  it('are each the file the generator wrote', () => {
    const record = readRecord()
    expect(Object.keys(record.files).sort()).toEqual(Object.values(GENERATED_FILES).sort())
    for (const relativePath of Object.values(GENERATED_FILES)) {
      expect(existsSync(path.join(PROJECT_ROOT, relativePath)), relativePath).toBe(true)
      expect(hashBytes(readProjectFile(relativePath)), relativePath).toBe(
        record.files[relativePath],
      )
    }
  })

  it('include the mark as an SVG with outlined letters, for the README and the share image', () => {
    expect(readProjectFile(GENERATED_FILES.markSvg).toString('utf8')).toBe(
      toMarkSvg(MARKS[ACTIVE_MARK], 'rounded'),
    )
  })

  it.each(Object.entries(PNG_SIZES))('renders %s at its size', (relativePath, size) => {
    const png = readProjectFile(relativePath)
    expect(png.readUInt32BE(PNG_WIDTH_OFFSET)).toBe(size.width)
    expect(png.readUInt32BE(PNG_HEIGHT_OFFSET)).toBe(size.height)
  })

  it('packs the favicon at 16, 32 and 48 pixels', () => {
    const icon = readProjectFile(GENERATED_FILES.favicon)
    const count = icon.readUInt16LE(ICO_COUNT_OFFSET)
    const sizes = Array.from({ length: count }, (_, index) => {
      return icon[ICO_HEADER_BYTES + index * ICO_ENTRY_BYTES]
    })
    expect(sizes).toEqual(FAVICON_SIZES)
  })
})
