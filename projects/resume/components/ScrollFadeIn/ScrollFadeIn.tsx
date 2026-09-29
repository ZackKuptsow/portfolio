'use client'

import { PHASE_CLASS_NAME } from './constants'
import { useRevealOnScroll } from './hooks'

type ScrollFadeInProps = {
  children: React.ReactNode
  className?: string
  /** Milliseconds to wait after the section is scrolled to before it fades in. */
  delay?: number
}

/**
 * Fade a section in when it is scrolled to.
 *
 * The server renders the section visible, and only the running script can hide
 * it. A visitor whose script is blocked or fails to load still reads the page.
 */
export function ScrollFadeIn({ children, className = '', delay = 0 }: ScrollFadeInProps) {
  const { phase, ref } = useRevealOnScroll<HTMLDivElement>(delay)

  return (
    <div
      ref={ref}
      className={`${PHASE_CLASS_NAME[phase]} ${className}`.trim()}
      data-reveal-phase={phase}
    >
      {children}
    </div>
  )
}
