import type { SectionId } from './types'

/** Each section's folder under `~/portfolio`. Part of the commands and of the prompt's path. */
export const SECTION_DIRECTORY = {
  education: 'education',
  projects: 'projects',
  skills: 'skills',
  work: 'work_experience',
} as const

/** The heading of each section that has one. */
export const SECTION_HEADING = {
  education: 'Education',
  projects: 'Projects',
  skills: 'Skills',
  work: 'Work Experience',
} as const

/** The folder the title bar names before any command has run. */
export const INITIAL_PATH = '~/portfolio'

/** The address the hero prints, a line of today's site. */
export const HERO_PATH = '~/root/portfolio'

/** Shown before the path in the title bar, on anything wider than a phone. */
export const TITLE_BAR_USER = 'zack@kups:'

/** The footer's line about how the site is made. */
export const BUILT_WITH_LINE =
  'Built with Next.js, deployed via AWS CDK, automated through GitHub Actions'

/**
 * A comment line per section or card, keyed by section id or file name. Each is a line a
 * visitor reads, so it goes in only once Zack has approved it, and it must be true when it does.
 */
export const OUTPUT_COMMENT: Partial<Record<SectionId | string, string>> = {}
