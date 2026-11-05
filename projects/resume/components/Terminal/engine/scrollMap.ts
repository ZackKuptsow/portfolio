import { SCROLL_PAST_END_TO_TRIGGER_PIXELS } from '../constants'

/** How far a step's output reaches inside its scene, from the measured box of its block. */
export type BlockBounds = {
  bottom: number
  /** A step that clears the screen starts at the top of its scene, padding and all. */
  clearsBefore: boolean
  top: number
}

/** Where a step sits on the scroll track, and which part of its scene it shows. */
export type MappedStep = {
  /** The scroll position at this step's last line. */
  end: number
  length: number
  offsetEnd: number
  offsetStart: number
  /** The scroll position at this step's first line. */
  start: number
}

/**
 * Maps scroll to steps. A step's length is exactly the output that does not fit on screen, so
 * its last line is always reachable, whatever the width. Between two steps the track leaves
 * room to scroll past the end and trigger the command, and to scroll back without leaving.
 */
export function mapStepsToScroll(
  blocks: readonly BlockBounds[],
  usableHeight: number,
): MappedStep[] {
  let position = 0
  return blocks.map(({ bottom, clearsBefore, top }) => {
    const offsetStart = clearsBefore ? 0 : Math.max(0, Math.min(top, bottom - usableHeight))
    const offsetEnd = Math.max(offsetStart, bottom - usableHeight)
    const length = offsetEnd - offsetStart
    const mappedStep = { end: position + length, length, offsetEnd, offsetStart, start: position }
    position = mappedStep.end + 2 * SCROLL_PAST_END_TO_TRIGGER_PIXELS
    return mappedStep
  })
}

/** The furthest step whose start the scroll has reached. */
export function findStepAt(steps: readonly MappedStep[], scrollTop: number): number {
  let reached = 0
  steps.forEach((step, index) => {
    if (scrollTop >= step.start) {
      reached = index
    }
  })
  return reached
}

/**
 * Where to put the scroll after a re-measure, so a reader stays at the same point in the same
 * step when a phone rotates or the address bar changes size.
 */
export function keepPlaceInStep(
  previous: MappedStep,
  next: MappedStep,
  previousScrollTop: number,
): number {
  if (previous.length === 0 || next.length === 0) {
    return next.start
  }
  const moved = Math.min(previous.length, Math.max(0, previousScrollTop - previous.start))
  return next.start + (moved / previous.length) * next.length
}
