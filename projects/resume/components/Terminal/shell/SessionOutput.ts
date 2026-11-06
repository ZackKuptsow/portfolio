/** Marks a container the typed shell prints into. The layout measures it with its step. */
export const SESSION_OUTPUT_ATTRIBUTE = 'data-session-output'
const CONTAINER_CLASS = 'terminal-session'
const BLANK_CLASS = 'terminal-session-blank'

/**
 * Where typed output goes: a container after the block of the current step, never inside it (the
 * hero block centers its children). Each card typed on keeps its own, because what is printed stays
 * printed, and the order on screen is the order things happened. Each is read aloud as it prints, so
 * an egg a screen reader user finds is heard. All of them go when the screen changes.
 */
export class SessionOutput {
  private readonly containers = new Map<HTMLElement, HTMLElement>()
  private current: HTMLElement | null = null

  /** The container the shell is printing into now. */
  get element(): HTMLElement | null {
    return this.current
  }

  /** This block's container, made if it has none, which is where printing goes from now on. */
  ensureAfter(block: HTMLElement): HTMLElement {
    const existing = this.containers.get(block)
    if (existing) {
      this.current = existing
      return existing
    }
    const container = document.createElement('div')
    container.className = CONTAINER_CLASS
    container.setAttribute(SESSION_OUTPUT_ATTRIBUTE, '')
    container.setAttribute('aria-live', 'polite')
    block.after(container)
    this.containers.set(block, container)
    this.current = container
    return container
  }

  append(nodes: readonly HTMLElement[]): void {
    if (!this.current) {
      throw new Error('The shell has no session container to print into')
    }
    this.current.append(...nodes)
  }

  /** A typed `clear`: a blank the height of the screen, so what was printed scrolls out of view. */
  appendBlankScreen(heightPixels: number): void {
    const blank = document.createElement('div')
    blank.className = BLANK_CLASS
    blank.style.height = `${heightPixels}px`
    this.append([blank])
  }

  /** Takes every container off the page, and says whether there was any to take. */
  remove(): boolean {
    const hadOutput = this.containers.size > 0
    for (const container of this.containers.values()) {
      container.remove()
    }
    this.containers.clear()
    this.current = null
    return hadOutput
  }
}
