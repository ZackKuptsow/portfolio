// components/MouseGlow.tsx
'use client'

import { useEffect, useRef, useState } from 'react'

export default function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only render glow cursor on non-mobile devices
    const checkDevice = () => {
      const isMobile = window.innerWidth < 768 || 'ontouchstart' in window
      setShouldRender(!isMobile)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  useEffect(() => {
    if (!shouldRender) return
    const handleMove = (e: PointerEvent) => {
      const glow = glowRef.current
      if (glow) {
        const width = window.innerWidth
        // Linear scaling: base size + proportional to screen width
        const baseRadius = 40 // base radius in pixels
        const scaleFactor = width * 0.015 // 1.5% of screen width
        const glowRadius = Math.min(baseRadius + scaleFactor, 75) // cap at 75px
        const blurAmount = Math.min(7.5 + (width * 0.0025), 12.5) // blur scales from 7.5px to max 12.5px
        
        const glowSize = `${glowRadius}px`
        const blurAmountPx = `${blurAmount}px`
        
        glow.style.setProperty('--mouse-x', `${e.clientX}px`)
        glow.style.setProperty('--mouse-y', `${e.clientY}px`)
        glow.style.background = `radial-gradient(circle at ${e.clientX}px ${e.clientY}px, var(--glow-color), transparent ${glowSize})`
        glow.style.filter = `blur(${blurAmountPx})`
      }
      setVisible(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setVisible(false), 500)
    }
    
    document.addEventListener('pointermove', handleMove)
    return () => document.removeEventListener('pointermove', handleMove)
  }, [shouldRender])

  if (!shouldRender) return null

  return (
    <div
      ref={glowRef}
      className={`glow-cursor pointer-events-none fixed inset-0 z-10 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{}}
    />
  )
}
