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
      className="fixed top-4 right-4 z-50 w-6 h-6 border border-gray-400 dark:border-gray-600 rounded hover:border-emerald-400 transition-colors"
    >
      <div
        className={`w-4 h-4 mx-auto my-auto rounded-sm transition-colors duration-300 ${
          isDark ? 'bg-white' : 'bg-black'
        }`}
      />
    </button>
  )
}
