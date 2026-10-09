import { SITE_URL } from '@/data/identity'

import { RESUME_PDF_PATH } from '../../constants'

/**
 * The address the code holds. `qrCodeArtwork.json` is drawn from it, and a test fails when
 * the two disagree. "QR code" in the README lists what to do after this changes: redraw
 * the artwork, then update the address the test expects.
 *
 * At 42 characters this is the longest address a code of this size holds. A longer one
 * makes the code 41 units a side, not 37, and `QR_CODE_SIZE_PIXELS` has to change with it.
 */
export const QR_CODE_ADDRESS = `${SITE_URL}${RESUME_PDF_PATH}`

/** What a screen reader announces in place of the code: what scanning it does. */
export const QR_CODE_ALT_TEXT = 'QR code that opens the resume PDF'

/** Shown under the code. */
export const QR_CODE_HINT = 'scan to open it on your phone'

/**
 * Width and height on screen, in CSS pixels. A whole multiple of the artwork's units per
 * side, so every square is a whole number of CSS pixels wide: 5 at 37 units. A test checks
 * it. A screen whose pixel ratio is not a whole number still draws some squares a device
 * pixel wider than others.
 */
export const QR_CODE_SIZE_PIXELS = 185
