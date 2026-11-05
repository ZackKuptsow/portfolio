import { describe, expect, it } from 'vitest'

import {
  buildCommand,
  initialCwd,
  measureLongestPromptLine,
} from '@/components/Terminal/buildCommand'
import type { CommandRoute } from '@/components/Terminal/buildCommand'
import { buildSections, buildSteps } from '@/components/Terminal/buildSections'
import { INITIAL_PATH } from '@/components/Terminal/constants'
import type { SectionId, TerminalSection, TerminalStep } from '@/components/Terminal/types'

const sections = buildSections()
const steps = buildSteps(sections)

function sectionOf(step: TerminalStep): TerminalSection {
  return sections.find((section) => section.id === step.sectionId) as TerminalSection
}

/** Plays a route through the steps from a folder, as the engine does, tracking the prompt. */
function play(
  fromCwd: string,
  fromSectionId: SectionId,
  moves: readonly { route: CommandRoute; stepIndex: number }[],
): string[] {
  let cwd = fromCwd
  let cameFromSectionId = fromSectionId
  return moves.map(({ route, stepIndex }) => {
    const step = steps[stepIndex]
    const result = buildCommand({
      cameFromSectionId,
      cwd,
      route,
      section: sectionOf(step),
      step,
    })
    cwd = result.cwd
    cameFromSectionId = step.sectionId
    return result.command
  })
}

function firstStepOf(sectionId: SectionId): number {
  return steps.findIndex((step) => step.sectionId === sectionId)
}

describe('buildCommand', () => {
  it('types the commands of the table in DESIGN.md, word for word, on a read down', () => {
    const moves = steps.slice(1).map((_, index) => ({
      route: 'down' as const,
      stepIndex: index + 1,
    }))

    expect(play(INITIAL_PATH, 'hero', moves).slice(0, 9)).toEqual([
      'clear && cat developer.profile',
      'clear && cd ./work_experience && ls',
      'cat draynow.txt',
      'cat teampay.txt',
      'cat qlik.txt',
      'clear && cd ../education && ls',
      'cat eleg_university_of_delaware.txt',
      'clear && cd ../skills && ls -la',
      'wget kups.me/get_resume.sh && sh get_resume.sh',
    ])
    expect(play(INITIAL_PATH, 'hero', moves)[9]).toBe('clear && cd ../projects && ls')
  })

  it('types the menu commands of the table, whole paths, from anywhere', () => {
    const fromAnyFolder = ['~', INITIAL_PATH, `${INITIAL_PATH}/skills`]
    const expected: Record<string, string> = {
      about: 'clear && cat ~/portfolio/developer.profile',
      education: 'clear && cd ~/portfolio/education && ls',
      hero: 'clear && cd ~ && whoami',
      projects: 'clear && cd ~/portfolio/projects && ls',
      resume: 'wget kups.me/get_resume.sh && sh get_resume.sh',
      skills: 'clear && cd ~/portfolio/skills && ls -la',
      work: 'clear && cd ~/portfolio/work_experience && ls',
    }

    for (const cwd of fromAnyFolder) {
      for (const [sectionId, command] of Object.entries(expected)) {
        const stepIndex = firstStepOf(sectionId as SectionId)
        expect(play(cwd, 'hero', [{ route: 'menu', stepIndex }])).toEqual([command])
      }
    }
  })

  it('uses the cd .. of the table for the first hop out of a folder', () => {
    const fromFolder = (folder: string, sectionId: SectionId, stepIndex: number) =>
      play(`${INITIAL_PATH}/${folder}`, sectionId, [{ route: 'up', stepIndex }])

    expect(fromFolder('skills', 'skills', firstStepOf('education') + 1)).toEqual([
      'cd .. && cat education/eleg_university_of_delaware.txt',
    ])
    expect(fromFolder('education', 'education', firstStepOf('work') + 3)).toEqual([
      'cd .. && cat work_experience/qlik.txt',
    ])
    expect(fromFolder('projects', 'projects', firstStepOf('skills'))).toEqual([
      'cd .. && ls -la skills/',
    ])
    expect(fromFolder('work_experience', 'work', firstStepOf('about'))).toEqual([
      'cd .. && cat developer.profile',
    ])
  })

  it('reads within a section by the bare file name when the prompt is in its folder', () => {
    expect(
      play(`${INITIAL_PATH}/projects`, 'projects', [
        { route: 'up', stepIndex: firstStepOf('projects') },
      ]),
    ).toEqual(['cat hermes_imessage_shortcuts.txt'])
  })

  // What the table cannot say: `cd ..` is false from the portfolio, since it leads to `~`.
  it('stays true of the folders on a whole read back up, where the table could not', () => {
    const projectsStart = firstStepOf('projects')
    const moves = [
      { route: 'up' as const, stepIndex: firstStepOf('skills') },
      { route: 'up' as const, stepIndex: firstStepOf('education') + 1 },
      { route: 'up' as const, stepIndex: firstStepOf('education') },
      { route: 'up' as const, stepIndex: firstStepOf('work') + 3 },
      { route: 'up' as const, stepIndex: firstStepOf('about') },
      { route: 'up' as const, stepIndex: firstStepOf('hero') },
    ]

    expect(projectsStart).toBeGreaterThan(0)
    expect(play(`${INITIAL_PATH}/projects`, 'projects', moves)).toEqual([
      'cd .. && ls -la skills/',
      'cat education/eleg_university_of_delaware.txt',
      'cat education/cyber_university_of_delaware.txt',
      'cat work_experience/qlik.txt',
      'cat developer.profile',
      'clear && cd ~ && whoami',
    ])
  })

  it('never uses a cd .. that would climb out of the portfolio', () => {
    for (const route of ['down', 'up'] as const) {
      steps.forEach((_, stepIndex) => {
        const [command] = play(INITIAL_PATH, 'hero', [{ route, stepIndex }])
        expect(command).not.toMatch(/cd \.\./)
      })
    }
  })

  it('goes down from home through the portfolio, after the reverse trip left the prompt in ~', () => {
    expect(play('~', 'hero', [{ route: 'down', stepIndex: firstStepOf('about') }])).toEqual([
      'clear && cd portfolio && cat developer.profile',
    ])
    expect(play('~', 'hero', [{ route: 'down', stepIndex: firstStepOf('work') }])).toEqual([
      'clear && cd portfolio/work_experience && ls',
    ])
  })

  it('leaves the prompt where the command says', () => {
    const step = steps[firstStepOf('skills')]

    expect(
      buildCommand({
        cameFromSectionId: 'projects',
        cwd: `${INITIAL_PATH}/projects`,
        route: 'up',
        section: sectionOf(step),
        step,
      }).cwd,
    ).toBe(INITIAL_PATH)
    expect(
      buildCommand({
        cameFromSectionId: 'education',
        cwd: `${INITIAL_PATH}/education`,
        route: 'down',
        section: sectionOf(step),
        step,
      }).cwd,
    ).toBe(`${INITIAL_PATH}/skills`)
  })
})

describe('initialCwd', () => {
  it('opens a page in the folder of its first section, or the portfolio when it has none', () => {
    expect(initialCwd(sections.find((s) => s.id === 'hero') as TerminalSection)).toBe(INITIAL_PATH)
    expect(initialCwd(sections.find((s) => s.id === 'projects') as TerminalSection)).toBe(
      `${INITIAL_PATH}/projects`,
    )
  })
})

describe('measureLongestPromptLine', () => {
  it('counts at least the longest file name the prompt can cat, with its folder and symbol', () => {
    const longestFile = 'a_household_assistant_by_text_and_the_mac_that_answers_it.txt'

    expect(measureLongestPromptLine(sections, steps)).toBeGreaterThanOrEqual(
      `~/portfolio/work_experience $ cat ${longestFile}`.length,
    )
  })
})
