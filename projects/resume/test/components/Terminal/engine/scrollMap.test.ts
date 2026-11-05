import { describe, expect, it } from 'vitest'

import { SCROLL_PAST_END_TO_TRIGGER_PIXELS } from '@/components/Terminal/constants'
import {
  findStepAt,
  keepPlaceInStep,
  mapStepsToScroll,
} from '@/components/Terminal/engine/scrollMap'

const USABLE_HEIGHT = 400

describe('mapStepsToScroll', () => {
  it('gives output that fits on screen no scrolling of its own', () => {
    const [step] = mapStepsToScroll([{ bottom: 300, clearsBefore: true, top: 32 }], USABLE_HEIGHT)

    expect(step).toEqual({ end: 0, length: 0, offsetEnd: 0, offsetStart: 0, start: 0 })
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

  it('leaves room between steps to scroll past the end and to come back', () => {
    const [first, second] = mapStepsToScroll(
      [
        { bottom: 1000, clearsBefore: true, top: 32 },
        { bottom: 300, clearsBefore: true, top: 32 },
      ],
      USABLE_HEIGHT,
    )

    expect(second.start - first.end).toBe(2 * SCROLL_PAST_END_TO_TRIGGER_PIXELS)
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
})

describe('keepPlaceInStep', () => {
  const previous = { end: 1200, length: 1000, offsetEnd: 1000, offsetStart: 0, start: 200 }
  const next = { end: 2400, length: 2000, offsetEnd: 2000, offsetStart: 0, start: 400 }

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
})
