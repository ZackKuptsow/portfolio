import { readFileSync } from 'node:fs'
import path from 'node:path'

import { encodeQR } from 'qr'
import { decodeQR } from 'qr/decode.js'
import { describe, expect, it } from 'vitest'

import {
  QR_CODE_ADDRESS,
  QR_CODE_SIZE_PIXELS,
} from '@/components/GetResume/components/QrCodeOption/constants'

import { drawQrCodeArtwork } from './drawQrCodeArtwork'
import { rasterizeQrCodeArtwork, readSquaresFromBitmap } from './rasterizeQrCodeArtwork'

const ARTWORK_FILE = path.resolve(
  __dirname,
  '../../../../../components/GetResume/components/QrCodeOption/qrCodeArtwork.json',
)
const JSON_INDENT = 2
// What a phone must open. A literal, so a changed PDF path or site address fails here by
// name. test/components/GetResume/resumePdf.test.ts checks that a file ships at that path.
const RESUME_PDF_ADDRESS = 'https://kups.me/Zachary_Kuptsow_Resume.pdf'
// What a scannable drawing must have, written out here and not imported from the helper
// that draws it: the helper is what has to meet them.
const REQUIRED_ERROR_CORRECTION = 'medium'
const REQUIRED_QUIET_ZONE_UNITS = 4

/**
 * The checks below read this fresh drawing, not the committed file. Vitest writes a file
 * snapshot only after the whole file has run, so a test that read the file would see the
 * old drawing during the very run that redraws it. The first test ties the two together.
 */
describe('QR code artwork', () => {
  const artwork = drawQrCodeArtwork(QR_CODE_ADDRESS)

  it('is the committed drawing, and running this file with -u redraws it', async () => {
    // A wrong path would make the snapshot write a new file there and pass, with the real
    // drawing never compared. The component that imports the drawing sits beside it, so
    // its source pins both the folder and the file name.
    const component = readFileSync(
      path.join(path.dirname(ARTWORK_FILE), 'QrCodeOption.tsx'),
      'utf8',
    )
    expect(component).toContain(`from './${path.basename(ARTWORK_FILE)}'`)

    const committedForm = `${JSON.stringify(artwork, null, JSON_INDENT)}\n`

    await expect(committedForm).toMatchFileSnapshot(ARTWORK_FILE)
  })

  it('is drawn for the address of the resume PDF on the live site', () => {
    expect(QR_CODE_ADDRESS).toBe(RESUME_PDF_ADDRESS)
  })

  it('decodes to the address of the resume PDF', () => {
    expect(decodeQR(rasterizeQrCodeArtwork(artwork))).toBe(RESUME_PDF_ADDRESS)
  })

  // With -u the first test cannot fail, and a decoder forgives a shifted, thinned or
  // inverted drawing that a phone camera might not. This one compares square by square.
  it('draws exactly the squares of the code, inside a quiet zone four squares wide', () => {
    const squares = encodeQR(RESUME_PDF_ADDRESS, 'raw', {
      border: REQUIRED_QUIET_ZONE_UNITS,
      ecc: REQUIRED_ERROR_CORRECTION,
    })
    const drawnSquares = readSquaresFromBitmap(
      rasterizeQrCodeArtwork(artwork),
      artwork.unitsPerSide,
    )

    expect(artwork.unitsPerSide).toBe(squares.length)
    expect(drawnSquares).toEqual(squares)
  })

  // The dialog test checks that the code is shown at this size.
  it('has a size that gives every square a whole number of CSS pixels', () => {
    expect(QR_CODE_SIZE_PIXELS % artwork.unitsPerSide).toBe(0)
  })
})
