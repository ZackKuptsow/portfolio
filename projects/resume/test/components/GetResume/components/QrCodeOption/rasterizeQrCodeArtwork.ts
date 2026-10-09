import type { QrCodeArtwork } from '@/components/GetResume/components/QrCodeOption/types'

const DARK = 0
const LIGHT = 255
const PIXELS_PER_UNIT = 8
const RGB_CHANNELS = 3
const RGBA_CHANNELS = 4
// One run of dark squares, as drawQrCodeArtwork writes it: start, row, then the same length twice.
const RUN_OF_DARK_SQUARES = /M(\d+) (\d+)h(\d+)v1h-\3z/g

/** Pixels in the layout a QR decoder reads: four bytes a pixel, row by row. */
export interface Bitmap {
  data: Uint8ClampedArray
  height: number
  width: number
}

/**
 * Paints the artwork black on white, as a screen would, so a decoder can read what the
 * drawing itself says. Throws when any part of the path is not a run of squares, so a
 * change of path format cannot leave squares out unnoticed.
 */
export function rasterizeQrCodeArtwork({ path, unitsPerSide }: QrCodeArtwork): Bitmap {
  const runs = [...path.matchAll(RUN_OF_DARK_SQUARES)]
  if (runs.map(([run]) => run).join('') !== path) {
    throw new Error('The artwork path holds something other than runs of dark squares')
  }

  const sidePixels = unitsPerSide * PIXELS_PER_UNIT
  const data = new Uint8ClampedArray(sidePixels * sidePixels * RGBA_CHANNELS).fill(LIGHT)
  for (const [, start, row, length] of runs) {
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
