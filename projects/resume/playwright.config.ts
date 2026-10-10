import { existsSync } from 'node:fs'
import path from 'node:path'

import { defineConfig } from '@playwright/test'

import { LOCAL_HOST, LOCAL_ORIGIN, LOCAL_PORT } from './test-browser/constants'

const BUILT_SITE_DIRECTORY = 'out'
const IS_CI = Boolean(process.env.CI)

if (!existsSync(path.join(__dirname, BUILT_SITE_DIRECTORY, 'index.html'))) {
  throw new Error(`No built site in ${BUILT_SITE_DIRECTORY}/. Run \`yarn build\` first.`)
}

/**
 * The browser checks: what only a real browser can see, such as layout, media queries and
 * where the keyboard lands. They run against the built site in `out/`, served as plain
 * files, in the Chrome that is already installed. Nothing here downloads a browser.
 */
export default defineConfig({
  // A `test.only` left in by mistake would skip every other check and still pass.
  forbidOnly: IS_CI,
  fullyParallel: true,
  reporter: IS_CI ? [['list'], ['github']] : 'list',
  // A check that passes on a second try has hidden something, so there is no second try.
  retries: 0,
  testDir: 'test-browser',
  use: {
    baseURL: LOCAL_ORIGIN,
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `python3 -m http.server ${LOCAL_PORT} --bind ${LOCAL_HOST} --directory ${BUILT_SITE_DIRECTORY}`,
    // Never a server that is already running: it could be serving an older build.
    reuseExistingServer: false,
    // The server writes a line for every request, which buries the results.
    stderr: 'ignore',
    url: LOCAL_ORIGIN,
  },
})
