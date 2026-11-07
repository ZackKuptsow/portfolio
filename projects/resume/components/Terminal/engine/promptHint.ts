import { SCROLL_NOISE_PIXELS } from '../constants'

/** Which hint the prompt has due. The stylesheet shows it, after its wait, from `data-prompt-hint`. */
export type PromptHint = 'end-of-tour' | 'first-screen'

type PromptPlace = {
  /** They have scrolled or run something, so they know how the page works. */
  hasMovedOn: boolean
  isLastStep: boolean
  scrollTop: number
  stepEnd: number
}

/**
 * The prompt says nothing while someone is reading. It speaks up where they may have stopped: at the
 * start, to say the page scrolls, and with nothing left to scroll, to say there is still the shell.
 */
export function promptHintAt({
  hasMovedOn,
  isLastStep,
  scrollTop,
  stepEnd,
}: PromptPlace): PromptHint | null {
  if (isLastStep && scrollTop >= stepEnd - SCROLL_NOISE_PIXELS) {
    return 'end-of-tour'
  }
  return hasMovedOn ? null : 'first-screen'
}
