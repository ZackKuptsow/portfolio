import path from 'node:path'

import { decodeQR } from 'qr/decode.js'
import { describe, expect, it } from 'vitest'

import {
  QR_CODE_ADDRESS,
  QR_CODE_SIZE_PIXELS,
} from '@/components/GetResume/components/QrCodeOption/constants'

import { drawQrCodeArtwork } from './drawQrCodeArtwork'
import { rasterizeQrCodeArtwork } from './rasterizeQrCodeArtwork'

const ARTWORK_FILE = path.resolve(
  __dirname,
  '../../../../../components/GetResume/components/QrCodeOption/qrCodeArtwork.json',
)
const JSON_INDENT = 2
// What a phone must open. A literal, so a renamed PDF or a moved site fails here by name.
const RESUME_PDF_ADDRESS = 'https://kups.me/Zachary_Kuptsow_Resume.pdf'

/**
 * The checks below read this fresh drawing, not the committed file. Vitest writes a file
 * snapshot only after the whole file has run, so a test that read the file would see the
 * old drawing during the very run that redraws it. The first test ties the two together.
 */
describe('QR code artwork', () => {
  const artwork = drawQrCodeArtwork(QR_CODE_ADDRESS)

  it('is the committed drawing, and running this file with -u redraws it', async () => {
    const committedForm = `${JSON.stringify(artwork, null, JSON_INDENT)}\n`

    await expect(committedForm).toMatchFileSnapshot(ARTWORK_FILE)
  })

  it('is drawn for the address of the resume PDF on the live site', () => {
    expect(QR_CODE_ADDRESS).toBe(RESUME_PDF_ADDRESS)
  })

  it('decodes to the address of the resume PDF', () => {
    expect(decodeQR(rasterizeQrCodeArtwork(artwork))).toBe(RESUME_PDF_ADDRESS)
  })

  it('puts every square on whole pixels at the size it is shown', () => {
    expect(QR_CODE_SIZE_PIXELS % artwork.unitsPerSide).toBe(0)
  })
})
