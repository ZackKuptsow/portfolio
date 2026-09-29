import { useEffect, useRef, useState } from 'react'

import { INTERSECTION_ROOT_MARGIN, INTERSECTION_THRESHOLD, REDUCED_MOTION_QUERY } from './constants'
import { resolveInitialPhase } from './resolveInitialPhase'

import type { RevealPhase } from './types'
import type { RefObject } from 'react'

type RevealOnScroll<ElementType extends HTMLElement> = {
  phase: RevealPhase
  ref: RefObject<ElementType | null>
}

/**
 * Track a section's fade-in. It starts `untouched`, which is how the server
 * rendered it, and the policy in `resolveInitialPhase` decides whether the
 * script hides it to fade in later.
 */
export function useRevealOnScroll<ElementType extends HTMLElement>(
  delayMilliseconds: number,
): RevealOnScroll<ElementType> {
  const [phase, setPhase] = useState<RevealPhase>('untouched')
  const ref = useRef<ElementType>(null)

  useEffect(() => {
    const section = ref.current
    if (!section) {
      return
    }

    const initialPhase = resolveInitialPhase({
      prefersReducedMotion: window.matchMedia(REDUCED_MOTION_QUERY).matches,
      sectionTop: section.getBoundingClientRect().top,
      viewportHeight: window.innerHeight,
    })
    if (initialPhase === 'untouched') {
      return
    }

    setPhase(initialPhase)
    let revealTimer: ReturnType<typeof setTimeout> | undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return
        }
        revealTimer = setTimeout(() => setPhase('revealed'), delayMilliseconds)
        observer.unobserve(entry.target)
      },
      { rootMargin: INTERSECTION_ROOT_MARGIN, threshold: INTERSECTION_THRESHOLD },
    )
    observer.observe(section)

    return () => {
      observer.disconnect()
      clearTimeout(revealTimer)
    }
  }, [delayMilliseconds])

  return { phase, ref }
}
