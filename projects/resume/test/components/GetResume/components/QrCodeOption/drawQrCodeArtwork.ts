import { encodeQR } from 'qr'

import type { QrCodeArtwork } from '@/components/GetResume/components/QrCodeOption/types'

const DARK_SQUARE = '#'
// One run of dark squares in a row written out as text, one character a square.
const DARK_SQUARES_IN_ROW_TEXT = /#+/g
// The code still reads with about 15% of it damaged. For the resume address it is free:
// the code is the same size as at `low`.
const ERROR_CORRECTION = 'medium'
const LIGHT_SQUARE = '.'
// Light squares on every side. Four is the least the QR standard allows.
const QUIET_ZONE_UNITS = 4

/**
 * SVG path data for the dark squares: one closed sub-path per horizontal run, in units of
 * one square. A run is one shape, so no seam can show between neighbouring squares.
 */
function buildSquaresPath(squares: boolean[][]): string {
  return squares
    .flatMap((row, rowIndex) => {
      const rowText = row.map((isDark) => (isDark ? DARK_SQUARE : LIGHT_SQUARE)).join('')
      return [...rowText.matchAll(DARK_SQUARES_IN_ROW_TEXT)].map(
        (run) => `M${run.index} ${rowIndex}h${run[0].length}v1h-${run[0].length}z`,
      )
    })
    .join('')
}

/** Draws the QR code that holds `address`, in the form `qrCodeArtwork.json` stores. */
export function drawQrCodeArtwork(address: string): QrCodeArtwork {
  const squares = encodeQR(address, 'raw', { border: QUIET_ZONE_UNITS, ecc: ERROR_CORRECTION })
  return { path: buildSquaresPath(squares), unitsPerSide: squares.length }
}
