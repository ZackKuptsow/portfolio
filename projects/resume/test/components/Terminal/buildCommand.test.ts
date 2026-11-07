import { describe, expect, it } from 'vitest'

import {
  buildCommand,
  initialCwd,
  listPromptLines,
  measureLongestPromptLine,
  shortenPromptPath,
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
  moves: readonly { route: CommandRoute; stepIndex: number }[],
): string[] {
  let cwd = fromCwd
  return moves.map(({ route, stepIndex }) => {
    const step = steps[stepIndex]
    const result = buildCommand({ cwd, route, section: sectionOf(step), step })
    cwd = result.cwd
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

    expect(play(INITIAL_PATH, moves).slice(0, 9)).toEqual([
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
    expect(play(INITIAL_PATH, moves)[9]).toBe('clear && cd ../projects && ls')
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
        expect(play(cwd, [{ route: 'menu', stepIndex }])).toEqual([command])
      }
    }
  })

  it('uses the cd .. of the table for the first hop out of a folder', () => {
    const fromFolder = (folder: string, stepIndex: number) =>
      play(`${INITIAL_PATH}/${folder}`, [{ route: 'up', stepIndex }])

    expect(fromFolder('skills', firstStepOf('education') + 1)).toEqual([
      'cd .. && cat education/eleg_university_of_delaware.txt',
    ])
    expect(fromFolder('education', firstStepOf('work') + 3)).toEqual([
      'cd .. && cat work_experience/qlik.txt',
    ])
    expect(fromFolder('projects', firstStepOf('skills'))).toEqual(['cd .. && ls -la skills/'])
    expect(fromFolder('work_experience', firstStepOf('about'))).toEqual([
      'cd .. && cat developer.profile',
    ])
  })

  // What the table cannot say: `cd ..` is false from the portfolio, since it leads to `~`. Each move
  // lands on a section's last card, because inside a section going up types nothing.
  it('stays true of the folders on a whole read back up, where the table could not', () => {
    const moves = [
      { route: 'up' as const, stepIndex: firstStepOf('skills') },
      { route: 'up' as const, stepIndex: firstStepOf('education') + 1 },
      { route: 'up' as const, stepIndex: firstStepOf('work') + 3 },
      { route: 'up' as const, stepIndex: firstStepOf('about') },
      { route: 'up' as const, stepIndex: firstStepOf('hero') },
    ]

    expect(play(`${INITIAL_PATH}/projects`, moves)).toEqual([
      'cd .. && ls -la skills/',
      'cat education/eleg_university_of_delaware.txt',
      'cat work_experience/qlik.txt',
      'cat developer.profile',
      'clear && cd ~ && whoami',
    ])
  })

  it('never uses a cd .. that would climb out of the portfolio', () => {
    for (const route of ['down', 'up'] as const) {
      steps.forEach((_, stepIndex) => {
        const [command] = play(INITIAL_PATH, [{ route, stepIndex }])
        expect(command).not.toMatch(/cd \.\./)
      })
    }
  })

  it('goes down from home through the portfolio, after the reverse trip left the prompt in ~', () => {
    expect(play('~', [{ route: 'down', stepIndex: firstStepOf('about') }])).toEqual([
      'clear && cd portfolio && cat developer.profile',
    ])
    expect(play('~', [{ route: 'down', stepIndex: firstStepOf('work') }])).toEqual([
      'clear && cd portfolio/work_experience && ls',
    ])
  })

  // A typed `cd` can leave the prompt anywhere in the fake filesystem, and the tour's next
  // command has to be true from there too.
  it.each([
    ['/', 'clear && cd home/zack/portfolio/education && ls'],
    ['/home', 'clear && cd zack/portfolio/education && ls'],
    ['~/portfolio/skills/languages_frameworks', 'clear && cd ../../education && ls'],
    ['~/portfolio/education', 'clear && ls'],
  ])('types a true cd into education from %s', (cwd, command) => {
    expect(play(cwd, [{ route: 'down', stepIndex: firstStepOf('education') }])).toEqual([command])
  })

  it('cats a card and the profile by a true path from the root and from a skill group', () => {
    const lastWorkStep = firstStepOf('education') - 1
    expect(play('/', [{ route: 'up', stepIndex: lastWorkStep }])).toEqual([
      'cd home/zack/portfolio && cat work_experience/qlik.txt',
    ])
    expect(
      play('~/portfolio/skills/languages_frameworks', [{ route: 'up', stepIndex: lastWorkStep }]),
    ).toEqual(['cd ../.. && cat work_experience/qlik.txt'])
    expect(play('/home', [{ route: 'down', stepIndex: firstStepOf('about') }])).toEqual([
      'clear && cd zack/portfolio && cat developer.profile',
    ])
    expect(play('/', [{ route: 'down', stepIndex: firstStepOf('skills') }])).toEqual([
      'clear && cd home/zack/portfolio/skills && ls -la',
    ])
  })

  it('leaves the prompt where the command says', () => {
    const step = steps[firstStepOf('skills')]

    expect(
      buildCommand({
        cwd: `${INITIAL_PATH}/projects`,
        route: 'up',
        section: sectionOf(step),
        step,
      }).cwd,
    ).toBe(INITIAL_PATH)
    expect(
      buildCommand({
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
  // The menu's jump from the work folder. Reading the longest file comes to less.
  const LONGEST_COMMAND = 'clear && cd ~/portfolio/education && ls'

  it('counts the longest command with the folder it is really typed in, and not a longer one', () => {
    expect(measureLongestPromptLine(sections, steps, (path) => path)).toBe(
      `~/portfolio/work_experience $ ${LONGEST_COMMAND}`.length,
    )
  })

  it('counts less on a phone, whose prompt shows the short path', () => {
    expect(measureLongestPromptLine(sections, steps, shortenPromptPath)).toBe(
      `~/work_experience $ ${LONGEST_COMMAND}`.length,
    )
  })
})

describe('listPromptLines', () => {
  const lines = listPromptLines(sections, steps, (path) => path)

  it('holds a read down, a read back up and the menu', () => {
    expect(lines).toContain('~/portfolio $ clear && cat developer.profile')
    expect(lines).toContain('~/portfolio/skills $ wget kups.me/get_resume.sh && sh get_resume.sh')
    expect(lines).toContain('~/portfolio/projects $ cd .. && ls -la skills/')
    expect(lines).toContain('~/portfolio $ cat work_experience/qlik.txt')
    expect(lines.filter((line) => line.includes('clear && cd ~/portfolio/'))).toHaveLength(4)
  })

  it('never goes back up through the resume, which only opens going down', () => {
    expect(lines.filter((line) => line.includes('wget'))).toHaveLength(2)
  })

  it('goes back up only by the last card of each section, the one way in from below', () => {
    expect(lines).not.toContain('~/portfolio $ cat education/cyber_university_of_delaware.txt')
    expect(lines.filter((line) => line.includes('cat work_experience/'))).toHaveLength(1)
  })
})

describe('shortenPromptPath', () => {
  it('keeps the last folder, and leaves home as it is', () => {
    expect(shortenPromptPath('~/portfolio/work_experience')).toBe('~/work_experience')
    expect(shortenPromptPath('~/portfolio')).toBe('~/portfolio')
    expect(shortenPromptPath('~')).toBe('~')
  })
})
