import { GESTURE_QUIET_MILLISECONDS } from '../constants'

/**
 * One swipe, from its first input until the input goes quiet. macOS goes on sending wheel events
 * for seconds after the fingers lift, and a phone goes on scrolling, so distance alone reads that
 * momentum as the reader scrolling on. A gesture is spent once it has done its one thing, and
 * whatever is left of it means nothing.
 */
export class ScrollGesture {
  private isSpentFlag = false
  private lastInputAt = Number.NEGATIVE_INFINITY

  /** How far the wheel or finger has gone in this gesture, in either direction. */
  travelled = 0

  /** Input arrived. Answers whether it began a new gesture. */
  note(now: number, distance: number): boolean {
    const isNew = !this.isGoing(now)
    if (isNew) {
      this.isSpentFlag = false
      this.travelled = 0
    }
    this.lastInputAt = now
    this.travelled += distance
    return isNew
  }

  isGoing(now: number): boolean {
    return now - this.lastInputAt < GESTURE_QUIET_MILLISECONDS
  }

  /** It has done its one thing. A spent gesture stays spent until the input goes quiet. */
  spend(): void {
    this.isSpentFlag = true
  }

  isSpent(now: number): boolean {
    return this.isSpentFlag && this.isGoing(now)
  }
}
