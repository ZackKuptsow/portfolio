import { toTerminalFileName } from '@/components/terminalFileName'
import { education, workExperience } from '@/data/profile'
import { projects } from '@/data/projects'

import { SECTION_DIRECTORY } from './constants'

import type { TerminalSection, TerminalStep } from './types'

/** The terminal's sections in reading order, with the fake files the data gives them. */
export function buildSections(): readonly TerminalSection[] {
  return [
    { directory: null, fileNames: [], id: 'hero' },
    { directory: null, fileNames: [], id: 'about' },
    {
      directory: SECTION_DIRECTORY.work,
      fileNames: workExperience.map((job) => toTerminalFileName(job.title)),
      id: 'work',
    },
    {
      directory: SECTION_DIRECTORY.education,
      fileNames: education.map((degree) =>
        toTerminalFileName(`${degree.fileNamePrefix} ${degree.title}`),
      ),
      id: 'education',
    },
    { directory: SECTION_DIRECTORY.skills, fileNames: [], id: 'skills' },
    { directory: null, fileNames: [], id: 'resume' },
    {
      directory: SECTION_DIRECTORY.projects,
      fileNames: projects.map((project) => toTerminalFileName(project.title)),
      id: 'projects',
    },
  ]
}

/**
 * One step per card, or one for a section with no cards. Cards share their section's screen,
 * so only the first of them clears it.
 */
export function buildSteps(sections: readonly TerminalSection[]): readonly TerminalStep[] {
  return sections.flatMap((section): TerminalStep[] => {
    if (section.fileNames.length === 0) {
      return [
        {
          blockId: `${section.id}-0`,
          clearsBefore: true,
          fileName: null,
          sectionId: section.id,
        },
      ]
    }
    return section.fileNames.map((fileName, index) => ({
      blockId: `${section.id}-${index}`,
      clearsBefore: index === 0,
      fileName,
      sectionId: section.id,
    }))
  })
}
