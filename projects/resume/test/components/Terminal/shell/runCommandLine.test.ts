import { describe, expect, it } from 'vitest'

import { listPromptLines } from '@/components/Terminal/buildCommand'
import { buildSections, buildSteps } from '@/components/Terminal/buildSections'
import { buildFileSystem } from '@/components/Terminal/shell/fakeFileSystem'
import { runCommandLine } from '@/components/Terminal/shell/runCommandLine'
import type { RunResult, ShellContext, ShellState } from '@/components/Terminal/shell/types'
import type { EasterEgg, OutputLine } from '@/data/terminalEasterEggs'

const sections = buildSections()
const steps = buildSteps(sections)
const state: ShellState = { cwd: '~/portfolio', history: [], lastExitStatus: 0 }
const context: ShellContext = {
  columns: 80,
  eggs: [],
  gitLog: [],
  isDark: () => true,
  now: () => new Date(2026, 10, 6, 14, 42, 7),
  root: buildFileSystem(sections, []),
}

function textOf(line: OutputLine): string {
  return line.map((segment) => segment.text).join('')
}

function firstLine(run: RunResult): string {
  return textOf(run.outcomes[0].lines[0])
}

describe('runCommandLine', () => {
  it("runs the tour's own commands", () => {
    const { outcomes, state: next } = runCommandLine(
      'clear && cd ./work_experience && ls',
      state,
      context,
    )

    expect(outcomes.map((outcome) => outcome.effect?.kind)).toEqual(['clear', undefined, undefined])
    expect(next.cwd).toBe('~/portfolio/work_experience')
    expect(outcomes[2].listing).toEqual([
      'draynow.txt',
      'low_rate_co.txt',
      'qlik.txt',
      'teampay.txt',
    ])
    expect(next.lastExitStatus).toBe(0)
  })

  it('runs every line the tour types, from the folder it was typed in, to the folder it meant', () => {
    const lines = listPromptLines(sections, steps, (path) => path)
    expect(lines.length).toBeGreaterThan(20)

    lines.forEach((line, index) => {
      const [path, command] = line.split(' $ ')
      const { state: next } = runCommandLine(command, { ...state, cwd: path }, context)
      expect(next.lastExitStatus, line).toBe(0)
      const following = lines[index + 1]
      if (following) {
        expect(next.cwd, line).toBe(following.split(' $ ')[0])
      }
    })
  })

  it("answers in bash's words", () => {
    expect(firstLine(runCommandLine('foo', state, context))).toBe('bash: foo: command not found')
    expect(runCommandLine('foo', state, context).state.lastExitStatus).toBe(127)
    expect(firstLine(runCommandLine('ls | grep a', state, context))).toBe(
      "bash: syntax error near unexpected token '|'",
    )
    expect(runCommandLine('ls | grep a', state, context).state.lastExitStatus).toBe(2)
    expect(firstLine(runCommandLine('cd nowhere', state, context))).toBe(
      'bash: cd: nowhere: No such file or directory',
    )
    expect(firstLine(runCommandLine('cd developer.profile', state, context))).toBe(
      'bash: cd: developer.profile: Not a directory',
    )
    expect(firstLine(runCommandLine('cat education', state, context))).toBe(
      'cat: education: Is a directory',
    )
    expect(firstLine(runCommandLine('cat nope.txt', state, context))).toBe(
      'cat: nope.txt: No such file or directory',
    )
  })

  it('stops a chain at the first failure and reports it', () => {
    const { outcomes, state: next } = runCommandLine('ls && cat missing.txt && pwd', state, context)

    expect(outcomes).toHaveLength(2)
    expect(next.lastExitStatus).toBe(1)
    expect(firstLine(runCommandLine('echo $?', next, context))).toBe('1')
  })

  it('cats a card by block id, get_resume.sh by its lines, and a skill by its name', () => {
    expect(
      runCommandLine('cat work_experience/teampay.txt', state, context).outcomes[0].cardBlockId,
    ).toBe('work-2')
    expect(
      runCommandLine('cat get_resume.sh', state, context).outcomes[0].lines.map(textOf),
    ).toEqual(['#!/bin/sh', 'open https://kups.me/Zachary_Kuptsow_Resume.pdf'])
    expect(
      firstLine(
        runCommandLine(
          'cat skills/languages_frameworks/typescript_javascript_node_express',
          state,
          context,
        ),
      ),
    ).toBe('TypeScript / JavaScript (Node/Express)')
  })

  it('prints pwd, whoami, echo with its variables, which, and history', () => {
    expect(firstLine(runCommandLine('pwd', state, context))).toBe('/home/zack/portfolio')
    expect(firstLine(runCommandLine('whoami', state, context))).toBe('zachary.kuptsow')
    expect(firstLine(runCommandLine('echo $HOME $USER $SHELL $PWD $NOPE', state, context))).toBe(
      '/home/zack zack /bin/bash /home/zack/portfolio ',
    )
    expect(
      firstLine(runCommandLine(`echo "Let's build something amazing together"`, state, context)),
    ).toBe("Let's build something amazing together")
    expect(firstLine(runCommandLine('which ls', state, context))).toBe('/usr/bin/ls')
    const miss = runCommandLine('which nope', state, context)
    expect(miss.outcomes[0].lines).toEqual([])
    expect(miss.state.lastExitStatus).toBe(1)
    const after = runCommandLine('history', { ...state, history: ['whoami', 'ls -a'] }, context)
    expect(after.outcomes[0].lines.map(textOf)).toEqual([
      '    1  whoami',
      '    2  ls -a',
      '    3  history',
    ])
  })

  it('shows dotfiles only with -a, and lists a named folder', () => {
    const egg: EasterEgg = { kind: 'file', lines: [[{ text: 'x' }]], path: '~/portfolio/.secret' }
    const withEgg = { ...context, root: buildFileSystem(sections, [egg]) }
    expect(runCommandLine('ls', state, withEgg).outcomes[0].listing).not.toContain('.secret')
    expect(runCommandLine('ls -a', state, withEgg).outcomes[0].listing).toContain('.secret')
    expect(runCommandLine('ls skills/', state, context).outcomes[0].listing).toEqual([
      'infrastructure_tooling/',
      'languages_frameworks/',
      'practices_systems/',
    ])
    // The tour's own `ls -la` shows `.` and `..` too, as a real one would.
    expect(
      runCommandLine('ls -la skills/', state, context).outcomes[0].listing?.slice(0, 2),
    ).toEqual(['.', '..'])
  })

  it("maps the site's controls to effects with fixed addresses", () => {
    expect(runCommandLine('open github', state, context).outcomes[0].effect).toEqual({
      href: 'https://github.com/ZackKuptsow',
      kind: 'open-url',
    })
    expect(firstLine(runCommandLine('open', state, context))).toBe('usage: open github | linkedin')
    expect(
      runCommandLine('open https://evil.example', state, context).outcomes[0].effect,
    ).toBeUndefined()
    expect(runCommandLine('open https://evil.example', state, context).state.lastExitStatus).toBe(1)
    expect(runCommandLine('mail', state, context).outcomes[0].lines[0]).toEqual([
      { href: 'mailto:zkups56@gmail.com', text: 'zkups56@gmail.com' },
    ])
    expect(runCommandLine('theme light', state, context).outcomes[0].effect).toEqual({
      isDark: false,
      kind: 'theme',
    })
    expect(firstLine(runCommandLine('theme', state, { ...context, isDark: () => true }))).toBe(
      'dark',
    )
    expect(runCommandLine('plain', state, context).outcomes[0].effect).toEqual({
      kind: 'plain-view',
    })
    expect(runCommandLine('sh get_resume.sh', state, context).outcomes[0].effect).toEqual({
      kind: 'open-resume',
    })
    expect(runCommandLine('./get_resume.sh', state, context).outcomes[0].effect).toEqual({
      kind: 'open-resume',
    })
    expect(
      runCommandLine('wget kups.me/get_resume.sh && sh get_resume.sh', state, context).outcomes.map(
        (outcome) => outcome.effect?.kind,
      ),
    ).toEqual(['download', 'open-resume'])
    expect(runCommandLine('exit', state, context).outcomes[0].effect).toEqual({ kind: 'exit' })
  })

  it('answers help with the Tier 1 to 3 names and none of the eggs', () => {
    const sudo: EasterEgg = {
      kind: 'command',
      lines: [[{ text: 'no' }]],
      name: 'sudo',
    }
    const eggContext = { ...context, eggs: [sudo] }

    const help = runCommandLine('help', state, eggContext).outcomes[0].lines.map(textOf).join('\n')
    expect(help).toContain('cat')
    expect(help).toContain('open')
    expect(help).not.toContain('sudo')
    expect(firstLine(runCommandLine('sudo rm -rf /', state, eggContext))).toBe('no')
    expect(runCommandLine('sudo', state, eggContext).outcomes[0].lines.map(textOf)).toEqual(['no'])
  })

  it('never prints an empty name for git or man with no word after them', () => {
    expect(firstLine(runCommandLine('git', state, context))).toBe('usage: git log')
    expect(firstLine(runCommandLine('man', state, context))).toBe('What manual page do you want?')
    expect(runCommandLine('man', state, context).state.lastExitStatus).toBe(1)
  })

  it('prints git log, date and uname from the context', () => {
    expect(
      runCommandLine('git log', state, {
        ...context,
        gitLog: ['abc1234 feat: x'],
      }).outcomes[0].lines.map(textOf),
    ).toEqual(['abc1234 feat: x'])
    expect(firstLine(runCommandLine('uname', state, context))).toBe('Linux')
    expect(firstLine(runCommandLine('date', state, context))).toMatch(
      /^Fri Nov  6 14:42:07 \S+ 2026$/,
    )
  })
})
