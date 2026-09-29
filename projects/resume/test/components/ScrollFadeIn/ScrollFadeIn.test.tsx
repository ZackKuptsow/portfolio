import { act, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ScrollFadeIn } from '@/components/ScrollFadeIn'

const BELOW_THE_FOLD = 1500
const DELAY_MILLISECONDS = 200
const ON_SCREEN = 100
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
// jsdom's own window is 768 tall. A different height proves the stub is what the code reads.
const VIEWPORT_HEIGHT = 900

type IntersectionCallback = (entries: { isIntersecting: boolean; target: Element }[]) => void
type ObserverRecord = {
  callback: IntersectionCallback
  disconnectCount: number
  observed: Element[]
  options: IntersectionObserverInit | undefined
}

let observers: ObserverRecord[] = []

class IntersectionObserverStub {
  private readonly record: ObserverRecord

  constructor(callback: IntersectionCallback, options?: IntersectionObserverInit) {
    this.record = { callback, disconnectCount: 0, observed: [], options }
    observers.push(this.record)
  }

  observe(element: Element): void {
    this.record.observed.push(element)
  }

  unobserve(): void {}

  disconnect(): void {
    this.record.disconnectCount += 1
  }
}

function placeSection({
  prefersReducedMotion,
  sectionTop,
}: {
  prefersReducedMotion: boolean
  sectionTop: number
}): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: prefersReducedMotion && query === REDUCED_MOTION_QUERY,
  }))
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: sectionTop,
  } as DOMRect)
}

function reportToObserver(isIntersecting: boolean): void {
  act(() => {
    observers.forEach(({ callback, observed }) =>
      observed.forEach((target) => callback([{ isIntersecting, target }])),
    )
  })
}

function advanceTime(milliseconds: number): void {
  act(() => {
    vi.advanceTimersByTime(milliseconds)
  })
}

function revealPhase(): string | null {
  return screen.getByText('section content').getAttribute('data-reveal-phase')
}

describe('ScrollFadeIn', () => {
  beforeEach(() => {
    observers = []
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub)
    vi.stubGlobal('innerHeight', VIEWPORT_HEIGHT)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is visible in the server-rendered page, before any script runs', () => {
    const serverMarkup = renderToString(<ScrollFadeIn>section content</ScrollFadeIn>)

    expect(serverMarkup).not.toContain('opacity-0')
    expect(serverMarkup).toContain('data-reveal-phase="untouched"')
  })

  it('hides a section that starts below the fold, then reveals it after the delay once it is scrolled to', () => {
    placeSection({ prefersReducedMotion: false, sectionTop: BELOW_THE_FOLD })
    render(<ScrollFadeIn delay={DELAY_MILLISECONDS}>section content</ScrollFadeIn>)
    expect(revealPhase()).toBe('hidden')

    reportToObserver(true)
    advanceTime(DELAY_MILLISECONDS - 1)
    expect(revealPhase()).toBe('hidden')

    advanceTime(1)
    expect(revealPhase()).toBe('revealed')
  })

  it('stays hidden while the browser reports the section is not in view', () => {
    placeSection({ prefersReducedMotion: false, sectionTop: BELOW_THE_FOLD })
    render(<ScrollFadeIn>section content</ScrollFadeIn>)

    // A real browser reports once as soon as it starts watching, in view or not.
    reportToObserver(false)
    advanceTime(DELAY_MILLISECONDS)

    expect(revealPhase()).toBe('hidden')
  })

  it('reveals as soon as any part of the section is in view, however tall the section is', () => {
    placeSection({ prefersReducedMotion: false, sectionTop: BELOW_THE_FOLD })
    render(<ScrollFadeIn>section content</ScrollFadeIn>)

    // A fraction of the section would never fit on screen once the section is
    // many screens tall, and the section would then stay hidden for good.
    expect(observers.map(({ options }) => options?.threshold)).toEqual([0])
  })

  it('still prints a section the visitor has not scrolled to', () => {
    placeSection({ prefersReducedMotion: false, sectionTop: BELOW_THE_FOLD })
    render(<ScrollFadeIn>section content</ScrollFadeIn>)

    // jsdom cannot lay a page out for print, so this pins the classes. Chrome's
    // print emulation is what shows the section is visible on paper.
    const hiddenSectionClasses = screen.getByText('section content').className.split(' ')

    expect(revealPhase()).toBe('hidden')
    expect(hiddenSectionClasses).toEqual(
      expect.arrayContaining(['print:opacity-100', 'print:translate-y-0']),
    )
  })

  it('leaves a section that starts on screen alone, and never watches it', () => {
    placeSection({ prefersReducedMotion: false, sectionTop: ON_SCREEN })
    render(<ScrollFadeIn>section content</ScrollFadeIn>)

    expect(revealPhase()).toBe('untouched')
    expect(observers).toEqual([])
  })

  it('hides nothing for a visitor who asked for less motion', () => {
    placeSection({ prefersReducedMotion: true, sectionTop: BELOW_THE_FOLD })
    render(<ScrollFadeIn>section content</ScrollFadeIn>)

    expect(revealPhase()).toBe('untouched')
    expect(observers).toEqual([])
  })

  it('stops watching and drops a pending reveal when it is removed from the page', () => {
    placeSection({ prefersReducedMotion: false, sectionTop: BELOW_THE_FOLD })
    const { unmount } = render(
      <ScrollFadeIn delay={DELAY_MILLISECONDS}>section content</ScrollFadeIn>,
    )
    reportToObserver(true)

    unmount()

    expect(observers.map(({ disconnectCount }) => disconnectCount)).toEqual([1])
    expect(vi.getTimerCount()).toBe(0)
  })
})
