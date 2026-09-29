import type { InitialRevealPhase, SectionPosition } from './types'

/**
 * Decide how a section starts once the script is running.
 *
 * The server always renders a section visible, so a page whose script never
 * loads is still readable. This runs once per section after the script starts,
 * and chooses between leaving the section as it is and hiding it so it can
 * fade in when scrolled to.
 */
export function resolveInitialPhase(sectionPosition: SectionPosition): InitialRevealPhase {
  // TODO(zack): decide the policy. Until then nothing is hidden, so nothing fades in.
  void sectionPosition
  return 'untouched'
}
