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
    // next/font/google downloads during the build, and a failed download fails the build
    // whatever the change was (issue #17).
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            message:
              'A build must need nothing from Google Fonts. Use next/font/local and the files in app/fonts/.',
            name: 'next/font/google',
          },
        ],
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  overrides: [
    {
      // The typed shell prints only what it was given, through textContent, and evaluates
      // nothing typed. See docs/superpowers/specs/2026-11-06-typed-terminal-commands-design.md.
      files: ['components/Terminal/**/*.ts', 'components/Terminal/**/*.tsx'],
      rules: {
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'no-new-func': 'error',
        'no-restricted-properties': [
          'error',
          ...['innerHTML', 'outerHTML', 'insertAdjacentHTML'].map((property) => ({
            message: `The terminal writes text with textContent, never markup from a string (${property}). See the typed commands design.`,
            property,
          })),
        ],
      },
    },
  ],
}
