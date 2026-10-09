import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const BUILT_SITE_DIRECTORY = path.resolve(__dirname, '../out')
const HOME_PAGE_FILE = 'index.html'

/** Reads one file of the built site as text. Fails with the fix when there is no build. */
export function readBuiltFile(relativePath: string): string {
  if (!existsSync(path.join(BUILT_SITE_DIRECTORY, HOME_PAGE_FILE))) {
    throw new Error(`No built site in ${BUILT_SITE_DIRECTORY}. Run \`yarn build\` first.`)
  }
  return readFileSync(path.join(BUILT_SITE_DIRECTORY, relativePath), 'utf8')
}

/**
 * Every file of the built site, as the path a browser asks for: `/robots.txt`. The folder is
 * listed and the names compared as written, because a Mac's file system ignores letter case
 * and S3 does not.
 */
export function listBuiltPaths(): string[] {
  return readdirSync(BUILT_SITE_DIRECTORY, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name))
    .map(
      (filePath) => `/${path.relative(BUILT_SITE_DIRECTORY, filePath).split(path.sep).join('/')}`,
    )
}

/** The built home page, parsed the way a browser parses it. */
export function parseHomePage(): Document {
  return new DOMParser().parseFromString(readBuiltFile(HOME_PAGE_FILE), 'text/html')
}
