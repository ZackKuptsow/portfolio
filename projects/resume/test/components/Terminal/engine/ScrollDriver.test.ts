import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  GESTURE_QUIET_MILLISECONDS,
  JUMP_SETTLE_MILLISECONDS,
  PULL_FORGOTTEN_AFTER_MILLISECONDS,
  SCROLL_PAST_END_TO_TRIGGER_PIXELS,
  SCROLL_WHILE_RUNNING_TO_FAST_FORWARD_PIXELS,
} from '@/components/Terminal/constants'
import { ScrollDriver } from '@/components/Terminal/engine/ScrollDriver'
import { mapStepsToScroll } from '@/components/Terminal/engine/scrollMap'

const FRAME_MILLISECONDS = 16
const USABLE_HEIGHT = 500
/** A speed at which each frame moves less than the distance to the next step. */
const FLICK_PIXELS_A_FRAME = 60
const TRIGGER = SCROLL_PAST_END_TO_TRIGGER_PIXELS

/** Three steps: one that fits the screen, one with 500 points of output to read, and another. */
const STEPS = mapStepsToScroll(
  [
    { bottom: USABLE_HEIGHT, clearsBefore: true, top: 0 },
    { bottom: USABLE_HEIGHT + 500, clearsBefore: true, top: 0 },
    { bottom: USABLE_HEIGHT, clearsBefore: true, top: 0 },
  ],
  USABLE_HEIGHT,
)
const [, LONG_STEP, LAST_STEP] = STEPS

/** Two sections above, then one of three cards too long to fit on screen together. */
const STEPS_WITH_CARDS = mapStepsToScroll(
  [
    { bottom: USABLE_HEIGHT, clearsBefore: true, top: 0 },
    { bottom: USABLE_HEIGHT, clearsBefore: true, top: 0 },
    { bottom: USABLE_HEIGHT + 400, clearsBefore: true, top: 0 },
    { bottom: USABLE_HEIGHT + 800, clearsBefore: false, top: USABLE_HEIGHT + 400 },
    { bottom: USABLE_HEIGHT + 1200, clearsBefore: false, top: USABLE_HEIGHT + 800 },
  ],
  USABLE_HEIGHT,
)
const [, , FIRST_CARD, , LAST_CARD] = STEPS_WITH_CARDS
const LAST_CARD_INDEX = STEPS_WITH_CARDS.length - 1

function buildDriver({ currentStep = 0, scrollTop = 0, steps = STEPS } = {}) {
  const scroller = { scrollTop } as unknown as HTMLElement
  const state = { currentStep, isBusy: false }
  const options = {
    isActive: () => true,
    isBusy: () => state.isBusy,
    onDraw: vi.fn(),
    onFastForward: vi.fn(),
    onJump: vi.fn(),
    onMoveDown: vi.fn(),
    onMoveUp: vi.fn(),
    onPullForgotten: vi.fn(),
    readCurrentStep: () => state.currentStep,
    readMappedSteps: () => steps,
    scroller,
  }
  const driver = new ScrollDriver(options)
  driver.adoptScroll()

  const frame = () => {
    driver.schedule()
    vi.advanceTimersByTime(FRAME_MILLISECONDS)
  }
  return {
    ...options,
    driver,
    /** One frame of a wheel, which has moved the scroll too by the time the driver reads it. */
    flickFor(pixels: number, pixelsAFrame = FLICK_PIXELS_A_FRAME) {
      const direction = Math.sign(pixels)
      for (let moved = 0; moved < Math.abs(pixels); moved += pixelsAFrame) {
        driver.noteSwipe(pixelsAFrame, SCROLL_WHILE_RUNNING_TO_FAST_FORWARD_PIXELS)
        scroller.scrollTop += direction * pixelsAFrame
        frame()
      }
    },
    frame,
    goQuiet() {
      vi.advanceTimersByTime(GESTURE_QUIET_MILLISECONDS)
    },
    /** What the engine does when a command starts. */
    startCommand() {
      state.isBusy = true
      driver.noteBusyStart()
    },
    /** What the engine does when a command has landed on a step and finished printing. */
    finishCommand(stepIndex: number) {
      state.currentStep = stepIndex
      state.isBusy = false
      driver.direction = 'down'
      driver.setScroll(STEPS[stepIndex].start)
    },
    scroller,
    state,
  }
}

describe('ScrollDriver', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('one swipe does one thing', () => {
    it('moves a step once it has gone far enough past the end, and not before', () => {
      const terminal = buildDriver()

      terminal.flickFor(TRIGGER - FLICK_PIXELS_A_FRAME)
      expect(terminal.onMoveDown).not.toHaveBeenCalled()

      terminal.flickFor(FLICK_PIXELS_A_FRAME)
      expect(terminal.onMoveDown).toHaveBeenCalledOnce()
    })

    it('does nothing more with the momentum while the command runs', () => {
      const terminal = buildDriver()
      terminal.flickFor(TRIGGER)
      terminal.startCommand()
      const heldAt = terminal.scroller.scrollTop

      terminal.flickFor(5_000)

      expect(terminal.onMoveDown).toHaveBeenCalledOnce()
      expect(terminal.onFastForward).not.toHaveBeenCalled()
      expect(terminal.scroller.scrollTop).toBe(heldAt)
    })

    it('does nothing with momentum that outlasts the command', () => {
      const terminal = buildDriver()
      terminal.flickFor(TRIGGER)
      terminal.startCommand()
      terminal.finishCommand(1)
      terminal.onMoveDown.mockClear()

      terminal.flickFor(5_000)

      expect(terminal.onMoveDown).not.toHaveBeenCalled()
      expect(terminal.scroller.scrollTop).toBe(LONG_STEP.start)
    })

    it('reads a new swipe once the last has gone quiet', () => {
      const terminal = buildDriver()
      terminal.flickFor(TRIGGER)
      terminal.startCommand()
      terminal.finishCommand(1)
      terminal.goQuiet()

      terminal.flickFor(240)

      expect(terminal.scroller.scrollTop).toBe(LONG_STEP.start + 240)
    })

    it('lets a new swipe finish the running command, and then does nothing more with it', () => {
      const terminal = buildDriver()
      terminal.flickFor(TRIGGER)
      terminal.startCommand()
      terminal.goQuiet()

      terminal.flickFor(SCROLL_WHILE_RUNNING_TO_FAST_FORWARD_PIXELS + FLICK_PIXELS_A_FRAME)
      expect(terminal.onFastForward).toHaveBeenCalledOnce()
      terminal.finishCommand(1)
      terminal.flickFor(5_000)

      expect(terminal.onFastForward).toHaveBeenCalledOnce()
      expect(terminal.scroller.scrollTop).toBe(LONG_STEP.start)
    })

    it('leaves the command running for a new swipe that is too short to mean hurry', () => {
      const terminal = buildDriver()
      terminal.flickFor(TRIGGER)
      terminal.startCommand()
      terminal.goQuiet()

      terminal.flickFor(SCROLL_WHILE_RUNNING_TO_FAST_FORWARD_PIXELS - FLICK_PIXELS_A_FRAME)

      expect(terminal.onFastForward).not.toHaveBeenCalled()
    })

    it('holds through a phone, which sends only the scroll once the finger has lifted', () => {
      const terminal = buildDriver()
      terminal.flickFor(TRIGGER)
      terminal.startCommand()
      const heldAt = terminal.scroller.scrollTop

      const frames = (2 * GESTURE_QUIET_MILLISECONDS) / FRAME_MILLISECONDS
      for (let frame = 0; frame < frames; frame += 1) {
        terminal.scroller.scrollTop += FLICK_PIXELS_A_FRAME
        terminal.frame()
      }

      expect(terminal.scroller.scrollTop).toBe(heldAt)
      expect(terminal.onFastForward).not.toHaveBeenCalled()
    })

    it('never jumps on a swipe, however far one frame carries it', () => {
      const terminal = buildDriver()

      terminal.flickFor(LAST_STEP.start + TRIGGER, LAST_STEP.start + TRIGGER)
      vi.advanceTimersByTime(JUMP_SETTLE_MILLISECONDS)
      terminal.frame()

      expect(terminal.onJump).not.toHaveBeenCalled()
      expect(terminal.onMoveDown).toHaveBeenCalled()
    })

    it('goes back one step at most, the same way', () => {
      const terminal = buildDriver({ currentStep: 2, scrollTop: LAST_STEP.start })

      terminal.flickFor(-TRIGGER)
      terminal.startCommand()
      terminal.flickFor(-5_000)

      expect(terminal.onMoveUp).toHaveBeenCalledOnce()
      expect(terminal.onJump).not.toHaveBeenCalled()
    })
  })

  describe('long output', () => {
    it('stops a swipe that reaches its last line, and types nothing', () => {
      const terminal = buildDriver({ currentStep: 1, scrollTop: LONG_STEP.start })

      terminal.flickFor(5_000)

      expect(terminal.scroller.scrollTop).toBe(LONG_STEP.end)
      expect(terminal.onMoveDown).not.toHaveBeenCalled()
    })

    it('stops one going up at its first line', () => {
      const terminal = buildDriver({ currentStep: 1, scrollTop: LONG_STEP.end })
      terminal.driver.direction = 'up'

      terminal.flickFor(-5_000)

      expect(terminal.scroller.scrollTop).toBe(LONG_STEP.start)
      expect(terminal.onMoveUp).not.toHaveBeenCalled()
    })

    it('lets a swipe begun at the last line go on', () => {
      const terminal = buildDriver({ currentStep: 1, scrollTop: LONG_STEP.start })
      terminal.flickFor(5_000)
      terminal.goQuiet()

      terminal.flickFor(TRIGGER)

      expect(terminal.onMoveDown).toHaveBeenCalledOnce()
    })

    it('reads 1:1 on the way there', () => {
      const terminal = buildDriver({ currentStep: 1, scrollTop: LONG_STEP.start })

      terminal.flickFor(240)

      expect(terminal.scroller.scrollTop).toBe(LONG_STEP.start + 240)
      expect(terminal.onDraw).toHaveBeenCalled()
    })
  })

  describe('going back through the cards of a section', () => {
    function buildAtLastCard() {
      const terminal = buildDriver({
        currentStep: LAST_CARD_INDEX,
        scrollTop: LAST_CARD.start,
        steps: STEPS_WITH_CARDS,
      })
      terminal.driver.direction = 'up'
      return terminal
    }

    it('reads 1:1 past the top of the card, and types nothing', () => {
      const terminal = buildAtLastCard()

      terminal.flickFor(-(TRIGGER + FLICK_PIXELS_A_FRAME))

      expect(terminal.scroller.scrollTop).toBe(LAST_CARD.start - (TRIGGER + FLICK_PIXELS_A_FRAME))
      expect(terminal.onMoveUp).not.toHaveBeenCalled()
      expect(terminal.onDraw).toHaveBeenCalled()
    })

    it('stops a swipe at the top of the section, and types nothing', () => {
      const terminal = buildAtLastCard()

      terminal.flickFor(-5_000)

      expect(terminal.scroller.scrollTop).toBe(FIRST_CARD.sectionStart)
      expect(terminal.onMoveUp).not.toHaveBeenCalled()
    })

    it('leaves the section only on a new swipe, begun at the top of it', () => {
      const terminal = buildAtLastCard()
      terminal.flickFor(-5_000)
      terminal.goQuiet()

      terminal.flickFor(-(TRIGGER - FLICK_PIXELS_A_FRAME))
      expect(terminal.onMoveUp).not.toHaveBeenCalled()
      terminal.flickFor(-FLICK_PIXELS_A_FRAME)

      expect(terminal.onMoveUp).toHaveBeenCalledOnce()
    })

    it('comes back down to the last line of what is printed, and stops there', () => {
      const terminal = buildAtLastCard()
      terminal.flickFor(-240)
      terminal.goQuiet()
      terminal.onMoveDown.mockClear()
      terminal.driver.direction = 'down'

      terminal.flickFor(5_000)

      expect(terminal.scroller.scrollTop).toBe(LAST_CARD.end)
      expect(terminal.onMoveDown).not.toHaveBeenCalled()
    })

    it('forgets a pull past the top of the section, and leaves the reader inside it', () => {
      const terminal = buildAtLastCard()
      terminal.flickFor(-5_000)
      terminal.goQuiet()
      terminal.flickFor(-FLICK_PIXELS_A_FRAME)

      vi.advanceTimersByTime(PULL_FORGOTTEN_AFTER_MILLISECONDS)

      expect(terminal.scroller.scrollTop).toBe(FIRST_CARD.sectionStart)
    })

    it('does not put a reader part way back through the output back at the card', () => {
      const terminal = buildAtLastCard()
      terminal.flickFor(-240)

      vi.advanceTimersByTime(PULL_FORGOTTEN_AFTER_MILLISECONDS)

      expect(terminal.scroller.scrollTop).toBe(LAST_CARD.start - 240)
    })

    it('does not jump for a scroll that is no gesture and stays in the section', () => {
      const terminal = buildAtLastCard()

      terminal.scroller.scrollTop = FIRST_CARD.sectionStart
      terminal.frame()
      vi.advanceTimersByTime(JUMP_SETTLE_MILLISECONDS)

      expect(terminal.onJump).not.toHaveBeenCalled()
      expect(terminal.onDraw).toHaveBeenCalled()
    })

    it('still jumps for one that lands further off than the next section', () => {
      const terminal = buildAtLastCard()

      terminal.scroller.scrollTop = 0
      terminal.frame()
      vi.advanceTimersByTime(JUMP_SETTLE_MILLISECONDS)

      expect(terminal.onJump).toHaveBeenCalledExactlyOnceWith(0, 0)
    })
  })

  describe('a swipe that stops short', () => {
    it('is forgotten, so a later nudge is not a few points from a command', () => {
      const terminal = buildDriver()
      terminal.flickFor(TRIGGER - FLICK_PIXELS_A_FRAME)

      vi.advanceTimersByTime(PULL_FORGOTTEN_AFTER_MILLISECONDS)
      expect(terminal.scroller.scrollTop).toBe(0)
      expect(terminal.onPullForgotten).toHaveBeenCalled()
      terminal.flickFor(TRIGGER - FLICK_PIXELS_A_FRAME)

      expect(terminal.onMoveDown).not.toHaveBeenCalled()
    })

    it('still counts towards the next if that comes straight after it', () => {
      const terminal = buildDriver()
      terminal.flickFor(TRIGGER - FLICK_PIXELS_A_FRAME)
      terminal.goQuiet()

      terminal.flickFor(FLICK_PIXELS_A_FRAME)

      expect(terminal.onMoveDown).toHaveBeenCalledOnce()
    })

    it('leaves the reader where they are inside the output', () => {
      const terminal = buildDriver({ currentStep: 1, scrollTop: LONG_STEP.start })
      terminal.flickFor(240)

      vi.advanceTimersByTime(PULL_FORGOTTEN_AFTER_MILLISECONDS)

      expect(terminal.scroller.scrollTop).toBe(LONG_STEP.start + 240)
    })

    it('does not reach back in to move a command that has started', () => {
      const terminal = buildDriver()
      terminal.flickFor(TRIGGER)
      terminal.startCommand()
      const heldAt = terminal.scroller.scrollTop

      vi.advanceTimersByTime(PULL_FORGOTTEN_AFTER_MILLISECONDS)

      expect(terminal.scroller.scrollTop).toBe(heldAt)
    })
  })

  describe('a scroll that is no gesture', () => {
    it('jumps straight to where a dragged scrollbar settled', () => {
      const terminal = buildDriver()

      terminal.scroller.scrollTop = LAST_STEP.start
      terminal.frame()
      vi.advanceTimersByTime(JUMP_SETTLE_MILLISECONDS)

      expect(terminal.onJump).toHaveBeenCalledExactlyOnceWith(2, LAST_STEP.start)
    })

    it('fast-forwards a running command once it has moved far enough', () => {
      const terminal = buildDriver()
      terminal.startCommand()

      terminal.scroller.scrollTop = SCROLL_WHILE_RUNNING_TO_FAST_FORWARD_PIXELS + 1
      terminal.frame()

      expect(terminal.onFastForward).toHaveBeenCalledOnce()
    })

    it('does not read a scroll set by the code as the reader moving', () => {
      const terminal = buildDriver()
      terminal.startCommand()

      terminal.driver.setScroll(LONG_STEP.start)
      terminal.frame()

      expect(terminal.onFastForward).not.toHaveBeenCalled()
    })
  })

  describe('a held key', () => {
    it('stays one gesture for as long as it is held', () => {
      const terminal = buildDriver({ currentStep: 1, scrollTop: LONG_STEP.start })

      for (let moved = 0; moved < 5_000; moved += FLICK_PIXELS_A_FRAME) {
        terminal.driver.noteScrollKey()
        terminal.scroller.scrollTop += FLICK_PIXELS_A_FRAME
        terminal.frame()
      }

      expect(terminal.scroller.scrollTop).toBe(LONG_STEP.end)
      expect(terminal.onMoveDown).not.toHaveBeenCalled()
    })
  })
})
