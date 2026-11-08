/** One PNG to go in an icon file, and the width and height it was drawn at. */
export type IcoImage = { pixels: number; png: Uint8Array }

const HEADER_BYTES = 6
const ENTRY_BYTES = 16
const ICON_TYPE = 1
const COLOR_PLANES = 1
const BITS_PER_PIXEL = 32
const LARGEST_SIZE = 256
/** An entry's size is one byte, so 256 is written as 0. */
const LARGEST_SIZE_BYTE = 0

/**
 * Packs PNGs into one `.ico` file, each stored whole, which every browser reads. Written here
 * rather than taken from a package, because the format is a 6-byte header and a 16-byte entry
 * per image.
 */
export function packIco(images: readonly IcoImage[]): Uint8Array {
  for (const { pixels } of images) {
    if (pixels < 1 || pixels > LARGEST_SIZE) {
      throw new Error(`An icon file holds sizes from 1 to ${LARGEST_SIZE}, not ${pixels}`)
    }
  }
  const imagesStart = HEADER_BYTES + images.length * ENTRY_BYTES
  const totalBytes = imagesStart + images.reduce((sum, { png }) => sum + png.length, 0)
  const bytes = new Uint8Array(totalBytes)
  const view = new DataView(bytes.buffer)
  view.setUint16(2, ICON_TYPE, true)
  view.setUint16(4, images.length, true)

  let offset = imagesStart
  images.forEach(({ pixels, png }, index) => {
    const entry = HEADER_BYTES + index * ENTRY_BYTES
    const sizeByte = pixels === LARGEST_SIZE ? LARGEST_SIZE_BYTE : pixels
    view.setUint8(entry, sizeByte)
    view.setUint8(entry + 1, sizeByte)
    view.setUint16(entry + 4, COLOR_PLANES, true)
    view.setUint16(entry + 6, BITS_PER_PIXEL, true)
    view.setUint32(entry + 8, png.length, true)
    view.setUint32(entry + 12, offset, true)
    bytes.set(png, offset)
    offset += png.length
  })
  return bytes
}
