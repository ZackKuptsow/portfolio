import type { InitialRevealPhase, SectionPosition } from './types'

/**
 * Decide how a section starts once the script is running.
 *
 * The server always renders a section visible, so a page whose script never
 * loads is still readable. This runs once per section after the script starts,
 * and chooses between leaving the section as it is and hiding it so it can
 * fade in when scrolled to.
 *
 * Only a section that starts below the viewport is hidden. Hiding one the
 * visitor can already see would make it blink out and fade back, and one above
 * the viewport has already been scrolled past. A visitor who asked for less
 * motion gets no effect at all.
 */
export function resolveInitialPhase({
  prefersReducedMotion,
  sectionTop,
  viewportHeight,
}: SectionPosition): InitialRevealPhase {
  if (prefersReducedMotion) {
    return 'untouched'
  }

  const startsBelowTheFold = sectionTop >= viewportHeight
  return startsBelowTheFold ? 'hidden' : 'untouched'
}
