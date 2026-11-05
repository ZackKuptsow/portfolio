import { OUTPUT_TICK_MILLISECONDS, OUTPUT_TOTAL_MILLISECONDS } from '../constants'

import type { CommandClock } from './commandClock'

type StreamOutputOptions = {
  clock: CommandClock
  /** How far down the scene the output starts printing. */
  fromHeight: number
  lineHeight: number
  onDone: () => void
  /** Shows the output from the top of the screen down to this height in the scene. */
  showTo: (height: number) => void
  /** The bottom of what can show on screen. */
  toHeight: number
}

/** Prints in bursts of whole lines, top down, on every pass and in both directions. */
export function streamOutput({
  clock,
  fromHeight,
  lineHeight,
  onDone,
  showTo,
  toHeight,
}: StreamOutputOptions): void {
  const lineCount = Math.max(1, Math.ceil((toHeight - fromHeight) / lineHeight))
  const linesPerTick = Math.max(
    1,
    lineCount / (OUTPUT_TOTAL_MILLISECONDS / OUTPUT_TICK_MILLISECONDS),
  )
  let printedTo = fromHeight

  const printNextBurst = () => {
    const burst = linesPerTick * (0.5 + Math.random()) * lineHeight
    printedTo = clock.isFastForwarding ? toHeight : Math.min(toHeight, printedTo + burst)
    if (printedTo >= toHeight) {
      onDone()
      return
    }
    showTo(printedTo)
    clock.after(OUTPUT_TICK_MILLISECONDS, printNextBurst)
  }

  showTo(printedTo)
  clock.after(OUTPUT_TICK_MILLISECONDS, printNextBurst)
}
