import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildSections } from '@/components/Terminal/buildSections'
import { CommandClock } from '@/components/Terminal/engine/commandClock'
import { buildFileSystem } from '@/components/Terminal/shell/fakeFileSystem'
import { SESSION_OUTPUT_ATTRIBUTE } from '@/components/Terminal/shell/SessionOutput'
import { Shell } from '@/components/Terminal/shell/Shell'
import type { ShellHost } from '@/components/Terminal/shell/Shell'
import type { EasterEgg } from '@/data/terminalEasterEggs'

const sections = buildSections()

describe('Shell', () => {
  let scroller: HTMLElement
  let typed: HTMLElement
  let block: HTMLElement
  let host: ShellHost
  let shell: Shell
  let cwd: string

  const press = (key: string) => {
    scroller.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key }))
  }
  const submit = (line: string) => {
    for (const character of line) {
      press(character)
    }
    press('Enter')
  }
  const container = (): HTMLElement => {
    const found = document.querySelector<HTMLElement>(`[${SESSION_OUTPUT_ATTRIBUTE}]`)
    if (!found) {
      throw new Error('No session container on the page')
    }
    return found
  }
  const childTexts = () => [...container().children].map((child) => child.textContent)

  beforeEach(() => {
    document.body.replaceChildren()
    document.documentElement.classList.add('dark')
    cwd = '~/portfolio'
    scroller = document.createElement('main')
    scroller.tabIndex = 0
    const scene = document.createElement('section')
    scene.dataset.scene = 'about'
    const output = document.createElement('div')
    output.className = 'terminal-output'
    block = document.createElement('div')
    block.className = 'terminal-block'
    block.dataset.block = 'about-0'
    block.textContent = 'Last updated: 2026'
    const card = document.createElement('div')
    card.className = 'terminal-block'
    card.dataset.block = 'work-2'
    card.textContent = 'Teampay'
    output.append(block, card)
    scene.append(output)
    scroller.append(scene)
    typed = document.createElement('span')
    document.body.append(scroller, typed)

    host = {
      bottomInScene: vi.fn(() => 100),
      clock: new CommandClock(),
      currentBlock: () => block,
      cwd: () => cwd,
      followOutput: vi.fn(),
      isBusy: () => false,
      landOnHero: vi.fn((done: () => void) => done()),
      measureColumns: () => 80,
      openResumeWindow: vi.fn(),
      printAppended: vi.fn((_: number, done: () => void) => done()),
      promptLineCapacity: () => 80,
      requestPlainView: vi.fn(),
      runBusy: vi.fn((work: (done: () => void) => void) => work(() => undefined)),
      setCwd: vi.fn((next: string) => {
        cwd = next
      }),
      usableHeight: () => 640,
    }
    shell = new Shell({
      context: {
        eggs: [{ kind: 'command', lines: [[{ text: 'no' }]], name: 'sudo' }],
        gitLog: ['abc1234 feat: typed commands'],
        root: buildFileSystem(sections, []),
      },
      elements: { scroller, typed },
      host,
    })
    scroller.addEventListener('keydown', (event) => {
      shell.handleKey(event)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('echoes the typed line, then its output, into the container after the current block', () => {
    submit('pwd')

    expect(block.nextElementSibling).toBe(container())
    expect(childTexts()).toEqual(['~/portfolio $ pwd', '/home/zack/portfolio'])
    expect(host.runBusy).toHaveBeenCalledOnce()
    expect(host.printAppended).toHaveBeenCalledWith(100, expect.any(Function))
    expect(typed.textContent).toBe('')
  })

  it("does not echo the tour's commands, and history holds both", () => {
    shell.recordTourCommand('whoami')
    submit('history')

    expect(childTexts()).toEqual(['~/portfolio $ history', '    1  whoami', '    2  history'])
  })

  it('renders a listing, a clone and art each in its own markup', () => {
    submit('ls')
    expect(container().querySelector('.terminal-listing')?.textContent).toContain(
      'developer.profile',
    )

    submit('cat work_experience/teampay.txt')
    const clone = container().lastElementChild
    expect(clone?.textContent).toBe('Teampay')
    expect(clone?.hasAttribute('data-block')).toBe(false)
    expect(document.querySelectorAll('[data-block="work-2"]')).toHaveLength(1)
  })

  it('applies effects to the host, never to a typed address', () => {
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)

    submit('open github')
    expect(windowOpen).toHaveBeenCalledWith(
      'https://github.com/ZackKuptsow',
      '_blank',
      'noopener,noreferrer',
    )
    submit('open https://evil.example')
    expect(windowOpen).toHaveBeenCalledOnce()

    submit('sh get_resume.sh')
    expect(host.openResumeWindow).toHaveBeenCalledOnce()

    submit('theme light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    submit('cd education')
    expect(host.setCwd).toHaveBeenCalledWith('~/portfolio/education')
    expect(childTexts().at(-1)).toBe('~/portfolio $ cd education')

    submit('plain')
    expect(host.requestPlainView).toHaveBeenCalledOnce()

    submit('exit')
    expect(host.landOnHero).toHaveBeenCalledOnce()
  })

  it('plays the download into the container, following it as it grows', async () => {
    vi.useFakeTimers()
    submit('wget kups.me/get_resume.sh')

    expect(host.runBusy).toHaveBeenCalledOnce()
    const download = container().querySelector('.terminal-download')
    expect(download).not.toBeNull()
    await vi.runAllTimersAsync()
    expect(download?.textContent).toContain("'get_resume.sh' saved")
    expect(host.followOutput).toHaveBeenCalled()
    expect(host.openResumeWindow).not.toHaveBeenCalled()
  })

  it('clears to a blank screen, and removes everything when the screen changes', () => {
    submit('ls')
    submit('clear')
    expect(container().lastElementChild?.classList.contains('terminal-session-blank')).toBe(true)
    expect((container().lastElementChild as HTMLElement).style.height).toBe('640px')

    expect(shell.onScreenChanged()).toBe(true)
    expect(document.querySelector(`[${SESSION_OUTPUT_ATTRIBUTE}]`)).toBeNull()
    expect(shell.onScreenChanged()).toBe(false)
  })

  it('prints nothing through the blank of a clear, and what follows it from below the blank', () => {
    host.bottomInScene = vi.fn((element: HTMLElement) => element.children.length * 100)

    submit('clear')
    // The echoed line and the blank are both there when printing starts, so the blank is not streamed.
    expect(host.printAppended).toHaveBeenLastCalledWith(200, expect.any(Function))

    submit('clear && pwd')
    // Two more for this line's echo and blank, and then `pwd` prints from below that blank.
    expect(host.printAppended).toHaveBeenLastCalledWith(400, expect.any(Function))
  })

  it('keeps a key typed while a command runs, swallows Enter, and shows the line once it has landed', () => {
    host.isBusy = () => true
    press('l')
    expect(typed.textContent).toBe('l')
    press('Enter')
    expect(host.runBusy).not.toHaveBeenCalled()
    typed.textContent = ''
    shell.onCommandFinished()
    expect(typed.textContent).toBe('l')
    press('Escape')

    host.isBusy = () => false
  })

  it('types nothing from a focused control inside the scroller', () => {
    const link = document.createElement('a')
    link.href = 'https://example.com/'
    scroller.append(link)
    link.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'l' }))
    expect(typed.textContent).toBe('')
  })

  it('completes a folder name, and never an egg', () => {
    submit('sudo make me a sandwich')
    expect(childTexts().at(-1)).toBe('no')

    for (const character of 'cd wo') press(character)
    press('Tab')
    expect(typed.textContent).toBe('cd work_experience/')
    press('Escape')
    for (const character of 'su') press(character)
    press('Tab')
    expect(typed.textContent).toBe('su')
  })

  it('prints 42 for the first echo of the exit status, and the truth once anything has run', () => {
    submit('echo $?')
    expect(childTexts().at(-1)).toBe('42')

    submit('echo $?')
    expect(childTexts().at(-1)).toBe('0')

    submit('nope')
    submit('echo $?')
    expect(childTexts().at(-1)).toBe('127')
  })

  describe('a question', () => {
    const SECRET_FILE: EasterEgg = {
      kind: 'file',
      lines: [[{ text: 'let in' }]],
      password: { doubts: ['Are you sure about that?'], ending: 'Joking.', label: 'Password:' },
      path: '~/portfolio/.gate',
    }
    const CONFIRM: EasterEgg = {
      confirm: 'Loud. Play it? [y/N]',
      kind: 'command',
      lines: [[{ text: 'alert' }]],
      name: 'special',
      opens: 'https://example.com/',
    }

    beforeEach(() => {
      shell = new Shell({
        context: {
          eggs: [SECRET_FILE, CONFIRM],
          gitLog: [],
          root: buildFileSystem(sections, [SECRET_FILE]),
        },
        elements: { scroller, typed },
        host,
      })
    })

    it('takes a password without showing, echoing or keeping it, and then lets them in', () => {
      submit('cat .gate')
      expect(childTexts().at(-1)).toBe('Password:')

      submit('hunter2')

      expect(typed.textContent).toBe('')
      expect(childTexts().at(-1)).toBe('Are you sure about that?')

      // Someone may type the same thing again here, so this answer is hidden too.
      for (const character of 'hunter2') {
        press(character)
      }
      expect(typed.textContent).toBe('')
      press('Enter')

      expect(childTexts().slice(-2)).toEqual(['Joking.', 'let in'])
      expect(document.body.textContent).not.toContain('hunter2')

      submit('history')
      expect(document.body.textContent).not.toContain('hunter2')
      expect(childTexts().filter((text) => text?.includes('cat .gate'))).toHaveLength(2)

      // Nor can the arrow keys bring it back.
      press('x')
      press('ArrowUp')
      expect(typed.textContent).toBe('history')
      press('ArrowUp')
      expect(typed.textContent).toBe('cat .gate')
      press('ArrowUp')
      expect(typed.textContent).toBe('cat .gate')
    })

    it('hides what is typed from the first key, even while the question is still printing', () => {
      host.printAppended = vi.fn()
      submit('cat .gate')
      expect(host.printAppended).toHaveBeenCalledOnce()
      host.isBusy = () => true

      for (const character of 'hunter2') {
        press(character)
      }

      expect(typed.textContent).toBe('')
    })

    it('runs the next line as a command once the question is given up', () => {
      submit('cat .gate')
      press('s')
      press('Escape')
      expect(typed.textContent).toBe('')

      submit('whoami')

      expect(childTexts().slice(-1)).toEqual(['zachary.kuptsow'])
    })

    it('forgets the question when the tour moves on', () => {
      submit('cat .gate')
      shell.recordTourCommand('clear && cat developer.profile')

      submit('whoami')

      expect(childTexts().slice(-1)).toEqual(['zachary.kuptsow'])
    })

    it('opens the address on a yes within the same key press, and shows the answer', () => {
      const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)
      submit('special occasion')
      expect(windowOpen).not.toHaveBeenCalled()
      expect(childTexts().at(-1)).toBe('Loud. Play it? [y/N]')

      submit('y')

      expect(windowOpen).toHaveBeenCalledWith(
        'https://example.com/',
        '_blank',
        'noopener,noreferrer',
      )
      expect(childTexts().slice(-2)).toEqual(['Loud. Play it? [y/N] y', 'alert'])
    })

    it('does nothing on a no, or on Enter alone', () => {
      const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)
      submit('special')
      press('Enter')

      expect(windowOpen).not.toHaveBeenCalled()
      expect(childTexts().at(-1)).toBe('Loud. Play it? [y/N]')
    })

    it('finishes the rest of the line after the answer', () => {
      submit('cat .gate && whoami')
      expect(childTexts().at(-1)).toBe('Password:')

      submit('guess')
      expect(childTexts().at(-1)).toBe('Are you sure about that?')
      submit('guess')

      expect(childTexts().slice(-2)).toEqual(['let in', 'zachary.kuptsow'])
    })

    it('prints a drawing above its line', () => {
      const drawn: EasterEgg = {
        drawing: ['/\\'],
        kind: 'command',
        lines: [[{ text: 'under it' }]],
        name: 'drawn',
      }
      shell = new Shell({
        context: { eggs: [drawn], gitLog: [], root: buildFileSystem(sections, []) },
        elements: { scroller, typed },
        host,
      })

      submit('drawn')

      expect(childTexts().slice(-2)).toEqual(['/\\', 'under it'])
      expect(container().querySelector('pre')?.nextElementSibling?.textContent).toBe('under it')
    })
  })

  describe('an animation', () => {
    const ANIMATED: EasterEgg = {
      animation: {
        finalLine: 'three',
        frames: [
          { holdMilliseconds: 100, rows: ['one'] },
          { holdMilliseconds: 100, rows: ['two'] },
          { holdMilliseconds: 0, rows: ['three'] },
        ],
      },
      kind: 'command',
      lines: [],
      name: 'animated',
    }

    beforeEach(() => {
      shell = new Shell({
        context: { eggs: [ANIMATED], gitLog: [], root: buildFileSystem(sections, []) },
        elements: { scroller, typed },
        host,
      })
      vi.useFakeTimers()
    })

    const stage = () => container().querySelector('.terminal-session-art')

    it('plays its frames on the clock, and rests on the last', async () => {
      submit('animated')
      expect(stage()?.textContent).toBe('one')

      await vi.advanceTimersByTimeAsync(100)
      expect(stage()?.textContent).toBe('two')
      await vi.advanceTimersByTimeAsync(100)

      expect(stage()?.textContent).toBe('three')
      expect(host.followOutput).toHaveBeenCalled()
    })

    it('goes straight to the last frame when hurried', async () => {
      submit('animated')

      host.clock.fastForward()
      await vi.advanceTimersByTimeAsync(0)

      expect(stage()?.textContent).toBe('three')
    })

    it('hides the frames from a screen reader, and gives it the last line', async () => {
      submit('animated')
      await vi.advanceTimersByTimeAsync(200)

      expect(stage()?.getAttribute('aria-hidden')).toBe('true')
      expect(container().querySelector('.sr-only')?.textContent).toBe('three')
    })
  })

  describe('a video', () => {
    const SONG: EasterEgg = {
      kind: 'command',
      lines: [[{ text: 'playing' }]],
      name: 'song',
      plays: 'abc123',
    }
    const OTHER_SONG: EasterEgg = { ...SONG, name: 'other', plays: 'def456' }

    beforeEach(() => {
      shell = new Shell({
        context: { eggs: [SONG, OTHER_SONG], gitLog: [], root: buildFileSystem(sections, []) },
        elements: { scroller, typed },
        host,
      })
    })

    it('plays under its line, from its fixed address, with no cookies', () => {
      submit('song')

      const player = container().querySelector('iframe')
      expect(player?.getAttribute('src')).toBe(
        'https://www.youtube-nocookie.com/embed/abc123?autoplay=1',
      )
      expect(player?.getAttribute('allow')).toContain('autoplay')
      expect(player?.title).not.toBe('')
      expect(player?.previousElementSibling?.textContent).toBe('playing')
    })

    it('stops the last one when another starts', () => {
      submit('song')
      submit('other')

      const players = document.querySelectorAll('iframe')
      expect(players).toHaveLength(1)
      expect(players[0].getAttribute('src')).toContain('def456')
    })

    it('stops when the screen changes', () => {
      submit('song')

      shell.onScreenChanged()

      expect(document.querySelector('iframe')).toBeNull()
    })
  })

  describe('the prompt hint', () => {
    it('is spent by the first line typed', () => {
      expect(typed.hasAttribute('data-has-typed')).toBe(false)

      submit('pwd')

      expect(typed.hasAttribute('data-has-typed')).toBe(true)
    })

    it('is not spent by the tour typing', () => {
      shell.recordTourCommand('whoami')

      expect(typed.hasAttribute('data-has-typed')).toBe(false)
    })
  })

  it('runs a line it is handed, as the menu asks, clearing what was half typed', () => {
    press('x')

    shell.runLine('pwd')

    expect(childTexts()).toEqual(['~/portfolio $ pwd', '/home/zack/portfolio'])
    expect(typed.textContent).toBe('')
  })

  describe('the Konami code', () => {
    const CODE = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ]

    it('prints its line, leaving nothing half typed', () => {
      for (const key of CODE) {
        press(key)
      }

      expect(childTexts()).toEqual(['+30 lives'])
      expect(typed.textContent).toBe('')
    })

    it('does nothing for a wrong key in the middle, and can start again', () => {
      for (const key of [...CODE.slice(0, 4), 'x', ...CODE.slice(4)]) {
        press(key)
      }
      expect(document.querySelector(`[${SESSION_OUTPUT_ATTRIBUTE}]`)).toBeNull()

      press('Escape')
      for (const key of CODE) {
        press(key)
      }
      expect(childTexts()).toEqual(['+30 lives'])
    })

    it('waits for a running command to finish', () => {
      host.isBusy = () => true
      for (const key of CODE) {
        press(key)
      }
      expect(document.querySelector(`[${SESSION_OUTPUT_ATTRIBUTE}]`)).toBeNull()

      host.isBusy = () => false
      shell.onCommandFinished()

      expect(childTexts()).toEqual(['+30 lives'])
    })
  })

  it('holds the ending of a line back for its pause, and a key hurries it', async () => {
    const PAUSED: EasterEgg = {
      kind: 'command',
      lines: [[{ text: 'wait for it...' }]],
      name: 'legen',
      pausedEnding: { afterMilliseconds: 2000, text: ' dary!' },
    }
    shell = new Shell({
      context: { eggs: [PAUSED], gitLog: [], root: buildFileSystem(sections, []) },
      elements: { scroller, typed },
      host,
    })
    vi.useFakeTimers()

    submit('legen')
    expect(childTexts().at(-1)).toBe('wait for it...')

    await vi.advanceTimersByTimeAsync(1999)
    expect(childTexts().at(-1)).toBe('wait for it...')
    await vi.advanceTimersByTimeAsync(1)

    expect(childTexts().at(-1)).toBe('wait for it... dary!')
    expect(host.followOutput).toHaveBeenCalled()
  })

  it('sends nothing and stores nothing', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const storage = vi.spyOn(Storage.prototype, 'setItem')

    submit('echo hi && ls -a && cat developer.profile && foo')

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storage).not.toHaveBeenCalled()
    expect(childTexts().at(-1)).toBe('bash: foo: command not found')
  })

  it('keeps every prompt symbol it writes aria-hidden', () => {
    submit('pwd')
    for (const symbol of container().querySelectorAll('.command-prompt')) {
      expect(symbol.closest('[aria-hidden="true"]')).not.toBeNull()
    }
    expect(container().querySelectorAll('.command-prompt')).toHaveLength(1)
  })
})
