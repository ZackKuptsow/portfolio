import { test as baseTest } from '@playwright/test'

import { LOCAL_HOST } from './constants'

/**
 * The `test` every browser check uses. A page may talk to the local server and to nothing
 * else, so no check can reach the live resume API and send a real email, whatever it
 * clicks. It also means a check fails when the page starts to depend on another site.
 */
export const test = baseTest.extend<{ onlyLocalRequests: void }>({
  onlyLocalRequests: [
    async ({ context }, use) => {
      await context.route(
        (url) => url.hostname !== LOCAL_HOST,
        (route) => route.abort(),
      )
      await use()
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'
