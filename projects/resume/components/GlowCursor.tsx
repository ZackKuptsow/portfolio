// components/MouseGlow.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

export default function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const glow = glowRef.current
      if (glow) {
        glow.style.setProperty('--mouse-x', `${e.clientX}px`)
        glow.style.setProperty('--mouse-y', `${e.clientY}px`)
      }
      setVisible(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setVisible(false), 500)
    }
    document.addEventListener('pointermove', handleMove)
    return () => document.removeEventListener('pointermove', handleMove)
  }, [])

  return (
    <div
      ref={glowRef}
      className={`pointer-events-none fixed inset-0 z-10 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background:
          'radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(16, 185, 129, 0.3), transparent 10%)',
        filter: 'blur(20px)',
        mixBlendMode: 'screen',
      }}
    />
  )
}