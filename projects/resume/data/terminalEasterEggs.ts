/**
 * The easter eggs the typed shell hides, as data. Each is prebuilt: the shell prints these lines
 * and never evaluates anything typed. Every line here is read by a visitor, so each is Zack's to
 * approve, and none holds an em dash or en dash (`test/data/terminalEasterEggs.test.ts`).
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
      exitStatus?: number
      /** Runs by its name with any arguments after it: `sudo rm -rf /` and `sudo` alike. */
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

/**
 * What `echo $?` prints before anything has run, where a fresh shell would print 0. The first place
 * the number goes (Zack, 2026-11-06), with no words around it, for whoever checks.
 */
export const FRESH_SHELL_EXIT_STATUS = 42

const RICK_ROLL_ADDRESS = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
/** The real bash answer, so nothing gives it away until the new tab opens. */
const SUDO_LINE = 'bash: sudo: command not found'
const COMMAND_NOT_FOUND_EXIT_STATUS = 127

/** A window narrower than a drawing gets this instead, in the shape of a tool's error. */
const WINDOW_TOO_NARROW = 'window too narrow'

const TRIFORCE_LINES = [
  '         #',
  '        ###',
  '       #####',
  '      #######',
  '     #########',
  '    #         #',
  '   ###       ###',
  '  #####     #####',
  ' #######   #######',
  '######### #########',
] as const

/** Traced from the logo for a row height of 1.35, the least the engine can clip a row at a time. */
const VAULT_LINES = [
  '              ..+++######+++..',
  '          .+#######++###########+.',
  '       .####++.     ######.  .++####.',
  '     +###+.       .###+..+#      .+###+',
  '   .###+         +###.    #+        +###.',
  '  +###.        +####.     ##.        .###+',
  ' +###        .####+       ###          ###+',
  '.###       .#####+        +##.          ###.',
  '###.      +#####.         +###          .###',
  '###     +######           .###+          ###',
  '###   .######+             ####          ###',
  '###. +######.              ####+        .###',
  '.##########                #####.       ###.',
  ' +#######+                 +#####      ###+',
  '  +######                  +#####.   .###+',
  '   .######+                .######  +###.',
  '     +#######+.             ##########+',
  '       .##########++++++++##########.',
  '          .+####################+.',
  '              ..+++######+++..',
] as const

function drawing(name: string, lines: readonly string[]): EasterEgg {
  return {
    columns: Math.max(...lines.map((line) => line.length)),
    kind: 'art',
    lines,
    name,
    narrowLine: `${name}: ${WINDOW_TOO_NARROW}`,
  }
}

export const terminalEasterEggs: readonly EasterEgg[] = [
  {
    exitStatus: COMMAND_NOT_FOUND_EXIT_STATUS,
    kind: 'command',
    lines: [[{ text: SUDO_LINE }]],
    name: 'sudo',
    opens: RICK_ROLL_ADDRESS,
  },
  drawing('triforce', TRIFORCE_LINES),
  drawing('vault', VAULT_LINES),
]
