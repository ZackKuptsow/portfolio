/**
 * Compile-time checks on the project types. `yarn typecheck` enforces this file, and `yarn test`
 * does not run it, because Vitest does not check types.
 *
 * Each `@ts-expect-error` marks a value that must NOT compile. An unused
 * directive is itself an error, so if a type loosens and the value starts to
 * compile, the typecheck fails here.
 */
import type { ProjectEntry } from '@/data/projects'

const PROJECT_HEADING = {
  description: 'A paragraph.',
  subtitle: 'What it is · Stack · Year',
  title: 'A project',
}
const LINK = { href: 'https://example.com', label: 'code' }

// @ts-expect-error a project with nowhere to go is only a claim
export const projectWithNoLinks: ProjectEntry = { ...PROJECT_HEADING, links: [] }

export const projectWithOneLink: ProjectEntry = { ...PROJECT_HEADING, links: [LINK] }

export const projectKeptPrivateWithNoLinks: ProjectEntry = {
  ...PROJECT_HEADING,
  links: [],
  privateBecause: 'it holds other people',
}

export const projectWithARecordingAndNoLinks: ProjectEntry = {
  ...PROJECT_HEADING,
  links: [],
  video: {
    description: 'A tour.',
    durationLabel: '1:00',
    posterPath: '/tour.jpg',
    sourcePath: '/tour.mp4',
    title: 'A tour',
    triggerLabel: 'watch',
  },
}

export const projectWithEmptyHighlights: ProjectEntry = {
  ...PROJECT_HEADING,
  // @ts-expect-error an empty list is not content
  highlights: [],
  links: [LINK],
}

// @ts-expect-error the page renders from the list, so there must be a project
export const noProjects: typeof import('@/data/projects').projects = []
