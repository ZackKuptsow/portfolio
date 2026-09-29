import { act, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ScrollFadeIn } from '@/components/ScrollFadeIn'
import { resolveInitialPhase } from '@/components/ScrollFadeIn/resolveInitialPhase'

// The policy is a separate decision with its own tests. Here it is replaced, so
// these tests pin what the component does with each answer the policy can give.
vi.mock('@/components/ScrollFadeIn/resolveInitialPhase', () => ({
  resolveInitialPhase: vi.fn(),
}))

const DELAY_MILLISECONDS = 200
const SECTION_TOP = 1500
const VIEWPORT_HEIGHT = 768

type IntersectionCallback = (entries: { isIntersecting: boolean; target: Element }[]) => void

let observedSections: { callback: IntersectionCallback; element: Element }[] = []

class IntersectionObserverStub {
  private readonly callback: IntersectionCallback

  constructor(callback: IntersectionCallback) {
    this.callback = callback
  }

  observe(element: Element): void {
    observedSections.push({ callback: this.callback, element })
  }

  unobserve(): void {}

  disconnect(): void {}
}

function scrollIntoView(): void {
  act(() => {
    observedSections.forEach(({ callback, element }) =>
      callback([{ isIntersecting: true, target: element }]),
    )
  })
}

function revealPhase(): string | null {
  return screen.getByText('section content').getAttribute('data-reveal-phase')
}

describe('ScrollFadeIn', () => {
  beforeEach(() => {
    observedSections = []
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
    vi.stubGlobal('innerHeight', VIEWPORT_HEIGHT)
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      top: SECTION_TOP,
    } as DOMRect)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is visible in the server-rendered page, before any script runs', () => {
    const serverMarkup = renderToString(<ScrollFadeIn>section content</ScrollFadeIn>)

    expect(serverMarkup).not.toContain('opacity-0')
    expect(serverMarkup).toContain('data-reveal-phase="untouched"')
  })

  it('hides a section the policy marks hidden, then reveals it after the delay once it scrolls into view', () => {
    vi.mocked(resolveInitialPhase).mockReturnValue('hidden')
    render(<ScrollFadeIn delay={DELAY_MILLISECONDS}>section content</ScrollFadeIn>)
    expect(revealPhase()).toBe('hidden')

    scrollIntoView()
    act(() => {
      vi.advanceTimersByTime(DELAY_MILLISECONDS - 1)
    })
    expect(revealPhase()).toBe('hidden')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(revealPhase()).toBe('revealed')
  })

  it('leaves a section the policy marks untouched alone, and never watches it', () => {
    vi.mocked(resolveInitialPhase).mockReturnValue('untouched')
    render(<ScrollFadeIn>section content</ScrollFadeIn>)

    expect(revealPhase()).toBe('untouched')
    expect(observedSections).toEqual([])
  })

  it('tells the policy where the section sits and whether the visitor asked for less motion', () => {
    vi.mocked(resolveInitialPhase).mockReturnValue('untouched')
    render(<ScrollFadeIn>section content</ScrollFadeIn>)

    expect(vi.mocked(resolveInitialPhase).mock.calls).toEqual([
      [{ prefersReducedMotion: true, sectionTop: SECTION_TOP, viewportHeight: VIEWPORT_HEIGHT }],
    ])
  })
})
