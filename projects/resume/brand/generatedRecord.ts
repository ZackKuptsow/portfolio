import { createHash } from 'node:crypto'

import type { Mark, MarkName } from './marks.ts'

/** Every file `yarn brand` writes, relative to `projects/resume`. */
export const GENERATED_FILES = {
  appleIcon: 'app/apple-icon.png',
  emailMark: 'public/email-mark.png',
  favicon: 'app/favicon.ico',
  gitHubPicture: 'brand/github-picture.png',
  markSvg: 'brand/mark.svg',
  shareImage: 'app/opengraph-image.png',
} as const

/** Where `yarn brand` records what it made the files from. */
export const GENERATED_RECORD_PATH = 'brand/generated.json'

/** Which mark, as drawn at the time, the files were made from, and each file's hash. */
export type GeneratedRecord = {
  files: Record<string, string>
  mark: MarkName
  markHash: string
}

const HASH_ALGORITHM = 'sha256'
const HASH_ENCODING = 'hex'

/** The SHA-256 of a file's bytes, in hex. */
export function hashBytes(bytes: Uint8Array): string {
  return createHash(HASH_ALGORITHM).update(bytes).digest(HASH_ENCODING)
}

/** A hash of a mark's shapes and drawing, so a changed mark no longer matches its files. */
export function hashMark(mark: Mark): string {
  return hashBytes(new TextEncoder().encode(JSON.stringify(mark)))
}
