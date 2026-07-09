'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // The pre-paint script in the layout already applied the theme class;
    // mirror that decision into local state rather than recomputing it.
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    const nextIsDark = !isDark
    setIsDark(nextIsDark)
    localStorage.setItem('theme', nextIsDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', nextIsDark)
  }

  return (
    <button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      onClick={toggleTheme}
      className="absolute sm:fixed top-4 right-4 z-50 w-10 h-10 border border-border rounded hover:border-primary hover:shadow-glow transition-all duration-300 bg-card/50 backdrop-blur-sm"
    >
      <div className="terminal-glow-hover flex h-full w-full items-center justify-center font-mono text-2xl text-primary leading-none -mt-0.5">
        {isDark ? '◐' : '◑'}
      </div>
    </button>
  )
}
