import {
  OUTPUT_LINE_MILLISECONDS,
  OUTPUT_TICK_MILLISECONDS,
  OUTPUT_TOTAL_MILLISECONDS,
} from '../constants'

import type { CommandClock } from './commandClock'

/** A stretch of output that prints top down before the next one starts. */
export type PrintRun = {
  /** How far down the scene it starts printing. */
  fromHeight: number
  /** Shows it down to this height in the scene. */
  showTo: (height: number) => void
  /** Where it stops: its own bottom, or the bottom of what can show on screen. */
  toHeight: number
}

type StreamOutputOptions = {
  clock: CommandClock
  lineHeight: number
  onDone: () => void
  /** In the order they print, sharing one pace and one time limit. */
  runs: readonly PrintRun[]
}

/** Prints in bursts of whole lines, top down, a run at a time. */
export function streamOutput({ clock, lineHeight, onDone, runs }: StreamOutputOptions): void {
  const runsWithOutput = runs.filter(({ fromHeight, toHeight }) => toHeight > fromHeight)
  const lineCount = Math.max(
    1,
    runsWithOutput.reduce(
      (lines, { fromHeight, toHeight }) => lines + Math.ceil((toHeight - fromHeight) / lineHeight),
      0,
    ),
  )
  const printingMilliseconds = Math.min(
    OUTPUT_TOTAL_MILLISECONDS,
    lineCount * OUTPUT_LINE_MILLISECONDS,
  )
  // Often under one: only whole rows ever show, so a part of a line waits for the rest of it.
  const linesPerTick = lineCount / (printingMilliseconds / OUTPUT_TICK_MILLISECONDS)
  let runIndex = 0
  let printedTo = runsWithOutput[0]?.fromHeight ?? 0

  const printNextBurst = () => {
    const run = runsWithOutput[runIndex]
    if (!run || clock.isFastForwarding) {
      onDone()
      return
    }
    const burst = linesPerTick * (0.5 + Math.random()) * lineHeight
    printedTo = Math.min(run.toHeight, printedTo + burst)
    run.showTo(printedTo)
    if (printedTo >= run.toHeight) {
      runIndex += 1
      const nextRun = runsWithOutput[runIndex]
      if (!nextRun) {
        onDone()
        return
      }
      printedTo = nextRun.fromHeight
    }
    clock.after(OUTPUT_TICK_MILLISECONDS, printNextBurst)
  }

  runsWithOutput[0]?.showTo(printedTo)
  clock.after(OUTPUT_TICK_MILLISECONDS, printNextBurst)
}
