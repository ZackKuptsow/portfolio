import path from 'node:path'

import { defineConfig } from 'vitest/config'

// Tests must never reach the deployed API. The `.invalid` top-level domain is reserved
// (RFC 2606) and never resolves. The tests assert this exact value was called.
const TEST_RESUME_REQUEST_API_URL = 'https://resume-requests.invalid/resume-requests'

export default defineConfig({
  esbuild: {
    // tsconfig keeps `jsx: preserve` for Next, so tests compile JSX here.
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    env: {
      NEXT_PUBLIC_RESUME_REQUEST_API_URL: TEST_RESUME_REQUEST_API_URL,
    },
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    setupFiles: ['test/setup.ts'],
    unstubGlobals: true,
  },
})
