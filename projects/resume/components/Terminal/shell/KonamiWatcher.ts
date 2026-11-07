const CODE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const

/** Watches for the Konami code among the keys. It keeps no key but its place in the code. */
export class KonamiWatcher {
  private matched = 0

  /** True on the key that finishes the code. */
  note(key: string): boolean {
    if (key === CODE[this.matched]) {
      this.matched += 1
    } else {
      // A wrong key may still be the start of the code, as a third Up is.
      this.matched = key === CODE[0] ? 1 : 0
    }
    if (this.matched === CODE.length) {
      this.matched = 0
      return true
    }
    return false
  }
}
