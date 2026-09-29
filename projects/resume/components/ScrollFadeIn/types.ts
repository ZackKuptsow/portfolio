/**
 * Where a section is in its fade-in.
 *
 * - `untouched`: as the server rendered it. Visible, with no animation.
 * - `hidden`: waiting out of view, to fade in when it is scrolled to.
 * - `revealed`: faded in.
 */
export type RevealPhase = 'hidden' | 'revealed' | 'untouched'

/** What the script may choose for a section when it starts. */
export type InitialRevealPhase = Exclude<RevealPhase, 'revealed'>

/** What the policy is told about a section when the script starts. */
export type SectionPosition = {
  /** Whether the visitor's system asks for reduced motion. */
  prefersReducedMotion: boolean
  /** Distance in pixels from the top of the viewport to the top of the section. */
  sectionTop: number
  /** Height of the viewport in pixels. */
  viewportHeight: number
}
