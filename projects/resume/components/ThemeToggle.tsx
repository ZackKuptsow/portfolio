'use client'

import { useTheme } from './useTheme'

/**
 * The corner switch, for the pages without a terminal: the three SMS pages and the 404. On a
 * terminal the switch is an entry in its menu.
 */
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      onClick={toggleTheme}
      className="absolute sm:fixed top-4 right-4 z-50 w-11 h-11 border border-border rounded hover:border-primary hover:shadow-glow transition-all duration-300 bg-card/50 backdrop-blur-sm"
    >
      <div className="terminal-glow-hover flex h-full w-full items-center justify-center font-mono text-2xl text-primary leading-none -mt-0.5">
        {isDark ? '◐' : '◑'}
      </div>
    </button>
  )
}
