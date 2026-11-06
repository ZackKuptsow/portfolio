/**
 * The easter eggs the typed shell hides, as data. Each is prebuilt: the shell prints these lines
 * and never evaluates anything typed. Every line here is read by a visitor, so each is Zack's to
 * approve, and none holds an em dash or en dash (`test/data/terminalEasterEggs.test.ts`).
 *
 * The list ships empty. The first eggs are chosen on a decision page with Zack, and added here.
 */

/** A run of text in an output line, which may be a link to a fixed address. */
export type OutputSegment = {
  href?: string
  text: string
}

export type OutputLine = readonly OutputSegment[]

export type EasterEgg =
  | {
      /** The drawing needs at least this many columns; narrower screens get `narrowLine`. */
      columns: number
      kind: 'art'
      lines: readonly string[]
      name: string
      narrowLine: string
    }
  | {
      /** `true` matches `sudo <anything>`; `false` matches the bare name only. */
      acceptsAnyArguments: boolean
      exitStatus?: number
      kind: 'command'
      lines: readonly OutputLine[]
      name: string
      /** A fixed address `open <name>` opens in a new tab. */
      opens?: string
    }
  | {
      exitStatus?: number
      kind: 'file'
      lines: readonly OutputLine[]
      /** Absolute, or starting with `~`. A last segment starting with `.` is a dotfile. */
      path: string
    }

export const terminalEasterEggs: readonly EasterEgg[] = []
