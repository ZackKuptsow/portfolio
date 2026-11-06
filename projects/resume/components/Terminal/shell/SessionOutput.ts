/** Marks the one container the typed shell prints into. The layout measures it with its step. */
export const SESSION_OUTPUT_ATTRIBUTE = 'data-session-output'
const CONTAINER_CLASS = 'terminal-session'
const BLANK_CLASS = 'terminal-session-blank'

/**
 * Where typed output goes: one container after the block of the current step, never inside it
 * (the hero block centers its children). It is read aloud as it prints, so an egg a screen reader
 * user finds is heard. Everything in it is removed when the screen changes.
 */
export class SessionOutput {
  private container: HTMLElement | null = null

  get element(): HTMLElement | null {
    return this.container
  }

  /** The container after this block, made if there is none there. Moving blocks removes the old one. */
  ensureAfter(block: HTMLElement): HTMLElement {
    if (this.container && this.container.previousElementSibling === block) {
      return this.container
    }
    this.remove()
    const container = document.createElement('div')
    container.className = CONTAINER_CLASS
    container.setAttribute(SESSION_OUTPUT_ATTRIBUTE, '')
    container.setAttribute('aria-live', 'polite')
    block.after(container)
    this.container = container
    return container
  }

  append(nodes: readonly HTMLElement[]): void {
    if (!this.container) {
      throw new Error('The shell has no session container to print into')
    }
    this.container.append(...nodes)
  }

  /** A typed `clear`: a blank the height of the screen, so what was printed scrolls out of view. */
  appendBlankScreen(heightPixels: number): void {
    const blank = document.createElement('div')
    blank.className = BLANK_CLASS
    blank.style.height = `${heightPixels}px`
    this.append([blank])
  }

  remove(): void {
    this.container?.remove()
    this.container = null
  }
}
