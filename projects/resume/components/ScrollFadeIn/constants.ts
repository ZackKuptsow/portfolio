import type { RevealPhase } from './types'

/** A section counts as scrolled to once it is 50px inside the viewport's bottom edge. */
export const INTERSECTION_ROOT_MARGIN = '50px 0px -50px 0px'

/** How much of a section must be in view before it fades in. */
export const INTERSECTION_THRESHOLD = 0.1

/**
 * Classes for each phase. Only `revealed` carries the transition, so hiding a
 * section when the script starts is instant and never seen as a fade-out.
 */
export const PHASE_CLASS_NAME: Record<RevealPhase, string> = {
  hidden: 'opacity-0 translate-y-8',
  revealed: 'opacity-100 translate-y-0 transition-all duration-700 ease-out',
  untouched: '',
}

/** Media query for the visitor's reduced-motion setting. */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
