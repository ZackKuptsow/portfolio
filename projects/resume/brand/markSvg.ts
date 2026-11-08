import {
  MARK_GRID_SIZE,
  MARK_INK_COLOR,
  MARK_TILE_COLOR,
  MARK_TILE_CORNER_RADIUS,
} from './marks.ts'

import type { Mark, MarkShape } from './marks.ts'

/**
 * Rounded is the mark as drawn. Square is for places that crop or round it themselves: a phone's
 * home screen fills transparent corners with black, and GitHub crops a picture to a circle.
 */
export type TileShape = 'rounded' | 'square'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

function shapeElement(shape: MarkShape): string {
  if (shape.kind === 'fill') {
    return `<path d="${shape.d}" fill="${MARK_INK_COLOR}"/>`
  }
  const lineCap = shape.lineCap ? ` stroke-linecap="${shape.lineCap}"` : ''
  return `<path d="${shape.d}" stroke="${MARK_INK_COLOR}" stroke-width="${shape.width}" stroke-linejoin="round" fill="none"${lineCap}/>`
}

/** A standalone SVG document of the mark on its tile, with no live text in it. */
export function toMarkSvg(mark: Mark, tileShape: TileShape): string {
  const corner = tileShape === 'rounded' ? ` rx="${MARK_TILE_CORNER_RADIUS}"` : ''
  const tile = `<rect width="${MARK_GRID_SIZE}" height="${MARK_GRID_SIZE}"${corner} fill="${MARK_TILE_COLOR}"/>`
  const viewBox = `0 0 ${MARK_GRID_SIZE} ${MARK_GRID_SIZE}`
  return `<svg xmlns="${SVG_NAMESPACE}" viewBox="${viewBox}">${tile}${mark.shapes.map(shapeElement).join('')}</svg>\n`
}
