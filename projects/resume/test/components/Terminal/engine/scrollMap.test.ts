import { describe, expect, it } from 'vitest'

import { SCROLL_PAST_END_TO_TRIGGER_PIXELS } from '@/components/Terminal/constants'
import {
  countStepsOutsideSection,
  findStepAt,
  keepPlaceInStep,
  mapStepsToScroll,
  offsetAt,
} from '@/components/Terminal/engine/scrollMap'

const USABLE_HEIGHT = 400
const TRIGGER = SCROLL_PAST_END_TO_TRIGGER_PIXELS

describe('mapStepsToScroll', () => {
  it('gives output that fits on screen no scrolling of its own', () => {
    const [step] = mapStepsToScroll([{ bottom: 300, clearsBefore: true, top: 32 }], USABLE_HEIGHT)

    expect(step).toEqual({
      end: 0,
      length: 0,
      offsetEnd: 0,
      offsetStart: 0,
      sectionStart: 0,
      start: 0,
    })
  })

  it('lets long output scroll exactly as far as its last line needs', () => {
    const [step] = mapStepsToScroll([{ bottom: 1000, clearsBefore: true, top: 32 }], USABLE_HEIGHT)

    expect(step.offsetEnd).toBe(1000 - USABLE_HEIGHT)
    expect(step.length).toBe(1000 - USABLE_HEIGHT)
    expect(step.offsetEnd + USABLE_HEIGHT).toBe(1000)
  })

  it('starts a cleared screen at the top of its scene, so the padding above it shows', () => {
    const [step] = mapStepsToScroll([{ bottom: 300, clearsBefore: true, top: 32 }], USABLE_HEIGHT)

    expect(step.offsetStart).toBe(0)
  })

  it('keeps earlier cards on screen when the next one fits under them', () => {
    const [, second] = mapStepsToScroll(
      [
        { bottom: 200, clearsBefore: true, top: 32 },
        { bottom: 350, clearsBefore: false, top: 232 },
      ],
      USABLE_HEIGHT,
    )

    expect(second.offsetStart).toBe(0)
    expect(second.length).toBe(0)
  })

  it('starts a card at its own top when it is too long to fit under the last one', () => {
    const [, second] = mapStepsToScroll(
      [
        { bottom: 200, clearsBefore: true, top: 32 },
        { bottom: 900, clearsBefore: false, top: 232 },
      ],
      USABLE_HEIGHT,
    )

    expect(second.offsetStart).toBe(232)
    expect(second.offsetEnd).toBe(500)
  })

  it('leaves room between sections to scroll past the end and to come back', () => {
    const [first, second] = mapStepsToScroll(
      [
        { bottom: 1000, clearsBefore: true, top: 32 },
        { bottom: 300, clearsBefore: true, top: 32 },
      ],
      USABLE_HEIGHT,
    )

    expect(second.start - first.end).toBe(2 * TRIGGER)
    expect(second.sectionStart).toBe(second.start)
  })

  describe('inside a section', () => {
    const [before, first, second, third, after] = mapStepsToScroll(
      [
        { bottom: 300, clearsBefore: true, top: 32 },
        { bottom: 500, clearsBefore: true, top: 32 },
        { bottom: 900, clearsBefore: false, top: 532 },
        { bottom: 1000, clearsBefore: false, top: 932 },
        { bottom: 300, clearsBefore: true, top: 32 },
      ],
      USABLE_HEIGHT,
    )

    it('gives every card the same section start, and no other section the same one', () => {
      expect(first.sectionStart).toBe(before.end + 2 * TRIGGER)
      expect(second.sectionStart).toBe(first.sectionStart)
      expect(third.sectionStart).toBe(first.sectionStart)
      expect(after.sectionStart).toBe(third.end + 2 * TRIGGER)
    })

    // A gap on the track here would be a stretch where the scroll moves and the output does not.
    it('lays the scroll over the output 1:1, with no gap between cards', () => {
      for (const card of [first, second, third]) {
        expect(card.start - card.sectionStart).toBe(card.offsetStart)
        expect(card.end - card.sectionStart).toBe(card.offsetEnd)
      }
    })
  })
})

describe('offsetAt', () => {
  const [, second] = mapStepsToScroll(
    [
      { bottom: 300, clearsBefore: true, top: 32 },
      { bottom: 1000, clearsBefore: true, top: 32 },
    ],
    USABLE_HEIGHT,
  )

  it('moves the output 1:1 with the scroll', () => {
    expect(offsetAt(second, second.sectionStart + 123)).toBe(123)
  })

  it('stays inside what is printed, either side of it', () => {
    expect(offsetAt(second, second.sectionStart - 50)).toBe(0)
    expect(offsetAt(second, second.end + 50)).toBe(second.offsetEnd)
  })
})

describe('findStepAt', () => {
  const steps = mapStepsToScroll(
    [
      { bottom: 1000, clearsBefore: true, top: 32 },
      { bottom: 300, clearsBefore: true, top: 32 },
    ],
    USABLE_HEIGHT,
  )

  it('answers the furthest step whose start the scroll has reached', () => {
    expect(findStepAt(steps, 0)).toBe(0)
    expect(findStepAt(steps, steps[1].start - 1)).toBe(0)
    expect(findStepAt(steps, steps[1].start)).toBe(1)
  })

  // Zack: "My eleg entry is being completely skipped." Two cards that fit on screen end in the same
  // place, so reading past the end of the first must not read as past the end of the second too.
  it('does not carry the scroll into the next section for cards that fit on screen', () => {
    const fittingCards = mapStepsToScroll(
      [
        { bottom: 200, clearsBefore: true, top: 32 },
        { bottom: 350, clearsBefore: false, top: 232 },
        { bottom: 300, clearsBefore: true, top: 32 },
      ],
      USABLE_HEIGHT,
    )
    expect(fittingCards[0].end).toBe(fittingCards[1].end)

    expect(findStepAt(fittingCards, fittingCards[0].end + TRIGGER)).toBe(1)
    expect(findStepAt(fittingCards, fittingCards[2].start)).toBe(2)
  })
})

describe('countStepsOutsideSection', () => {
  const steps = mapStepsToScroll(
    [
      { bottom: 300, clearsBefore: true, top: 32 },
      { bottom: 300, clearsBefore: true, top: 32 },
      { bottom: 500, clearsBefore: true, top: 32 },
      { bottom: 900, clearsBefore: false, top: 532 },
      { bottom: 1300, clearsBefore: false, top: 932 },
      { bottom: 300, clearsBefore: true, top: 32 },
      { bottom: 300, clearsBefore: true, top: 32 },
    ],
    USABLE_HEIGHT,
  )

  it('counts nothing for any card of the same section', () => {
    expect(countStepsOutsideSection(steps, 4, 2)).toBe(0)
    expect(countStepsOutsideSection(steps, 2, 4)).toBe(0)
  })

  it('counts from the edge of the section, wherever in it the current card is', () => {
    expect(countStepsOutsideSection(steps, 4, 1)).toBe(1)
    expect(countStepsOutsideSection(steps, 2, 5)).toBe(1)
    expect(countStepsOutsideSection(steps, 4, 0)).toBe(2)
    expect(countStepsOutsideSection(steps, 2, 6)).toBe(2)
  })
})

describe('keepPlaceInStep', () => {
  const previous = {
    end: 1200,
    length: 1000,
    offsetEnd: 1000,
    offsetStart: 0,
    sectionStart: 200,
    start: 200,
  }
  const next = {
    end: 2400,
    length: 2000,
    offsetEnd: 2000,
    offsetStart: 0,
    sectionStart: 400,
    start: 400,
  }

  it('keeps the same point in the step when a re-measure changes how long it is', () => {
    expect(keepPlaceInStep(previous, next, 200 + 250)).toBe(400 + 500)
  })

  it('stays inside the new step when the scroll had run past the end of the old one', () => {
    expect(keepPlaceInStep(previous, next, 1290)).toBe(next.end)
  })

  it('goes to the start of a step with nothing to scroll', () => {
    expect(keepPlaceInStep({ ...previous, length: 0 }, next, 300)).toBe(next.start)
    expect(keepPlaceInStep(previous, { ...next, length: 0 }, 300)).toBe(next.start)
  })

  describe('going back through what is printed above the step', () => {
    const laterCard = { ...previous, sectionStart: 200, start: 800 }
    const laterCardNext = { ...next, sectionStart: 400, start: 1400 }

    it('keeps the same share of the way back', () => {
      expect(keepPlaceInStep(laterCard, laterCardNext, 200 + 150)).toBe(400 + 250)
    })

    it('stays in the section when the scroll had run above the top of it', () => {
      expect(keepPlaceInStep(laterCard, laterCardNext, 100)).toBe(laterCardNext.sectionStart)
    })
  })
})
