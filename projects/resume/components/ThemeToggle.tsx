'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldUseDark = stored ? stored === 'dark' : prefersDark

    document.documentElement.classList.toggle('dark', shouldUseDark)
    setIsDark(shouldUseDark)
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <button
      aria-label="Toggle dark mode"
      onClick={toggle}
      className="absolute sm:fixed top-4 right-4 z-50 w-10 h-10 border border-border rounded hover:border-primary hover:shadow-glow transition-all duration-300 bg-card/50 backdrop-blur-sm"
    >
      <div className="w-full h-full flex items-center justify-center font-mono text-2xl text-primary transition-all duration-300 hover:text-terminal leading-none -mt-0.5">
        {isDark ? '◐' : '◑'}
      </div>
    </button>
  )
}
