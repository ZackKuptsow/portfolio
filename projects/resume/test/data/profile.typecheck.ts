/**
 * Compile-time checks on the content types. `yarn typecheck` enforces this
 * file, and `yarn test` does not run it, because Vitest does not check types.
 *
 * Each `@ts-expect-error` marks a value that must NOT compile. An unused
 * directive is itself an error, so if a type loosens and the value starts to
 * compile, the typecheck fails here.
 */
import type { EducationEntry, WorkExperienceEntry } from '@/data/profile'

const HEADING = { subtitle: 'Role · dates', title: 'Company' }

// @ts-expect-error a job with nothing to show would render an empty card
export const jobWithNoContent: WorkExperienceEntry = { ...HEADING }

export const jobWithEmptyHighlights: WorkExperienceEntry = {
  ...HEADING,
  // @ts-expect-error an empty list is not content
  highlights: [],
}

export const jobWithParagraph: WorkExperienceEntry = { ...HEADING, description: 'A paragraph.' }

export const jobWithHighlights: WorkExperienceEntry = { ...HEADING, highlights: ['One thing.'] }

export const jobWithBoth: WorkExperienceEntry = {
  ...HEADING,
  description: 'A paragraph.',
  highlights: ['One thing.'],
}

// @ts-expect-error the structured data reads the first degree, so there must be one
export const noDegrees: typeof import('@/data/profile').education = []

export const oneDegree: readonly EducationEntry[] = [
  { ...HEADING, description: 'A degree.', fileNamePrefix: 'prefix' },
]
