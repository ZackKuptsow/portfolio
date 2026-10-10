import path from 'node:path'

import { defineConfig } from 'vitest/config'

/**
 * The tests that read the built site in `out/`: what `yarn build` produced, which no test
 * of the source can see. They need the build first, so `yarn test` does not include them.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    // jsdom, for its HTML parser. Nothing here renders a component.
    environment: 'jsdom',
    include: ['test-built-site/**/*.test.ts'],
  },
})
