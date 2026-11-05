import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PRE_PAINT_SCRIPT } from '@/app/prePaintScript'

const FAILSAFE_MILLISECONDS = 6_000

/** Runs the script as the browser does, against this document. */
function runScript(): void {
  new Function(PRE_PAINT_SCRIPT)()
}

function stubMatchMedia(matches: (query: string) => boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: matches(query) }))
}

describe('the pre-paint script', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    document.documentElement.className = ''
    document.body.innerHTML = ''
    localStorage.clear()
    stubMatchMedia(() => false)
  })

  afterEach(() => {
    vi.useRealTimers()
    document.documentElement.className = ''
  })

  it('opens dark for everyone, whatever the system prefers', () => {
    stubMatchMedia((query) => query === '(prefers-color-scheme: light)')

    runScript()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('lets a stored choice of light win', () => {
    localStorage.setItem('theme', 'light')

    runScript()

    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('stays dark, and still runs, when storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage is blocked')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    runScript()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('terminal-on')).toBe(true)
    expect(warn).toHaveBeenCalledOnce()
  })

  it('turns the terminal on, so a visitor never sees every section stacked up', () => {
    runScript()

    expect(document.documentElement.classList.contains('terminal-on')).toBe(true)
  })

  it('leaves the plain flow for a visitor who asks for reduced motion', () => {
    stubMatchMedia((query) => query === '(prefers-reduced-motion: reduce)')

    runScript()

    expect(document.documentElement.classList.contains('terminal-on')).toBe(false)
    vi.advanceTimersByTime(FAILSAFE_MILLISECONDS)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('falls back to the plain flow if the script has not taken over in time', () => {
    runScript()

    vi.advanceTimersByTime(FAILSAFE_MILLISECONDS - 1)
    expect(document.documentElement.classList.contains('terminal-on')).toBe(true)

    vi.advanceTimersByTime(1)
    expect(document.documentElement.classList.contains('terminal-on')).toBe(false)
    expect(document.documentElement.classList.contains('script-running')).toBe(false)
  })

  it('leaves the terminal alone once the script has taken over', () => {
    runScript()
    document.body.innerHTML = '<div data-engine-ready></div>'

    vi.advanceTimersByTime(FAILSAFE_MILLISECONDS)

    expect(document.documentElement.classList.contains('terminal-on')).toBe(true)
  })
})
