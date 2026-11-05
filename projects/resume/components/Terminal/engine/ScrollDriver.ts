import {
  JUMP_SETTLE_MILLISECONDS,
  PULL_FORGOTTEN_AFTER_MILLISECONDS,
  SCROLL_NOISE_PIXELS,
  SCROLL_PAST_END_TO_TRIGGER_PIXELS,
  SCROLL_WHILE_RUNNING_TO_FAST_FORWARD_PIXELS,
} from '../constants'
import { ScrollGesture } from './scrollGesture'
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
  /** A swipe short of a command has been forgotten, so the next starts from nothing. */
  onPullForgotten: () => void
  readCurrentStep: () => number
  readMappedSteps: () => readonly MappedStep[]
  scroller: HTMLElement
}

/**
 * Reads the reader's scroll and says what it means: draw the current step, stop at its edge, move
 * a step, jump several, or fast-forward what is running. It tells the reader's own moves from the
 * code's, so a scroll set here never reads as the reader scrolling on.
 *
 * A wheel, a touch or a scrolling key is a gesture, and a gesture does one thing: it starts a
 * command, finishes one, or stops at the end of the output. See `ScrollGesture`.
 */
export class ScrollDriver {
  private readonly gesture = new ScrollGesture()
  private readonly options: ScrollDriverOptions

  private busyScrollTop = 0
  private gestureStartScrollTop = 0
  private isScheduled = false
  private isStopped = false
  private jumpCheckScrollTop: number | null = null
  private jumpTimer: ReturnType<typeof setTimeout> | undefined
  private lastScrollTop = 0
  private pullTimer: ReturnType<typeof setTimeout> | undefined

  direction: ScrollDirection = 'down'

  constructor(options: ScrollDriverOptions) {
    this.options = options
  }

  stop(): void {
    this.isStopped = true
    clearTimeout(this.jumpTimer)
    clearTimeout(this.pullTimer)
  }

  /**
   * A wheel or a touch moved. Only a gesture begun while a command runs can get here unspent,
   * because the one that started the command is spent, so this is the reader asking to hurry.
   */
  noteSwipe(distance: number, neededToFastForward: number): void {
    this.noteInput(distance)
    this.rememberPullForAWhile()
    const now = performance.now()
    if (
      this.options.isBusy() &&
      !this.gesture.isSpent(now) &&
      this.gesture.travelled > neededToFastForward
    ) {
      this.gesture.spend()
      this.options.onFastForward()
    }
  }

  /** A key that scrolls. It has no distance to report, and a slow reader's pull is never lost. */
  noteScrollKey(): void {
    this.noteInput(0)
  }

  /** What is left of this gesture must not do anything else. */
  spendGesture(): void {
    this.gesture.spend()
  }

  isGestureGoing(): boolean {
    return this.gesture.isGoing(performance.now())
  }

  isGestureSpent(): boolean {
    return this.gesture.isSpent(performance.now())
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

  /** A command is starting. It is what this gesture did, whatever else it still has in it. */
  noteBusyStart(): void {
    this.gesture.spend()
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

  private noteInput(distance: number): void {
    if (this.gesture.note(performance.now(), distance)) {
      this.gestureStartScrollTop = this.options.scroller.scrollTop
    }
  }

  private rememberPullForAWhile(): void {
    clearTimeout(this.pullTimer)
    this.pullTimer = setTimeout(this.forgetPull, PULL_FORGOTTEN_AFTER_MILLISECONDS)
  }

  /**
   * Nothing on screen moves in the room past the edge, so going back to the edge shows nothing,
   * and a swipe that stopped short cannot leave a later nudge a few points from a command.
   */
  private forgetPull = (): void => {
    const {
      isActive,
      isBusy,
      onDraw,
      onPullForgotten,
      readCurrentStep,
      readMappedSteps,
      scroller,
    } = this.options
    if (this.isStopped || !isActive() || isBusy()) {
      return
    }
    onPullForgotten()
    const { end, start } = readMappedSteps()[readCurrentStep()]
    const insideStep = Math.min(end, Math.max(start, scroller.scrollTop))
    if (insideStep !== scroller.scrollTop) {
      this.setScroll(insideStep)
      onDraw()
    }
  }

  private update(): void {
    const { isActive, isBusy, onDraw, onFastForward, onMoveDown, onMoveUp, scroller } = this.options
    if (!isActive()) {
      return
    }
    const now = performance.now()
    const { scrollTop } = scroller
    const isGesture = this.gesture.isGoing(now)
    const hasMoved = Math.abs(scrollTop - this.lastScrollTop) > SCROLL_NOISE_PIXELS
    // A phone sends no touch events once the finger lifts, and the scroll is all there is to see.
    if (isGesture && hasMoved) {
      this.gesture.note(now, 0)
      this.rememberPullForAWhile()
    }
    if (isGesture && (isBusy() || this.gesture.isSpent(now))) {
      if (hasMoved) {
        this.setScroll(this.lastScrollTop)
      }
      return
    }
    if (isBusy()) {
      if (Math.abs(scrollTop - this.busyScrollTop) > SCROLL_WHILE_RUNNING_TO_FAST_FORWARD_PIXELS) {
        onFastForward()
      }
      return
    }
    if (hasMoved) {
      this.direction = scrollTop > this.lastScrollTop ? 'down' : 'up'
      this.lastScrollTop = scrollTop
    }
    const steps = this.options.readMappedSteps()
    const current = this.options.readCurrentStep()
    const reached = findStepAt(steps, scrollTop)
    if (!isGesture && Math.abs(reached - current) > 1) {
      this.jumpWhenSettled(reached, scrollTop)
      return
    }
    const mapped = steps[current]
    const isGoingDown = this.direction === 'down'
    const edge = isGoingDown ? mapped.end : mapped.start
    if (isGesture && this.hasRunInto(edge, isGoingDown, scrollTop)) {
      this.gesture.spend()
      this.setScroll(edge)
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
   * A gesture that began inside the output and has reached its edge stops there, so its last lines
   * cannot be skipped. One begun at the edge is the reader going on.
   */
  private hasRunInto(edge: number, isGoingDown: boolean, scrollTop: number): boolean {
    return isGoingDown
      ? this.gestureStartScrollTop < edge - SCROLL_NOISE_PIXELS && scrollTop > edge
      : this.gestureStartScrollTop > edge + SCROLL_NOISE_PIXELS && scrollTop < edge
  }

  /**
   * A dragged scrollbar lands several steps away, and goes straight there. It may still be moving,
   * so wait for it to settle before reading where it landed. A gesture never gets here: it moves
   * one step at most, so a flick cannot skip a section.
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
