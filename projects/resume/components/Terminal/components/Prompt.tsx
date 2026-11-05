import type { RefObject } from 'react'

const HOME_PATH = '~'

/** The last folder of a path, for a phone: `~/portfolio/skills` becomes `~/skills`. */
function shortenPath(path: string): string {
  return path === HOME_PATH ? path : `${HOME_PATH}/${path.split('/').pop()}`
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
        {shortenPath(path)}
      </span>{' '}
      <span className="command-prompt">$</span> <span ref={typedRef} className="terminal-typed" />
      <span className="terminal-cursor" />
    </div>
  )
}
