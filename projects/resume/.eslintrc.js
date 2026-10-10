module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'plugin:import/recommended', 'plugin:import/typescript'],
  // Written by a build or a test run, not by a person. Without `out/`, lint read the built
  // scripts whenever a build was lying around.
  ignorePatterns: ['out/', 'playwright-report/', 'test-results/'],
  plugins: ['import'],
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin', // node built-ins
          'external', // external packages like react, next
          'internal', // @/components etc
          ['parent', 'sibling', 'index'],
          'object', // imports like import log = require("log");
          'type', // `import type { ... }`
        ],
        pathGroups: [
          // Move CSS files to top
          {
            pattern: '**/*.css',
            group: 'index',
            position: 'before',
          },
          // Treat @/** as internal
          {
            pattern: '@/**',
            group: 'internal',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        'newlines-between': 'always',
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
}
