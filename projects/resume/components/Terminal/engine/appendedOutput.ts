import { streamOutput } from './streamOutput'

import type { CommandClock } from './commandClock'
import type { ScrollDriver } from './ScrollDriver'
import type { TerminalLayout } from './TerminalLayout'

/** What showing typed output needs from the engine: its layout, its scroll and its clock. */
export type AppendedOutputView = {
  clock: CommandClock
  draw: () => void
  layout: TerminalLayout
  publishStep: () => void
  scroll: ScrollDriver
  stepIndex: number
}

/**
 * The typed shell appended output after the current block. Re-measure with it counted, and
 * scroll to the end of the step so it is on screen.
 */
export function showAppendedOutput(view: AppendedOutputView): void {
  view.layout.measure()
  view.layout.showStep(view.stepIndex)
  view.scroll.setScroll(view.layout.mappedSteps[view.stepIndex].end)
  view.draw()
  view.publishStep()
}

/** As above, then stream the new rows from a height in the scene, at the tour's pace. */
export function printAppendedOutput(
  view: AppendedOutputView,
  fromSceneHeight: number,
  done: () => void,
): void {
  showAppendedOutput(view)
  const { finish, lineHeight, runs } = view.layout.planPrintingFrom(view.stepIndex, fromSceneHeight)
  streamOutput({
    clock: view.clock,
    lineHeight,
    onDone: () => {
      finish()
      view.draw()
      done()
    },
    runs,
  })
}
