/** What the typed line needs from the shell around it. */
export type TypedInputHost = {
  /** Completions for the last word: command names, or the entries of the folder it names. */
  complete: (prefix: string) => readonly string[]
  /** Characters the prompt's reserved rows can hold, so typing never covers a line of output. */
  maxLength: () => number
  onSubmit: (line: string) => void
  /** The prompt's span the characters appear in, the one the tour types into. */
  typed: HTMLElement
}

const PRINTABLE_KEY_LENGTH = 1
const WORD_SEPARATOR = ' '
/** Keys the shell takes once the line has text, and does nothing with: the line is edited at its end. */
const CONSUMED_WITH_TEXT = new Set(['ArrowLeft', 'ArrowRight', 'End', 'Home'])
const CLEARING_CONTROL_KEYS = new Set(['c', 'u'])

function commonPrefix(words: readonly string[]): string {
  return words.reduce((prefix, word) => {
    let length = 0
    while (length < prefix.length && length < word.length && prefix[length] === word[length]) {
      length += 1
    }
    return prefix.slice(0, length)
  })
}

/**
 * The line a visitor types at the prompt. Type-anywhere: a printable key starts it, and while it is
 * empty every key is the engine's, so Space scrolls and Tab moves focus as they do today. With text
 * in it, Space is a character, Tab completes, Up and Down recall, and Enter submits.
 */
export class TypedInput {
  private readonly host: TypedInputHost
  private readonly history: string[] = []
  /** Where Up and Down are in the history; the history's length means "not browsing". */
  private historyIndex = 0
  /** What was typed before browsing the history, which Down past the newest entry brings back. */
  private draft = ''
  private text = ''

  constructor(host: TypedInputHost) {
    this.host = host
  }

  get line(): string {
    return this.text
  }

  recordHistory(line: string): void {
    this.history.push(line)
    this.historyIndex = this.history.length
  }

  clearLine(): void {
    this.setLine('')
    this.historyIndex = this.history.length
  }

  /** True when the key was the shell's. False leaves it to the engine. */
  handleKey(event: KeyboardEvent): boolean {
    if (event.ctrlKey && !event.metaKey && !event.altKey && CLEARING_CONTROL_KEYS.has(event.key)) {
      this.clearLine()
      return true
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return false
    }
    if (event.key.length === PRINTABLE_KEY_LENGTH) {
      return this.handlePrintable(event)
    }
    if (this.text.length === 0) {
      return false
    }
    return this.handleEditingKey(event)
  }

  private handlePrintable(event: KeyboardEvent): boolean {
    if (event.key === WORD_SEPARATOR && this.text.length === 0) {
      return false
    }
    event.preventDefault()
    if (this.text.length < this.host.maxLength()) {
      this.setLine(this.text + event.key)
    }
    return true
  }

  private handleEditingKey(event: KeyboardEvent): boolean {
    switch (event.key) {
      case 'Enter': {
        const line = this.text
        this.clearLine()
        this.host.onSubmit(line)
        return true
      }
      case 'Backspace':
        event.preventDefault()
        this.setLine(this.text.slice(0, -1))
        return true
      case 'Escape':
        this.clearLine()
        return true
      case 'Tab':
        event.preventDefault()
        this.completeLastWord()
        return true
      case 'ArrowUp':
        event.preventDefault()
        this.recall(-1)
        return true
      case 'ArrowDown':
        event.preventDefault()
        this.recall(1)
        return true
      default:
        if (CONSUMED_WITH_TEXT.has(event.key)) {
          event.preventDefault()
          return true
        }
        return false
    }
  }

  private recall(step: number): void {
    if (this.historyIndex === this.history.length) {
      this.draft = this.text
    }
    const next = Math.min(this.history.length, Math.max(0, this.historyIndex + step))
    this.historyIndex = next
    this.setLine(next === this.history.length ? this.draft : this.history[next])
  }

  private completeLastWord(): void {
    const words = this.text.split(WORD_SEPARATOR)
    const prefix = words[words.length - 1]
    const candidates = this.host.complete(prefix)
    if (candidates.length === 0) {
      return
    }
    const completion = candidates.length === 1 ? candidates[0] : commonPrefix(candidates)
    if (completion.length <= prefix.length) {
      return
    }
    this.setLine([...words.slice(0, -1), completion].join(WORD_SEPARATOR))
  }

  private setLine(text: string): void {
    this.text = text
    this.host.typed.textContent = text
  }
}
