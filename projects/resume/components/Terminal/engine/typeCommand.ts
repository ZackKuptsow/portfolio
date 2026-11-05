import {
  ENTER_PAUSE_MILLISECONDS,
  TYPING_FASTEST_CHARACTER_MILLISECONDS,
  TYPING_JITTER_LOWEST,
  TYPING_JITTER_RANGE,
  TYPING_SLOWEST_CHARACTER_MILLISECONDS,
  TYPING_TOTAL_MILLISECONDS,
} from '../constants'

import type { CommandClock } from './commandClock'

type TypeCommandOptions = {
  clock: CommandClock
  command: string
  /** Where the characters appear. */
  element: HTMLElement
  /** Runs after the pause for Enter. */
  onEntered: () => void
}

/** Types on its own time, whatever the scroll does, so that it looks like typing. */
export function typeCommand({ clock, command, element, onEntered }: TypeCommandOptions): void {
  const characterMilliseconds = Math.max(
    TYPING_FASTEST_CHARACTER_MILLISECONDS,
    Math.min(TYPING_SLOWEST_CHARACTER_MILLISECONDS, TYPING_TOTAL_MILLISECONDS / command.length),
  )
  let writtenCharacters = 0

  const typeNextCharacter = () => {
    writtenCharacters = clock.isFastForwarding ? command.length : writtenCharacters + 1
    element.textContent = command.slice(0, writtenCharacters)
    if (writtenCharacters >= command.length) {
      clock.after(ENTER_PAUSE_MILLISECONDS, onEntered)
      return
    }
    const jitter = TYPING_JITTER_LOWEST + Math.random() * TYPING_JITTER_RANGE
    clock.after(characterMilliseconds * jitter, typeNextCharacter)
  }

  typeNextCharacter()
}
