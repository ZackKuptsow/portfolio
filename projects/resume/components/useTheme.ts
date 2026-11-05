'use client'

import { useEffect, useState } from 'react'

import { THEME_COLOR, THEME_STORAGE_KEY } from './themeColor'

const DARK_CLASS = 'dark'

function setBrowserThemeColor(isDark: boolean): void {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', isDark ? THEME_COLOR.dark : THEME_COLOR.light)
}

/**
 * The site's theme. The pre-paint script already applied it, so this mirrors that decision into
 * state rather than working it out again. A choice made here is stored and wins from then on.
 */
export function useTheme() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const isDarkNow = document.documentElement.classList.contains(DARK_CLASS)
    setIsDark(isDarkNow)
    setBrowserThemeColor(isDarkNow)
  }, [])

  const toggleTheme = () => {
    const nextIsDark = !isDark
    setIsDark(nextIsDark)
    document.documentElement.classList.toggle(DARK_CLASS, nextIsDark)
    setBrowserThemeColor(nextIsDark)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextIsDark ? 'dark' : 'light')
    } catch (error) {
      // The switch still works for this page. It just cannot be remembered.
      console.warn('The theme choice could not be stored', error)
    }
  }

  return { isDark, toggleTheme }
}
