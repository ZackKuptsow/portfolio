'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Render a soft radial glow that follows the pointer on non-touch devices.
 *
 * The glow is disabled on small/touch screens and when the visitor prefers
 * reduced motion. Pointer updates are coalesced into a single animation frame
 * so rapid pointer events never trigger more than one style write per frame.
 */
export default function GlowCursor() {
  const glowElementRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const evaluateShouldRender = () => {
      const isTouchOrSmallScreen = window.innerWidth < 768 || 'ontouchstart' in window
      setShouldRender(!isTouchOrSmallScreen && !prefersReducedMotion)
    }

    evaluateShouldRender()
    window.addEventListener('resize', evaluateShouldRender)

    return () => window.removeEventListener('resize', evaluateShouldRender)
  }, [])

  useEffect(() => {
    if (!shouldRender) return

    const applyGlowAtCursor = (clientX: number, clientY: number) => {
      const glowElement = glowElementRef.current
      if (!glowElement) return

      const viewportWidth = window.innerWidth
      const glowRadius = Math.min(40 + viewportWidth * 0.015, 75)
      const blurAmount = Math.min(7.5 + viewportWidth * 0.0025, 12.5)

      glowElement.style.setProperty('--mouse-x', `${clientX}px`)
      glowElement.style.setProperty('--mouse-y', `${clientY}px`)
      glowElement.style.background = `radial-gradient(circle at ${clientX}px ${clientY}px, var(--glow-color), transparent ${glowRadius}px)`
      glowElement.style.filter = `blur(${blurAmount}px)`
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = requestAnimationFrame(() =>
        applyGlowAtCursor(event.clientX, event.clientY),
      )

      setIsVisible(true)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = setTimeout(() => setIsVisible(false), 500)
    }

    document.addEventListener('pointermove', handlePointerMove)

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current)
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    }
  }, [shouldRender])

  if (!shouldRender) return null

  return (
    <div
      ref={glowElementRef}
      className={`glow-cursor pointer-events-none fixed inset-0 z-10 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    />
  )
}
