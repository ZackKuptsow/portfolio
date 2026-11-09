import { describe, expect, it } from 'vitest'

import { packIco } from '@/brand/icoFile'

const HEADER_BYTES = 6
const ENTRY_BYTES = 16

function readUint16(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset).getUint16(offset, true)
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset).getUint32(offset, true)
}

describe('packIco', () => {
  const small = new Uint8Array([1, 2, 3])
  const large = new Uint8Array([4, 5, 6, 7, 8])
  const packed = packIco([
    { pixels: 16, png: small },
    { pixels: 256, png: large },
  ])

  it('starts with the icon header and counts its images', () => {
    expect(readUint16(packed, 0)).toBe(0)
    expect(readUint16(packed, 2)).toBe(1)
    expect(readUint16(packed, 4)).toBe(2)
  })

  it('points each directory entry at its own PNG, whole', () => {
    ;[small, large].forEach((png, index) => {
      const entry = HEADER_BYTES + index * ENTRY_BYTES
      const size = readUint32(packed, entry + 8)
      const offset = readUint32(packed, entry + 12)
      expect(size).toBe(png.length)
      expect([...packed.slice(offset, offset + size)]).toEqual([...png])
    })
  })

  it('writes each size in its entry, with 256 written as 0', () => {
    expect(packed[HEADER_BYTES]).toBe(16)
    expect(packed[HEADER_BYTES + 1]).toBe(16)
    expect(packed[HEADER_BYTES + ENTRY_BYTES]).toBe(0)
    expect(packed[HEADER_BYTES + ENTRY_BYTES + 1]).toBe(0)
  })

  it('records one color plane and 32 bits a pixel', () => {
    expect(readUint16(packed, HEADER_BYTES + 4)).toBe(1)
    expect(readUint16(packed, HEADER_BYTES + 6)).toBe(32)
  })

  it('refuses a size an icon file cannot hold', () => {
    expect(() => packIco([{ pixels: 512, png: small }])).toThrow(/512/)
  })
})
