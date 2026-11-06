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

  it.each(['triforce', 'vault'])('draws %s by name, and hides from help', (name) => {
    const { outcomes } = runCommandLine(name, state, context)

    expect(outcomes[0].art?.length).toBeGreaterThan(5)
    expect(outcomes[0].lines).toEqual([])
    const help = runCommandLine('help', state, context).outcomes[0].lines.map(textOf).join('\n')
    expect(help).not.toContain(name)
  })

  it.each(['triforce', 'vault'])('says %s needs a wider window, in a tool error shape', (name) => {
    const { outcomes } = runCommandLine(name, state, { ...context, columns: NARROW_WINDOW_COLUMNS })

    expect(outcomes[0].art).toBeUndefined()
    expect(outcomes[0].lines.map(textOf)).toEqual([`${name}: window too narrow`])
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
    ['beltalowda', 'Beltalowda!'],
    ['cant', 'Remember the Cant.'],
    ['choom', 'preem'],
    ['compress', 'Weissman score: 5.2'],
    ['decrypt', 'Was and is....'],
    ['encrypt', 'Was and is....'],
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

  it('fade opens the song, by its official upload', () => {
    expect(runCommandLine('fade', state, context).outcomes[0].effect).toEqual({
      href: 'https://www.youtube.com/watch?v=KvMY1uzSC1E',
      kind: 'open-url',
    })
  })

  it('legen holds its ending back for a real pause', () => {
    const [outcome] = runCommandLine('legen', state, context).outcomes

    expect(outcome.lines.map(textOf)).toEqual(['wait for it...'])
    expect(outcome.pausedEnding?.text).toBe(' dary!')
    expect(outcome.pausedEnding?.afterMilliseconds).toBeGreaterThan(0)
  })

  it('special occasion warns and asks first, and only a yes plays it', () => {
    const [asked] = runCommandLine('special occasion', state, context).outcomes

    expect(asked.lines).toEqual([])
    expect(asked.effect).toBeUndefined()
    expect(asked.asks?.isSecret).toBe(false)
    expect(asked.asks?.label).toBe('Warning: this is loud. Play it? [y/N]')
    const yes = asked.asks?.answer('y')
    expect(yes?.effect).toEqual({
      href: 'https://www.youtube.com/watch?v=9Z1IGjr2cT0',
      kind: 'open-url',
    })
    expect(yes?.lines.map(textOf)).toEqual(['ALERT: the price of Bitcoin has changed.'])
    for (const declined of ['', 'n', 'no', 'maybe']) {
      expect(asked.asks?.answer(declined).effect).toBeUndefined()
      expect(asked.asks?.answer(declined).lines).toEqual([])
    }
    expect(asked.asks?.answer('YES').effect).toBeDefined()
  })

  it('.yougottagive asks for a password, doubts any guess, and lets them in', () => {
    const [asked] = runCommandLine('cat .yougottagive', state, context).outcomes

    expect(asked.lines).toEqual([])
    expect(asked.asks?.isSecret).toBe(true)
    expect(asked.asks?.label).toBe('Password:')
    for (const guess of ['', 'hunter2']) {
      expect(asked.asks?.answer(guess).lines).toEqual([
        [{ text: 'Are you sure about that?' }],
        [{ href: 'https://getcalicocutpants.com/', text: 'https://getcalicocutpants.com/' }],
      ])
    }
  })

  it('starts a fresh shell at 42', () => {
    expect(FRESH_SHELL_EXIT_STATUS).toBe(42)
  })
})
