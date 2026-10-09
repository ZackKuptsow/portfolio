import { QR_CODE_ALT_TEXT, QR_CODE_HINT, QR_CODE_SIZE_PIXELS } from './constants'
import artworkFile from './qrCodeArtwork.json'

import type { QrCodeArtwork } from './types'

// Typed, so a drawing of another shape fails the typecheck and not just the tests.
const artwork: QrCodeArtwork = artworkFile

/**
 * A QR code that opens the resume PDF on a phone, with its caption underneath.
 *
 * The code is drawn inline, not loaded as an image file, so `.qr-code` in globals.css can
 * color it: black on white in the light theme, green on black in the dark one.
 */
export function QrCodeOption() {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={QR_CODE_SIZE_PIXELS}
        height={QR_CODE_SIZE_PIXELS}
        viewBox={`0 0 ${artwork.unitsPerSide} ${artwork.unitsPerSide}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={QR_CODE_ALT_TEXT}
        className="qr-code"
      >
        <path d={artwork.path} fill="currentColor" />
      </svg>
      <p className="font-mono text-xs text-muted-foreground">{QR_CODE_HINT}</p>
    </div>
  )
}
