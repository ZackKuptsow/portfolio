import { SITE_URL } from '@/data/identity'

import { RESUME_PDF_PATH } from '../../constants'

/**
 * The address the code holds. `qrCodeArtwork.json` is drawn from it, and a test fails when
 * the two disagree. To redraw the artwork after this changes, run
 * `yarn test -u test/components/GetResume/components/QrCodeOption/qrCodeArtwork.test.ts`.
 */
export const QR_CODE_ADDRESS = `${SITE_URL}${RESUME_PDF_PATH}`

/** What a screen reader announces in place of the code: what scanning it does. */
export const QR_CODE_ALT_TEXT = 'QR code that opens the resume PDF'

/** Shown under the code. */
export const QR_CODE_HINT = 'scan to open it on your phone'

/**
 * Width and height on screen. A whole multiple of the artwork's units per side, so every
 * square covers whole pixels. A test checks it.
 */
export const QR_CODE_SIZE_PIXELS = 185
