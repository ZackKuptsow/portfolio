import {
  JUMP_SETTLE_MILLISECONDS,
  RECENT_INPUT_MILLISECONDS,
  SCROLL_NOISE_PIXELS,
  SCROLL_PAST_END_TO_TRIGGER_PIXELS,
  SCROLL_WHILE_RUNNING_TO_FAST_FORWARD_PIXELS,
} from '../constants'
import { EdgeHold } from './edgeHold'
import { findStepAt } from './scrollMap'

import type { MappedStep } from './scrollMap'

export type ScrollDirection = 'down' | 'up'

type ScrollDriverOptions = {
  /** Whether the terminal is on screen. In the plain flow the scroll means nothing here. */
  isActive: () => boolean
  isBusy: () => boolean
  onDraw: () => void
  onFastForward: () => void
  /** The scroll has settled several steps away, here. */
  onJump: (reached: number, scrollTop: number) => void
  onMoveDown: () => void
  onMoveUp: () => void
  readCurrentStep: () => number
  readMappedSteps: () => readonly MappedStep[]
  scroller: HTMLElement
}

/**
 * Reads the reader's scroll and says what it means: draw the current step, hold at its edge,
 * move a step, jump several, or fast-forward what is running. It tells the reader's own moves
 * from the code's, so a scroll set here never reads as the reader scrolling on.
 */
export class ScrollDriver {
  private readonly edgeHold = new EdgeHold()
  private readonly options: ScrollDriverOptions

  private busyScrollTop = 0
  private isScheduled = false
  private isStopped = false
  private jumpCheckScrollTop: number | null = null
  private jumpTimer: ReturnType<typeof setTimeout> | undefined
  private lastFlickInputAt = 0
  private lastScrollTop = 0

  direction: ScrollDirection = 'down'

  constructor(options: ScrollDriverOptions) {
    this.options = options
  }

  stop(): void {
    this.isStopped = true
    clearTimeout(this.jumpTimer)
  }

  /** A wheel or a touch moved, which is what tells a flick from a dragged scrollbar or a key. */
  noteFlick(): void {
    this.lastFlickInputAt = performance.now()
  }

  isFlicking(): boolean {
    return performance.now() - this.lastFlickInputAt < RECENT_INPUT_MILLISECONDS
  }

  /** A move made here is not the reader's, so it must not read as scrolling on to fast-forward. */
  setScroll(top: number): void {
    const { scroller } = this.options
    scroller.scrollTop = top
    this.adoptScroll()
  }

  /** Takes where the scroll is now as the reader's place, without moving it. */
  adoptScroll(): void {
    this.lastScrollTop = this.options.scroller.scrollTop
    this.busyScrollTop = this.lastScrollTop
  }

  /** A command is starting, so scrolling on from here is what fast-forwards it. */
  noteBusyStart(): void {
    this.busyScrollTop = this.options.scroller.scrollTop
  }

  schedule = (): void => {
    if (this.isScheduled) {
      return
    }
    this.isScheduled = true
    requestAnimationFrame(() => {
      this.isScheduled = false
      if (!this.isStopped) {
        this.update()
      }
    })
  }

  private update(): void {
    const { isActive, isBusy, onDraw, onFastForward, onMoveDown, onMoveUp, scroller } = this.options
    if (!isActive()) {
      return
    }
    const { scrollTop } = scroller
    if (isBusy()) {
      if (Math.abs(scrollTop - this.busyScrollTop) > SCROLL_WHILE_RUNNING_TO_FAST_FORWARD_PIXELS) {
        onFastForward()
      }
      return
    }
    if (Math.abs(scrollTop - this.lastScrollTop) > SCROLL_NOISE_PIXELS) {
      this.direction = scrollTop > this.lastScrollTop ? 'down' : 'up'
      this.lastScrollTop = scrollTop
    }
    const steps = this.options.readMappedSteps()
    const current = this.options.readCurrentStep()
    const reached = findStepAt(steps, scrollTop)
    if (Math.abs(reached - current) > 1) {
      this.jumpWhenSettled(reached, scrollTop)
      return
    }
    const mapped = steps[current]
    const isGoingDown = this.direction === 'down'
    const heldAt = this.edgeHold.check(
      mapped,
      isGoingDown,
      scrollTop,
      this.isFlicking(),
      performance.now(),
    )
    if (heldAt !== null) {
      this.setScroll(heldAt)
      onDraw()
      return
    }
    if (
      isGoingDown &&
      current < steps.length - 1 &&
      scrollTop >= mapped.end + SCROLL_PAST_END_TO_TRIGGER_PIXELS
    ) {
      onMoveDown()
      return
    }
    if (
      !isGoingDown &&
      current > 0 &&
      scrollTop <= mapped.start - SCROLL_PAST_END_TO_TRIGGER_PIXELS
    ) {
      onMoveUp()
      return
    }
    onDraw()
  }

  /**
   * A dragged scrollbar or a long flick lands several steps away, and goes straight there. It
   * may still be moving, so wait for it to settle before reading where it landed.
   */
  private jumpWhenSettled(reached: number, scrollTop: number): void {
    if (this.jumpCheckScrollTop !== scrollTop) {
      this.jumpCheckScrollTop = scrollTop
      clearTimeout(this.jumpTimer)
      this.jumpTimer = setTimeout(() => this.update(), JUMP_SETTLE_MILLISECONDS)
      return
    }
    this.jumpCheckScrollTop = null
    this.options.onJump(reached, scrollTop)
  }
}
