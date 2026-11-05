import { END_HOLD_MILLISECONDS, SCROLL_NOISE_PIXELS } from '../constants'

import type { MappedStep } from './scrollMap'

/**
 * A wheel or touch flick that reaches the edge of long output stops there for a moment, so its
 * last lines cannot be skipped. Being put back on the edge must not restart the wait, or long
 * output could never end, so the wait runs from the first time the scroll reached that edge.
 */
export class EdgeHold {
  private heldEdge: number | null = null
  private heldSince = 0

  /** Answers the scroll position to hold at, or null when the scroll may go on. */
  check(
    mapped: MappedStep,
    isGoingDown: boolean,
    scrollTop: number,
    isFlick: boolean,
    now: number,
  ): number | null {
    const edge = isGoingDown ? mapped.end : mapped.start
    const hasLeftEdge = isGoingDown
      ? scrollTop < edge - SCROLL_NOISE_PIXELS
      : scrollTop > edge + SCROLL_NOISE_PIXELS
    if (hasLeftEdge || mapped.length === 0) {
      this.heldEdge = null
      return null
    }
    if (this.heldEdge !== edge) {
      this.heldEdge = edge
      this.heldSince = now
    }
    const isPastEdge = isGoingDown ? scrollTop > edge : scrollTop < edge
    const hasHeldLongEnough = now - this.heldSince >= END_HOLD_MILLISECONDS
    return isPastEdge && isFlick && !hasHeldLongEnough ? edge : null
  }
}
