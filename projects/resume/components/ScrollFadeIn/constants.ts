import type { RevealPhase } from './types'

/**
 * The window a section is measured against: the viewport, moved up by 50px.
 * A section has to rise 50px past the bottom edge before any of it counts, and
 * one up to 50px above the top edge still counts, which matters when a visitor
 * jumps past a section and scrolls back up. Order: top, right, bottom, left.
 */
export const INTERSECTION_ROOT_MARGIN = '50px 0px -50px 0px'

/**
 * Reveal as soon as any part of a section is inside that window.
 *
 * This must stay 0. A threshold is a fraction of the section's own height, so
 * a section more than ten screens tall can never show a tenth of itself, and
 * it would stay hidden for good. Measured in Chrome at 375x667 with the old
 * value of 0.1: the work experience section, 7,376px tall, never appeared.
 */
export const INTERSECTION_THRESHOLD = 0

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
