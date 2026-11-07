import { describe, expect, it } from 'vitest'

import { promptHintAt } from '@/components/Terminal/engine/promptHint'

const STEP_END = 400
const ON_ARRIVAL = { hasMovedOn: false, isLastStep: false, scrollTop: 0, stepEnd: STEP_END }
const ON_THE_LAST_STEP = { ...ON_ARRIVAL, hasMovedOn: true, isLastStep: true }

describe('promptHintAt', () => {
  it('tells someone who has not moved yet that the page scrolls', () => {
    expect(promptHintAt(ON_ARRIVAL)).toBe('first-screen')
  })

  it('says nothing once they have moved on, wherever they are', () => {
    expect(promptHintAt({ ...ON_ARRIVAL, hasMovedOn: true })).toBeNull()
    expect(promptHintAt({ ...ON_ARRIVAL, hasMovedOn: true, scrollTop: STEP_END })).toBeNull()
  })

  it('says nothing on the last step while there is still output to scroll to', () => {
    expect(promptHintAt({ ...ON_THE_LAST_STEP, scrollTop: STEP_END - 10 })).toBeNull()
  })

  it('offers the shell when there is nothing left to scroll', () => {
    expect(promptHintAt({ ...ON_THE_LAST_STEP, scrollTop: STEP_END })).toBe('end-of-tour')
  })

  it('counts a scroll a pixel short of the end, as a browser can stop there', () => {
    expect(promptHintAt({ ...ON_THE_LAST_STEP, scrollTop: STEP_END - 1 })).toBe('end-of-tour')
  })

  it('counts the room past the end', () => {
    expect(promptHintAt({ ...ON_THE_LAST_STEP, scrollTop: STEP_END + 100 })).toBe('end-of-tour')
  })

  it('does not tell someone to scroll when the page opens with nothing left to scroll', () => {
    const openedAtTheEnd = { ...ON_THE_LAST_STEP, hasMovedOn: false, scrollTop: STEP_END }

    expect(promptHintAt(openedAtTheEnd)).toBe('end-of-tour')
  })
})
