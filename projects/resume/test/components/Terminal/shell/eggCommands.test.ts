import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildSections } from '@/components/Terminal/buildSections'
import { buildFileSystem, findNode, listFolder } from '@/components/Terminal/shell/fakeFileSystem'
import { runCommandLine } from '@/components/Terminal/shell/runCommandLine'
import type { ShellContext, ShellState } from '@/components/Terminal/shell/types'
import { terminalEasterEggs } from '@/data/terminalEasterEggs'
import type { OutputLine } from '@/data/terminalEasterEggs'

const WIDE_WINDOW_COLUMNS = 95
const NARROW_WINDOW_COLUMNS = 18

const state: ShellState = { cwd: '~/portfolio', history: [], lastExitStatus: 0 }
const root = buildFileSystem(buildSections(), terminalEasterEggs)
const context: ShellContext = {
  columns: WIDE_WINDOW_COLUMNS,
  eggs: terminalEasterEggs,
  gitLog: [],
  isDark: () => true,
  now: () => new Date(2026, 10, 6),
  root,
}

function textOf(line: OutputLine): string {
  return line.map((segment) => segment.text).join('')
}

function printed(line: string, from: ShellState = state): readonly string[] {
  return runCommandLine(line, from, context).outcomes[0].lines.map(textOf)
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the drawings with their lines', () => {
  it.each(['stairs', 'suit'])('%s prints a drawing above its line', (name) => {
    const [outcome] = runCommandLine(name, state, context).outcomes

    expect(outcome.art?.length).toBeGreaterThan(5)
    expect(outcome.lines).toHaveLength(1)
  })

  it('special occasion is the cigarette alone, with no song and no question', () => {
    const [outcome] = runCommandLine('special occasion', state, context).outcomes

    expect(outcome.art?.join('\n')).toContain('|::::|')
    expect(outcome.lines).toEqual([])
    expect(outcome.effect).toBeUndefined()
    expect(outcome.asks).toBeUndefined()
  })

  it('special says so when the window cannot hold the cigarette', () => {
    expect(
      runCommandLine('special', state, {
        ...context,
        columns: NARROW_WINDOW_COLUMNS,
      }).outcomes[0].lines.map(textOf),
    ).toEqual(['special: window too narrow'])
  })
})

describe('the songs', () => {
  it('fade plays its song in the output', () => {
    const [outcome] = runCommandLine('fade', state, context).outcomes

    expect(outcome.lines.map(textOf)).toEqual(['Never fade away.'])
    expect(outcome.effect).toEqual({ kind: 'play-video', videoId: 'KvMY1uzSC1E' })
  })

  it('bitcoin plays its song in the output, only on a yes', () => {
    const [asked] = runCommandLine('bitcoin', state, context).outcomes

    expect(asked.effect).toBeUndefined()
    expect(asked.asks?.answer('y').effect).toEqual({ kind: 'play-video', videoId: '9Z1IGjr2cT0' })
    expect(asked.asks?.answer('').effect).toBeUndefined()
  })
})

describe('the animations', () => {
  it('encrypt loses the dot, and decrypt gets it back', () => {
    const line = "Just dotted the I's, crossed the T's, and every single detail is....perfect,"
    const losing = runCommandLine('encrypt', state, context).outcomes[0]
    const finding = runCommandLine('decrypt', state, context).outcomes[0]

    expect(losing.animation?.frames[0].rows[0]).toBe(line)
    expect(losing.animation?.finalLine).toBe(line.replace('....', '...'))
    expect(finding.animation?.finalLine).toBe(line)
    expect(printed('encrypt')).toEqual([])
  })

  it('a window too narrow for an animation gets its last line, with no frames', () => {
    const [outcome] = runCommandLine('encrypt', state, {
      ...context,
      columns: NARROW_WINDOW_COLUMNS,
    }).outcomes

    expect(outcome.animation).toBeUndefined()
    expect(outcome.lines.map(textOf)).toEqual([
      "Just dotted the I's, crossed the T's, and every single detail is...perfect,",
    ])
  })

  it('deepthought counts down, ends on 42, and exits 42', () => {
    const { outcomes, state: next } = runCommandLine('deepthought', state, context)

    expect(outcomes[0].animation?.finalLine).toBe('42')
    expect(outcomes[0].animation?.frames[0].rows[0]).toContain('7,500,000 years remaining')
    expect(next.lastExitStatus).toBe(42)
  })

  it('chest makes them wait, and then gives them the sword', () => {
    const { frames, finalLine } = runCommandLine('chest', state, context).outcomes[0].animation ?? {
      finalLine: '',
      frames: [],
    }

    expect(finalLine).toBe('You got the Master Sword!')
    expect(frames[0].rows[0].trim()).toBe('')
    expect(frames[0].holdMilliseconds).toBeGreaterThanOrEqual(1000)
  })

  it('fuxsocy runs its bar to the end, and breach ends on the upload', () => {
    expect(
      runCommandLine('fuxsocy', state, context).outcomes[0].animation?.frames.at(-1)?.rows,
    ).toContain('[====================] 100%')
    expect(runCommandLine('breach', state, context).outcomes[0].animation?.finalLine).toBe(
      'Daemon uploaded.',
    )
  })

  it('sl carries the train across and off the screen', () => {
    const frames = runCommandLine('sl', state, context).outcomes[0].animation?.frames ?? []

    expect(frames.length).toBeGreaterThan(20)
    expect(frames[0].rows.join('').trim()).toBe('')
    expect(frames[Math.floor(frames.length / 2)].rows.join('').trim()).not.toBe('')
    expect(frames.at(-1)?.rows.join('').trim()).toBe('')
  })
})

describe('ping', () => {
  it('reaches Ceres with real light lag', () => {
    const animation = runCommandLine('ping ceres', state, context).outcomes[0].animation
    const rows = animation?.frames.at(-1)?.rows.join('\n')

    expect(rows).toContain('PING ceres')
    expect(rows).toContain('icmp_seq=1')
    expect(rows).toContain('time=2494000 ms')
    expect(animation?.frames[1].holdMilliseconds).toBeGreaterThanOrEqual(1000)
  })

  it('answers as real ping does for anywhere else, and for nowhere', () => {
    const elsewhere = runCommandLine('ping kups.me', state, context)
    expect(elsewhere.outcomes[0].animation).toBeUndefined()
    expect(elsewhere.outcomes[0].lines.map(textOf)).toEqual([
      'ping: kups.me: Name or service not known',
    ])
    expect(elsewhere.state.lastExitStatus).toBe(2)
    expect(printed('ping')).toEqual(['ping: usage error: Destination address required'])
  })
})

describe('the questions', () => {
  it('tabs takes any answer, and the answer is tabs', () => {
    const [asked] = runCommandLine('tabs', state, context).outcomes

    expect(asked.asks?.label).toBe('Tabs or spaces?')
    expect(asked.asks?.isSecret).toBe(false)
    for (const answer of ['spaces', 'tabs', '']) {
      expect(asked.asks?.answer(answer).lines.map(textOf)).toEqual(['Tabs.'])
    }
  })

  it('chidi asks again, whatever the answer', () => {
    const [asked] = runCommandLine('chidi', state, context).outcomes

    expect(asked.asks?.label).toBe('Are you sure? [y/N]')
    const again = asked.asks?.answer('y')
    expect(again?.asks?.label).toBe('Are you sure? [y/N]')
    expect(again?.asks?.answer('n').asks?.label).toBe('Are you sure? [y/N]')
  })
})

describe('the random ones', () => {
  it('loot finds a gun, a different one by chance', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const first = printed('loot')
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const last = printed('loot')

    expect(first).toHaveLength(1)
    expect(first[0]).toMatch(/^You found: /)
    expect(last).not.toEqual(first)
  })

  it('fortune only ever prints a line a command already has', () => {
    const known = terminalEasterEggs.flatMap((egg) =>
      egg.kind === 'command' ? egg.lines.map(textOf) : [],
    )
    for (const chance of [0, 0.25, 0.5, 0.75, 0.99]) {
      vi.spyOn(Math, 'random').mockReturnValue(chance)
      expect(known).toContain(printed('fortune')[0])
    }
  })

  it('fortune never gives away sudo, or the warning', () => {
    const lines = new Set<string>()
    for (let chance = 0; chance < 1; chance += 0.005) {
      vi.spyOn(Math, 'random').mockReturnValue(chance)
      lines.add(printed('fortune')[0])
    }

    expect(lines.size).toBeGreaterThan(10)
    expect(lines).not.toContain('bash: sudo: command not found')
    expect(lines).not.toContain('ALERT: the price of Bitcoin has changed.')
  })
})

describe('the guidance', () => {
  it('help ends by pointing at /usr/games, and lists hint', () => {
    const lines = printed('help')

    expect(lines.at(-1)).toBe("There's more in /usr/games")
    expect(lines.join('\n')).toContain('hint')
  })

  it('/usr/games lists the hidden commands, and leaves sudo where it is a surprise', () => {
    const games = findNode(root, '/usr/games')
    if (!games || games.kind !== 'folder') {
      throw new Error('There is no /usr/games')
    }
    const names = listFolder(games, { showHidden: false })

    expect(names).toEqual(expect.arrayContaining(['bitcoin', 'fortune', 'guns', 'link', 'sl']))
    expect(names).not.toContain('sudo')
    expect(printed('ls /usr/games')).toEqual([])
  })

  it('which knows where each one lives', () => {
    expect(printed('which link')).toEqual(['/usr/games/link'])
    expect(printed('which fortune')).toEqual(['/usr/games/fortune'])
    expect(printed('which sudo')).toEqual(['/usr/bin/sudo'])
    expect(printed('which ls')).toEqual(['/usr/bin/ls'])
  })

  it('a game runs by its path too', () => {
    expect(printed('/usr/games/panic')).toEqual(["Don't Panic."])
    expect(printed('./panic', { ...state, cwd: '/usr/games' })).toEqual(["Don't Panic."])
    expect(printed('/usr/games/nope')).toEqual(['bash: /usr/games/nope: No such file or directory'])
  })

  it('hint names a command not tried yet, and never sudo', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const [first] = printed('hint')
    expect(first).toMatch(/^Try: \S/)

    const firstName = first.replace('Try: ', '').split(' ')[0]
    const [next] = printed('hint', { ...state, history: [firstName] })
    expect(next).not.toBe(first)

    for (let chance = 0; chance < 1; chance += 0.01) {
      vi.spyOn(Math, 'random').mockReturnValue(chance)
      expect(printed('hint')[0]).not.toContain('sudo')
    }
  })

  it('hint names what ping needs to work', () => {
    const everythingButPing = terminalEasterEggs.flatMap((egg) =>
      egg.kind === 'command' && egg.name !== 'ping' ? [egg.name] : [],
    )

    expect(printed('hint', { ...state, history: everythingButPing })).toEqual(['Try: ping ceres'])
  })

  it('hint says so once everything has been tried', () => {
    const everything = terminalEasterEggs.flatMap((egg) =>
      egg.kind === 'command' ? [egg.name] : [],
    )

    expect(printed('hint', { ...state, history: everything })).toEqual(['You found them all.'])
  })
})
