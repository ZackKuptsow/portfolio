import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DOWNLOAD_BAR_NARROW_CHARACTERS,
  DOWNLOAD_BAR_SMALLEST_CHARACTERS,
  DOWNLOAD_BAR_WIDE_CHARACTERS,
  ENTER_PAUSE_MILLISECONDS,
  OUTPUT_LINE_MILLISECONDS,
  OUTPUT_TICK_MILLISECONDS,
  OUTPUT_TOTAL_MILLISECONDS,
  TYPING_SLOWEST_CHARACTER_MILLISECONDS,
  TYPING_TOTAL_MILLISECONDS,
} from '@/components/Terminal/constants'
import { CommandClock } from '@/components/Terminal/engine/commandClock'
import {
  chooseDownloadBar,
  drawDownloadBar,
  formatDownloadStamp,
  playDownload,
} from '@/components/Terminal/engine/playDownload'
import { streamOutput } from '@/components/Terminal/engine/streamOutput'
import { typeCommand } from '@/components/Terminal/engine/typeCommand'

const COMMAND = 'clear && cd ./work_experience && ls'
// DESIGN.md: the download takes about 6.5 seconds from the scroll point. The command and the Enter
// pause take about 2.2 of those, so this is what the download itself should take.
const DOWNLOAD_SHORTEST_MILLISECONDS = 3_500
const DOWNLOAD_LONGEST_MILLISECONDS = 6_000
// A random jitter is pinned here, so a test is not flaky about it.
const MIDDLE_OF_THE_RANGE = 0.5

describe('the timed parts of a command', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(MIDDLE_OF_THE_RANGE)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('CommandClock', () => {
    it('runs a callback after its wait, and not before', () => {
      const clock = new CommandClock()
      const callback = vi.fn()

      clock.after(100, callback)

      vi.advanceTimersByTime(99)
      expect(callback).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(callback).toHaveBeenCalledOnce()
    })

    it('fast-forwards what is waiting at once, and then every later wait', () => {
      const clock = new CommandClock()
      const later = vi.fn()

      clock.after(100_000, () => clock.after(100_000, later))
      clock.fastForward()

      expect(later).toHaveBeenCalledOnce()
    })

    it('forgets what is waiting when reset, and is ready to wait again', () => {
      const clock = new CommandClock()
      const dropped = vi.fn()
      const next = vi.fn()

      clock.after(100, dropped)
      clock.reset()
      clock.after(50, next)
      vi.advanceTimersByTime(1_000)

      expect(dropped).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledOnce()
    })
  })

  describe('typeCommand', () => {
    it('types one character at a time, then presses Enter after a pause', () => {
      const clock = new CommandClock()
      const element = document.createElement('span')
      const onEntered = vi.fn()

      typeCommand({ clock, command: COMMAND, element, onEntered })
      expect(element.textContent).toBe('c')

      vi.advanceTimersByTime(TYPING_TOTAL_MILLISECONDS)
      expect(element.textContent).toBe(COMMAND)
      expect(onEntered).not.toHaveBeenCalled()

      vi.advanceTimersByTime(ENTER_PAUSE_MILLISECONDS)
      expect(onEntered).toHaveBeenCalledOnce()
    })

    it('finishes what is left when fast-forwarded, whatever the pause', () => {
      const clock = new CommandClock()
      const element = document.createElement('span')
      const onEntered = vi.fn()

      typeCommand({ clock, command: COMMAND, element, onEntered })
      clock.fastForward()

      expect(element.textContent).toBe(COMMAND)
      expect(onEntered).toHaveBeenCalledOnce()
    })

    it('takes no longer per character for a long command than the slowest allowed', () => {
      const clock = new CommandClock()
      const element = document.createElement('span')

      typeCommand({ clock, command: 'ls', element, onEntered: vi.fn() })
      vi.advanceTimersByTime(TYPING_SLOWEST_CHARACTER_MILLISECONDS)

      expect(element.textContent).toBe('ls')
    })
  })

  describe('streamOutput', () => {
    const LINE_HEIGHT = 23

    function stream(clock: CommandClock, onDone: () => void, lines = 1_000) {
      const heights: number[] = []
      streamOutput({
        clock,
        fromHeight: 100,
        lineHeight: LINE_HEIGHT,
        onDone,
        showTo: (height) => heights.push(height),
        toHeight: 100 + lines * LINE_HEIGHT,
      })
      return heights
    }

    it('prints top down, and long output is done in the time the brief allows', () => {
      const onDone = vi.fn()
      const heights = stream(new CommandClock(), onDone)

      expect(heights[0]).toBe(100)
      vi.advanceTimersByTime(OUTPUT_TOTAL_MILLISECONDS - 2 * OUTPUT_TICK_MILLISECONDS)
      expect(onDone).not.toHaveBeenCalled()
      vi.advanceTimersByTime(3 * OUTPUT_TICK_MILLISECONDS)

      expect(onDone).toHaveBeenCalledOnce()
      expect(heights).toEqual([...heights].sort((first, second) => first - second))
      expect(heights.length).toBeGreaterThan(5)
    })

    // Before Zack asked for it slowed down, a floor of a line a tick printed a card in 120 ms.
    it('gives short output the pace of a line, and does not flash it up', () => {
      const lines = 6
      const onDone = vi.fn()
      stream(new CommandClock(), onDone, lines)

      vi.advanceTimersByTime(lines * OUTPUT_LINE_MILLISECONDS - 2 * OUTPUT_TICK_MILLISECONDS)
      expect(onDone).not.toHaveBeenCalled()
      vi.advanceTimersByTime(3 * OUTPUT_TICK_MILLISECONDS)

      expect(onDone).toHaveBeenCalledOnce()
    })

    it('finishes at once when fast-forwarded', () => {
      const clock = new CommandClock()
      const onDone = vi.fn()
      stream(clock, onDone)

      clock.fastForward()

      expect(onDone).toHaveBeenCalledOnce()
    })
  })

  describe('playDownload', () => {
    function play(clock: CommandClock, onDone: () => void) {
      const output = document.createElement('div')
      playDownload({ clock, columns: 100, onDone, output })
      return output
    }

    it('prints the lines Zack approved, in order, and takes about the time he set', () => {
      vi.setSystemTime(new Date(2026, 10, 4, 17, 52, 8))
      const onDone = vi.fn()
      const output = play(new CommandClock(), onDone)

      vi.advanceTimersByTime(DOWNLOAD_SHORTEST_MILLISECONDS)
      expect(onDone).not.toHaveBeenCalled()
      vi.advanceTimersByTime(DOWNLOAD_LONGEST_MILLISECONDS - DOWNLOAD_SHORTEST_MILLISECONDS)
      expect(onDone).toHaveBeenCalledOnce()

      expect([...output.children].map((line) => line.textContent)).toEqual([
        '--2026-11-04 17:52:08--  https://kups.me/get_resume.sh',
        'Resolving kups.me... done.',
        'Connecting to kups.me:443... connected.',
        'HTTP request sent, awaiting response... 200 OK',
        "Saving to: 'get_resume.sh'",
        `get_resume.sh  100%[${'='.repeat(DOWNLOAD_BAR_WIDE_CHARACTERS - 1)}>] 1.3K`,
        "'get_resume.sh' saved",
        'Opening the resume...',
      ])
    })

    it('skips what is left in one go when fast-forwarded', () => {
      const clock = new CommandClock()
      const onDone = vi.fn()
      const output = play(clock, onDone)

      vi.advanceTimersByTime(200)
      clock.fastForward()

      expect(onDone).toHaveBeenCalledOnce()
      expect(output.lastElementChild?.textContent).toBe('Opening the resume...')
    })

    it('hesitates in the middle of the bar, as a real download does', () => {
      const clock = new CommandClock()
      const output = play(clock, vi.fn())
      const readPercents: number[] = []
      for (let elapsed = 0; elapsed < 6_000; elapsed += 10) {
        vi.advanceTimersByTime(10)
        const bar = output.querySelector('.terminal-download-bar')
        const percent = Number(/(\d+)%/.exec(bar?.textContent ?? '')?.[1] ?? -1)
        if (percent >= 0) {
          readPercents.push(percent)
        }
      }

      const samplesAt = (from: number, to: number) =>
        readPercents.filter((percent) => percent > from && percent < to).length
      // Two equally wide stretches of the bar, the same number of steps wide when jitter is pinned.
      expect(samplesAt(55, 75)).toBeGreaterThan(samplesAt(20, 40))
    })
  })
})

describe('formatDownloadStamp', () => {
  it('stamps the way wget does, with leading zeros', () => {
    expect(formatDownloadStamp(new Date(2026, 0, 2, 3, 4, 5))).toBe('2026-01-02 03:04:05')
  })
})

describe('chooseDownloadBar and drawDownloadBar', () => {
  it('uses the wide bar with the file name where there is room', () => {
    expect(chooseDownloadBar(80)).toEqual({
      barCharacters: DOWNLOAD_BAR_WIDE_CHARACTERS,
      showsFileName: true,
    })
  })

  it('narrows to fit a phone, without the file name', () => {
    expect(chooseDownloadBar(42)).toEqual({
      barCharacters: DOWNLOAD_BAR_NARROW_CHARACTERS,
      showsFileName: false,
    })
  })

  it('never runs wider than the line, even with text at twice the size', () => {
    const columns = 21
    const line = drawDownloadBar(50, columns)

    expect(chooseDownloadBar(columns).barCharacters).toBe(DOWNLOAD_BAR_SMALLEST_CHARACTERS)
    expect(line.length).toBeLessThanOrEqual(columns)
  })

  it('draws an empty bar at zero and a full one at a hundred', () => {
    expect(drawDownloadBar(0, 42)).toBe(`  0%[${' '.repeat(20)}] 1.3K`)
    expect(drawDownloadBar(100, 42)).toBe(`100%[${'='.repeat(19)}>] 1.3K`)
  })
})
