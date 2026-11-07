import { shortenPromptPath } from '../buildCommand'
import { PROMPT_HINT } from '../constants'

import type { RefObject } from 'react'

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
      {/* Hidden by the stylesheet on a phone, while anything runs, and once a line has been typed. */}
      <span className="terminal-prompt-hint">{PROMPT_HINT}</span>
    </div>
  )
}
