'use client'

import { useEffect, useState } from 'react'

import { THEME_CHANGED_EVENT, applyTheme, readIsDark } from './applyTheme'
import { THEME_COLOR } from './themeColor'

function setBrowserThemeColor(isDark: boolean): void {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', isDark ? THEME_COLOR.dark : THEME_COLOR.light)
}

/**
 * The site's theme. The pre-paint script already applied it, so this mirrors that decision into
 * state rather than working it out again, and follows every later change, whether the menu or the
 * typed shell made it. A choice made here is stored and wins from then on.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const isDarkNow = readIsDark()
    setIsDark(isDarkNow)
    setBrowserThemeColor(isDarkNow)
    const follow = () => setIsDark(readIsDark())
    window.addEventListener(THEME_CHANGED_EVENT, follow)
    return () => window.removeEventListener(THEME_CHANGED_EVENT, follow)
  }, [])

  const toggleTheme = () => {
    applyTheme(!isDark)
  }

  return { isDark, toggleTheme }
}
