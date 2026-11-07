import { describe, expect, it } from 'vitest'

import { buildSections } from '@/components/Terminal/buildSections'
import { checkEasterEggs } from '@/components/Terminal/shell/checkEasterEggs'
import { buildFileSystem } from '@/components/Terminal/shell/fakeFileSystem'
import { runCommandLine } from '@/components/Terminal/shell/runCommandLine'
import type { ShellContext, ShellState } from '@/components/Terminal/shell/types'
import { FRESH_SHELL_EXIT_STATUS, terminalEasterEggs } from '@/data/terminalEasterEggs'
import type { OutputLine } from '@/data/terminalEasterEggs'

const RICK_ROLL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const WIDE_WINDOW_COLUMNS = 95
const NARROW_WINDOW_COLUMNS = 18

const state: ShellState = { cwd: '~/portfolio', history: [], lastExitStatus: 0 }
const context: ShellContext = {
  columns: WIDE_WINDOW_COLUMNS,
  eggs: terminalEasterEggs,
  gitLog: [],
  isDark: () => true,
  now: () => new Date(2026, 10, 6),
  root: buildFileSystem(buildSections(), terminalEasterEggs),
}

function textOf(line: OutputLine): string {
  return line.map((segment) => segment.text).join('')
}

describe('the easter eggs', () => {
  // Whatever is added keeps to the rules the shell relies on: no name of the table's, no duplicate,
  // no em or en dash, art that fits its columns, files with a place to live.
  it('follow the rules the shell relies on', () => {
    expect(checkEasterEggs(terminalEasterEggs)).toEqual([])
  })

  it.each([
    ['link', "It's dangerous to go alone! Take this."],
    ['guns', '87 bazillion'],
  ])('%s prints its drawing with its line under it, and hides from help', (name, line) => {
    const { outcomes } = runCommandLine(name, state, context)

    expect(outcomes[0].art?.length).toBeGreaterThan(5)
    expect(outcomes[0].lines.map(textOf)).toEqual([line])
    const help = runCommandLine('help', state, context).outcomes[0].lines.map(textOf).join('\n')
    // As a whole word, because `help` does mention `linkedin`.
    expect(help).not.toMatch(new RegExp(`\\b${name}\\b`))
  })

  it.each([
    ['link', "It's dangerous to go alone! Take this."],
    ['guns', '87 bazillion'],
  ])('%s keeps its line when the window is too narrow for the drawing', (name, line) => {
    const { outcomes } = runCommandLine(name, state, { ...context, columns: NARROW_WINDOW_COLUMNS })

    expect(outcomes[0].art).toBeUndefined()
    expect(outcomes[0].lines.map(textOf)).toEqual([line])
  })

  it.each(['triforce', 'vault'])('%s no longer has a command of its own', (name) => {
    expect(runCommandLine(name, state, context).state.lastExitStatus).toBe(127)
  })

  it('answers sudo as plain bash would, whatever follows it, and opens the Rick Roll', () => {
    const { outcomes, state: next } = runCommandLine('sudo rm -rf /', state, context)

    expect(outcomes[0].lines.map(textOf)).toEqual(['bash: sudo: command not found'])
    expect(outcomes[0].effect).toEqual({ href: RICK_ROLL, kind: 'open-url' })
    expect(next.lastExitStatus).toBe(127)
  })

  // Word for word as Zack chose them on 2026-11-06, so an edit here is a decision, not a slip.
  it.each([
    ['abed', 'Cool. Cool cool cool.'],
    ['amos', 'I am that guy.'],
    ['basic', 'Ya basic!'],
    ['beltalowda', 'Beltalowda!'],
    ['challenge', 'Challenge accepted.'],
    ['claptrap', 'Minion!'],
    ['greendale', "You're already accepted!"],
    ['pop', 'Pop pop!'],
    ['troy', 'Troy and Abed in the morning!'],
    ['true', 'True story.'],
    ['tyrell', 'Bonsoir, Elliot.'],
    ['xyzzy', 'Nothing happens.'],
    ['cant', 'Remember the Cant.'],
    ['choom', 'preem'],
    ['compress', 'Weissman score: 5.2'],
    ['fade', 'Never fade away.'],
    ['fork', 'Holy forking shirt!'],
    ['guns', '87 bazillion'],
    ['janet', 'Hi there!'],
    ['link', "It's dangerous to go alone! Take this."],
    ['listen', 'Hey! Listen!'],
    ['logout', 'So long, and thanks for all the fish.'],
    ['miller', "Doors and corners, kid. That's where they get you."],
    ['mission', 'Making the world a better place.'],
    ['news', 'Exciting times in the world right now… exciting times…'],
    ['panic', "Don't Panic."],
    ['qwerty', "><(((('>"],
    [
      'rare',
      "It's a rare occurrence, like... like a double rainbow, or someone on the Internet saying, 'You know what? You've convinced me I was wrong.'",
    ],
    ['renew', 'Six seasons and a movie!'],
    ['samurai', 'Wake up, Samurai. We have a city to burn.'],
    ['secret', "It's a secret to everybody."],
    ['seefood hotdog', 'Not hotdog'],
    ['stairs', 'How did you know stairs were my only weakness?!'],
    ['suit', 'Suit up!'],
    ['ted', 'Have you met Ted?'],
    ['timeline', 'This is the darkest timeline.'],
    ['whatis earth', 'Mostly harmless.'],
  ])('%s prints its line', (line, printed) => {
    expect(runCommandLine(line, state, context).outcomes[0].lines.map(textOf)).toEqual([printed])
  })

  it.each([
    ['cat /etc/motd', 'Welcome! Everything is fine.'],
    ['cat ~/fsociety00.dat', 'LEAVE ME HERE'],
  ])('%s prints what the file holds', (line, printed) => {
    expect(runCommandLine(line, state, context).outcomes[0].lines.map(textOf)).toEqual([printed])
  })

  it('leaves the two hidden places to be found by looking', () => {
    const home = runCommandLine('ls ~', state, context).outcomes[0].listing
    expect(home).toEqual(['fsociety00.dat', 'portfolio/'])
    expect(runCommandLine('ls', state, context).outcomes[0].listing).not.toContain('.yougottagive')
    expect(runCommandLine('ls -a', state, context).outcomes[0].listing).toContain('.yougottagive')
  })

  it('legen holds its ending back for a real pause', () => {
    const [outcome] = runCommandLine('legen', state, context).outcomes

    expect(outcome.lines.map(textOf)).toEqual(['wait for it...'])
    expect(outcome.pausedEnding?.text).toBe(' dary!')
    expect(outcome.pausedEnding?.afterMilliseconds).toBeGreaterThan(0)
  })

  it('bitcoin warns and asks first, and only a yes plays it', () => {
    const [asked] = runCommandLine('bitcoin', state, context).outcomes

    expect(asked.lines).toEqual([])
    expect(asked.effect).toBeUndefined()
    expect(asked.asks?.isSecret).toBe(false)
    expect(asked.asks?.label).toBe('Warning: this is loud. Play it? [y/N]')
    const yes = asked.asks?.answer('y')
    expect(yes?.effect).toEqual({ kind: 'play-video', videoId: '9Z1IGjr2cT0' })
    expect(yes?.lines.map(textOf)).toEqual(['ALERT: the price of Bitcoin has changed.'])
    for (const declined of ['', 'n', 'no', 'maybe']) {
      expect(asked.asks?.answer(declined).effect).toBeUndefined()
      expect(asked.asks?.answer(declined).lines).toEqual([])
    }
    expect(asked.asks?.answer('YES').effect).toBeDefined()
  })

  it('.yougottagive asks for a password, doubts it twice, jokes, and lets them in', () => {
    const [password] = runCommandLine('cat .yougottagive', state, context).outcomes

    expect(password.lines).toEqual([])
    expect(password.asks?.isSecret).toBe(true)
    expect(password.asks?.label).toBe('Password:')
    for (const guess of ['', 'hunter2']) {
      const firstDoubt = password.asks?.answer(guess)
      expect(firstDoubt?.lines).toEqual([])
      expect(firstDoubt?.asks?.isSecret).toBe(true)
      expect(firstDoubt?.asks?.label).toBe('Are you sure about that?')

      const secondDoubt = firstDoubt?.asks?.answer(guess)
      expect(secondDoubt?.lines).toEqual([])
      expect(secondDoubt?.asks?.isSecret).toBe(true)
      expect(secondDoubt?.asks?.label).toBe('Are you sure about that?')

      const letIn = secondDoubt?.asks?.answer(guess)
      expect(letIn?.asks).toBeUndefined()
      expect(letIn?.lines).toEqual([
        [{ text: "I'm joking. I'm joking" }],
        [{ href: 'https://getcalicocutpants.com/', text: 'https://getcalicocutpants.com/' }],
      ])
    }
  })

  it('starts a fresh shell at 42', () => {
    expect(FRESH_SHELL_EXIT_STATUS).toBe(42)
  })
})
