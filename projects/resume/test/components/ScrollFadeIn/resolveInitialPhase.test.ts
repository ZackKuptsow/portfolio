import { describe, expect, it } from 'vitest'

import { resolveInitialPhase } from '@/components/ScrollFadeIn/resolveInitialPhase'

const VIEWPORT_HEIGHT = 768

describe('resolveInitialPhase', () => {
  it.each([
    { phase: 'hidden', sectionTop: 1500, situation: 'starts well below the fold' },
    { phase: 'hidden', sectionTop: 768, situation: 'starts exactly at the bottom edge' },
    { phase: 'untouched', sectionTop: 767, situation: 'has one pixel on screen' },
    { phase: 'untouched', sectionTop: 0, situation: 'starts at the top of the screen' },
    { phase: 'untouched', sectionTop: -400, situation: 'was already scrolled past' },
  ])('leaves a section $phase when it $situation', ({ phase, sectionTop }) => {
    expect(
      resolveInitialPhase({
        prefersReducedMotion: false,
        sectionTop,
        viewportHeight: VIEWPORT_HEIGHT,
      }),
    ).toBe(phase)
  })

  it('hides nothing for a visitor who asked for less motion, even below the fold', () => {
    expect(
      resolveInitialPhase({
        prefersReducedMotion: true,
        sectionTop: 1500,
        viewportHeight: VIEWPORT_HEIGHT,
      }),
    ).toBe('untouched')
  })
})
