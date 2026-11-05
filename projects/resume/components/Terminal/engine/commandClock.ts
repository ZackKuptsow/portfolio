/**
 * The timer behind everything a command does on its own time. Fast-forwarding runs whatever is
 * waiting at once and then every later wait at once, so a long pause cannot hold up a reader who
 * has already asked to skip it.
 */
export class CommandClock {
  private pendingCallback: (() => void) | null = null
  private timer: ReturnType<typeof setTimeout> | undefined

  /** Set by the reader scrolling on or clicking, until the next command starts. */
  isFastForwarding = false

  after(milliseconds: number, callback: () => void): void {
    if (this.isFastForwarding) {
      callback()
      return
    }
    this.pendingCallback = callback
    this.timer = setTimeout(() => {
      this.pendingCallback = null
      callback()
    }, milliseconds)
  }

  fastForward(): void {
    this.isFastForwarding = true
    const callback = this.pendingCallback
    if (!callback) {
      return
    }
    clearTimeout(this.timer)
    this.pendingCallback = null
    callback()
  }

  /** Drops whatever is waiting, ready for a new command. */
  reset(): void {
    clearTimeout(this.timer)
    this.pendingCallback = null
    this.isFastForwarding = false
  }
}
