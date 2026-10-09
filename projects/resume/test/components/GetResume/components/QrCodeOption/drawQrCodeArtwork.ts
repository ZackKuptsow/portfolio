import { encodeQR } from 'qr'

import type { QrCodeArtwork } from '@/components/GetResume/components/QrCodeOption/types'

const DARK_SQUARE = '#'
const LIGHT_SQUARE = '.'
const RUN_OF_DARK_SQUARES = /#+/g
// The code still reads with about 15% of it damaged. For the resume address it is free:
// the code is the same size as at `low`.
const ERROR_CORRECTION = 'medium'
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
      return [...rowText.matchAll(RUN_OF_DARK_SQUARES)].map(
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
