import type { QrCodeArtwork } from '@/components/GetResume/components/QrCodeOption/types'

const DARK = 0
const LIGHT = 255
const PIXELS_PER_UNIT = 8
const RGB_CHANNELS = 3
const RGBA_CHANNELS = 4
// One run of dark squares in the path data, as drawQrCodeArtwork writes it: start, row,
// then the same length twice.
const RUN_IN_PATH_DATA = /M(\d+) (\d+)h(\d+)v1h-\3z/g

/** Pixels in the layout a QR decoder reads: four bytes a pixel, row by row. */
export interface Bitmap {
  data: Uint8ClampedArray
  height: number
  width: number
}

/**
 * Paints the artwork black on white, as a screen would, so a test can read what the
 * drawing itself says. Throws when any part of the path is not a run of squares, or when a
 * run leaves the drawing, so neither can change the picture unnoticed.
 */
export function rasterizeQrCodeArtwork({ path, unitsPerSide }: QrCodeArtwork): Bitmap {
  const runs = [...path.matchAll(RUN_IN_PATH_DATA)]
  if (runs.map(([run]) => run).join('') !== path) {
    throw new Error('The artwork path holds something other than runs of dark squares')
  }

  const sidePixels = unitsPerSide * PIXELS_PER_UNIT
  const data = new Uint8ClampedArray(sidePixels * sidePixels * RGBA_CHANNELS).fill(LIGHT)
  for (const [run, start, row, length] of runs) {
    if (Number(row) >= unitsPerSide || Number(start) + Number(length) > unitsPerSide) {
      throw new Error(`The artwork path draws outside its ${unitsPerSide} units: ${run}`)
    }
    const left = Number(start) * PIXELS_PER_UNIT
    const right = left + Number(length) * PIXELS_PER_UNIT
    const top = Number(row) * PIXELS_PER_UNIT
    for (let y = top; y < top + PIXELS_PER_UNIT; y += 1) {
      for (let x = left; x < right; x += 1) {
        const pixel = (y * sidePixels + x) * RGBA_CHANNELS
        data.fill(DARK, pixel, pixel + RGB_CHANNELS)
      }
    }
  }
  return { data, height: sidePixels, width: sidePixels }
}

/** Reads a painted drawing back as squares: true where the middle of a square is dark. */
export function readSquaresFromBitmap({ data, width }: Bitmap, unitsPerSide: number): boolean[][] {
  const pixelsPerUnit = width / unitsPerSide
  const middleOf = (unit: number) => Math.floor((unit + 0.5) * pixelsPerUnit)
  return Array.from({ length: unitsPerSide }, (_row, row) =>
    Array.from(
      { length: unitsPerSide },
      (_column, column) =>
        data[(middleOf(row) * width + middleOf(column)) * RGBA_CHANNELS] === DARK,
    ),
  )
}
