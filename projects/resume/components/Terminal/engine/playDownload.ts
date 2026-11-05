import {
  DOWNLOAD_AFTER_SAVED_MILLISECONDS,
  DOWNLOAD_BAR_FRAME_CHARACTERS,
  DOWNLOAD_BAR_NARROW_CHARACTERS,
  DOWNLOAD_BAR_SMALLEST_CHARACTERS,
  DOWNLOAD_BAR_WIDE_CHARACTERS,
  DOWNLOAD_BEFORE_WINDOW_MILLISECONDS,
  DOWNLOAD_COPY,
  DOWNLOAD_LINE_PAUSES_MILLISECONDS,
  DOWNLOAD_PROGRESS_STALL_MILLISECONDS,
  DOWNLOAD_PROGRESS_TICK_MILLISECONDS,
  DOWNLOAD_SMALLEST_STEP_PERCENT,
  DOWNLOAD_STALL_FROM_PERCENT,
  DOWNLOAD_STALL_TO_PERCENT,
  DOWNLOAD_STEP_RANGE_PERCENT,
  DOWNLOAD_WIDE_FROM_COLUMNS,
} from '../constants'

import type { CommandClock } from './commandClock'

const COMPLETE_PERCENT = 100
const PERCENT_COLUMN_WIDTH = 3

/** `2026-11-04 17:52:08`, in the reader's own time, as wget stamps its first line. */
export function formatDownloadStamp(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  return `${date} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

/** How wide the bar can be on this many columns, and whether the file name fits in front of it. */
export function chooseDownloadBar(columns: number): {
  barCharacters: number
  showsFileName: boolean
} {
  if (columns >= DOWNLOAD_WIDE_FROM_COLUMNS) {
    return { barCharacters: DOWNLOAD_BAR_WIDE_CHARACTERS, showsFileName: true }
  }
  return {
    barCharacters: Math.max(
      DOWNLOAD_BAR_SMALLEST_CHARACTERS,
      Math.min(DOWNLOAD_BAR_NARROW_CHARACTERS, columns - DOWNLOAD_BAR_FRAME_CHARACTERS),
    ),
    showsFileName: false,
  }
}

/** One frame of the progress bar: `get_resume.sh   62%[====>    ] 1.3K`. */
export function drawDownloadBar(percent: number, columns: number): string {
  const { barCharacters, showsFileName } = chooseDownloadBar(columns)
  const filled = Math.round((percent / COMPLETE_PERCENT) * barCharacters)
  const bar = `${'='.repeat(Math.max(0, filled - 1))}${filled > 0 ? '>' : ''}${' '.repeat(barCharacters - filled)}`
  const label = showsFileName ? `${DOWNLOAD_COPY.fileName}  ` : ''
  return `${label}${String(percent).padStart(PERCENT_COLUMN_WIDTH)}%[${bar}] ${DOWNLOAD_COPY.fileSize}`
}

type PlayDownloadOptions = {
  clock: CommandClock
  /** How many characters fit on a line of the output. */
  columns: number
  /** Runs once the output reads "Opening the resume...", when the window should open. */
  onDone: () => void
  output: HTMLElement
}

/** A real-looking wget, with pauses. Anything from the reader skips what is left of it. */
export function playDownload({ clock, columns, onDone, output }: PlayDownloadOptions): void {
  output.textContent = ''

  const addLine = (text: string) => {
    const line = document.createElement('div')
    line.textContent = text
    output.append(line)
    return line
  }

  const finish = () => {
    addLine(DOWNLOAD_COPY.saved)
    clock.after(DOWNLOAD_AFTER_SAVED_MILLISECONDS, () => {
      addLine(DOWNLOAD_COPY.opening)
      clock.after(DOWNLOAD_BEFORE_WINDOW_MILLISECONDS, onDone)
    })
  }

  const showProgress = () => {
    const bar = addLine(drawDownloadBar(0, columns))
    bar.className = 'terminal-download-bar'
    let percent = 0
    const advance = () => {
      percent = clock.isFastForwarding
        ? COMPLETE_PERCENT
        : Math.min(
            COMPLETE_PERCENT,
            Math.round(
              percent +
                DOWNLOAD_SMALLEST_STEP_PERCENT +
                Math.random() * DOWNLOAD_STEP_RANGE_PERCENT,
            ),
          )
      bar.textContent = drawDownloadBar(percent, columns)
      if (percent >= COMPLETE_PERCENT) {
        finish()
        return
      }
      const isStalling =
        percent > DOWNLOAD_STALL_FROM_PERCENT && percent < DOWNLOAD_STALL_TO_PERCENT
      clock.after(
        isStalling ? DOWNLOAD_PROGRESS_STALL_MILLISECONDS : DOWNLOAD_PROGRESS_TICK_MILLISECONDS,
        advance,
      )
    }
    clock.after(DOWNLOAD_PROGRESS_TICK_MILLISECONDS, advance)
  }

  const lines = [
    `--${formatDownloadStamp(new Date())}--  ${DOWNLOAD_COPY.scriptAddress}`,
    ...DOWNLOAD_COPY.linesBeforeProgress,
  ]
  const printLine = (index: number) => {
    if (index >= lines.length) {
      showProgress()
      return
    }
    clock.after(DOWNLOAD_LINE_PAUSES_MILLISECONDS[index], () => {
      addLine(lines[index])
      printLine(index + 1)
    })
  }

  printLine(0)
}
