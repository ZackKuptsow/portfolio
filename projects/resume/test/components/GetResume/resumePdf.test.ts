import { readdirSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { RESUME_PDF_PATH } from '@/components/GetResume/constants'

const PUBLIC_DIRECTORY = path.resolve(__dirname, '../../../public')

describe('resume PDF', () => {
  // The download link, the open link and the QR code all point at this one path. The check
  // lists the folder instead of asking for the file by name, because a Mac's file system
  // ignores letter case and S3 does not.
  it('ships at the path the links and the QR code point to', () => {
    const shippedPaths = readdirSync(PUBLIC_DIRECTORY).map((fileName) => `/${fileName}`)

    expect(shippedPaths).toContain(RESUME_PDF_PATH)
  })
})
