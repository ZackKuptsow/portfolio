import { THEME_COLOR, THEME_STORAGE_KEY } from './themeColor'

const DARK_CLASS = 'dark'

/** Fired on `window` after the theme changes, so every `useTheme` on the page follows. */
export const THEME_CHANGED_EVENT = 'kups:theme-changed'

export function readIsDark(): boolean {
  return document.documentElement.classList.contains(DARK_CLASS)
}

/**
 * Switches the theme the way the pre-paint script set it: the class on `<html>`, the browser's
 * theme colour, and the stored choice that wins from then on. The menu and the typed shell both
 * call this, so there is one place the theme changes.
 */
export function applyTheme(isDark: boolean): void {
  document.documentElement.classList.toggle(DARK_CLASS, isDark)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', isDark ? THEME_COLOR.dark : THEME_COLOR.light)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
  } catch (error) {
    // The switch still works for this page. It just cannot be remembered.
    console.warn('The theme choice could not be stored', error)
  }
  window.dispatchEvent(new CustomEvent(THEME_CHANGED_EVENT))
}
