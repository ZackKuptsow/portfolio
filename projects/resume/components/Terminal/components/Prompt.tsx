import { shortenPromptPath } from '../buildCommand'
import {
  PROMPT_HINT,
  PROMPT_HINT_FADE_MILLISECONDS,
  PROMPT_HINT_WAIT_MILLISECONDS,
} from '../constants'

import type { CSSProperties, RefObject } from 'react'

/** Set here so the times stay with the others in `constants.ts`. The stylesheet has the rest. */
const PROMPT_HINT_TIMING: CSSProperties = {
  animationDelay: `${PROMPT_HINT_WAIT_MILLISECONDS}ms`,
  animationDuration: `${PROMPT_HINT_FADE_MILLISECONDS}ms`,
}

type PromptProps = {
  path: string
  promptRef: RefObject<HTMLDivElement | null>
  typedRef: RefObject<HTMLSpanElement | null>
}

/**
 * The line the commands are typed into. The engine writes the characters, since they change many
 * times a second. It is decoration, like every prompt symbol: the commands say nothing the
 * sections do not.
 */
export function Prompt({ path, promptRef, typedRef }: PromptProps) {
  return (
    <div ref={promptRef} aria-hidden="true" className="terminal-prompt">
      <span className="terminal-prompt-path terminal-prompt-path-full">{path}</span>
      <span className="terminal-prompt-path terminal-prompt-path-short">
        {shortenPromptPath(path)}
      </span>{' '}
      <span className="command-prompt">$</span> <span ref={typedRef} className="terminal-typed" />
      <span className="terminal-cursor" />
      {/* The engine says which is due. Never on a phone, while anything runs, or after typing. */}
      <span
        className="terminal-prompt-hint terminal-prompt-hint-first-screen"
        style={PROMPT_HINT_TIMING}
      >
        {PROMPT_HINT.firstScreen}
      </span>
      <span
        className="terminal-prompt-hint terminal-prompt-hint-end-of-tour"
        style={PROMPT_HINT_TIMING}
      >
        {PROMPT_HINT.endOfTour}
      </span>
    </div>
  )
}
