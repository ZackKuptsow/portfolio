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
  /** The scroll position at the top of this step's section, up through what is already printed. */
  sectionStart: number
  /** The scroll position at this step's first line. */
  start: number
}

/**
 * Maps scroll to steps. A step's length is exactly the output that does not fit on screen, so
 * its last line is always reachable, whatever the width.
 *
 * Inside a section the scroll is the output's own position, 1:1, because what is printed stays
 * printed: a reader goes back through it as through a terminal's scrollback, with nothing to type
 * and no jump in it. So two cards share the track, and only which card has been reached says how
 * far the output runs. Between sections the track leaves room to scroll past the end and trigger
 * the command, and to scroll back without leaving.
 */
export function mapStepsToScroll(
  blocks: readonly BlockBounds[],
  usableHeight: number,
): MappedStep[] {
  let sectionStart = 0
  let lastEnd = 0
  return blocks.map(({ bottom, clearsBefore, top }, index) => {
    if (clearsBefore && index > 0) {
      sectionStart = lastEnd + 2 * SCROLL_PAST_END_TO_TRIGGER_PIXELS
    }
    const offsetStart = clearsBefore ? 0 : Math.max(0, Math.min(top, bottom - usableHeight))
    const offsetEnd = Math.max(offsetStart, bottom - usableHeight)
    lastEnd = sectionStart + offsetEnd
    return {
      end: lastEnd,
      length: offsetEnd - offsetStart,
      offsetEnd,
      offsetStart,
      sectionStart,
      start: sectionStart + offsetStart,
    }
  })
}

/**
 * The room the track needs past the last line of the site. Two cards can end closer together than
 * the distance that triggers the next, which must still be reachable from the second to last.
 */
export const TRACK_ROOM_PAST_THE_END_PIXELS = SCROLL_PAST_END_TO_TRIGGER_PIXELS + 1

/** How far up the scene is moved at a scroll position, while a step is the furthest reached. */
export function offsetAt(step: MappedStep, scrollTop: number): number {
  return Math.min(step.offsetEnd, Math.max(0, scrollTop - step.sectionStart))
}

/**
 * The furthest step whose start the scroll has reached. Inside a section this says little, since
 * cards that fit on screen together all start in one place, so read it for the section it falls in.
 */
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
 * How many steps outside the current step's section another step lies. No distance at all means
 * the scroll is only reading the section's own output, and one means the section next door.
 */
export function countStepsOutsideSection(
  steps: readonly MappedStep[],
  current: number,
  other: number,
): number {
  const { sectionStart } = steps[current]
  const first = steps.findIndex((step) => step.sectionStart === sectionStart)
  const last = steps.findLastIndex((step) => step.sectionStart === sectionStart)
  return Math.max(0, first - other, other - last)
}

/**
 * Where to put the scroll after a re-measure, so a reader stays at the same point when a phone
 * rotates or the address bar changes size: in the same step, or as far back through what is printed
 * above it.
 */
export function keepPlaceInStep(
  previous: MappedStep,
  next: MappedStep,
  previousScrollTop: number,
): number {
  const printedAbove = previous.start - previous.sectionStart
  if (previousScrollTop < previous.start && printedAbove > 0) {
    const shareOfTheWay = Math.max(0, previousScrollTop - previous.sectionStart) / printedAbove
    return next.sectionStart + shareOfTheWay * (next.start - next.sectionStart)
  }
  if (previous.length === 0 || next.length === 0) {
    return next.start
  }
  const moved = Math.min(previous.length, Math.max(0, previousScrollTop - previous.start))
  return next.start + (moved / previous.length) * next.length
}
