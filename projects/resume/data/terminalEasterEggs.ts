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

/** Text that joins the last line after a real pause. */
export type PausedEnding = {
  afterMilliseconds: number
  text: string
}

/** A fake lock on a file: any answer gets through. Each doubt asks again, then `ending` prints. */
export type FilePassword = {
  doubts: readonly string[]
  ending: string
  label: string
}

export type EasterEgg =
  | {
      /** Asked before anything else happens. Only a yes prints `lines` and opens `opens`. */
      confirm?: string
      /** Rows printed above `lines`. A window narrower than the widest row leaves them out. */
      drawing?: readonly string[]
      exitStatus?: number
      /** Runs by its name with any arguments after it: `sudo rm -rf /` and `sudo` alike. */
      kind: 'command'
      lines: readonly OutputLine[]
      name: string
      /** A fixed address that opens in a new tab, and by `open <name>`. */
      opens?: string
      pausedEnding?: PausedEnding
    }
  | {
      exitStatus?: number
      kind: 'file'
      lines: readonly OutputLine[]
      password?: FilePassword
      /** Absolute, or starting with `~`. A last segment starting with `.` is a dotfile. */
      path: string
    }

/**
 * What `echo $?` prints before anything has run, where a fresh shell would print 0. The first place
 * the number goes (Zack, 2026-11-06), with no words around it, for whoever checks.
 */
export const FRESH_SHELL_EXIT_STATUS = 42

/** Songs open in a new tab, by their official uploads. The site hosts no audio of anyone's. */
const RICK_ROLL_ADDRESS = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const STAY_AT_YOUR_HOUSE_ADDRESS = 'https://www.youtube.com/watch?v=KvMY1uzSC1E'
const YOU_SUFFER_ADDRESS = 'https://www.youtube.com/watch?v=9Z1IGjr2cT0'
const CALICO_CUT_PANTS_ADDRESS = 'https://getcalicocutpants.com/'

/** Barney's pause. Zack asked for a real one. His to set by feel. */
const WAIT_FOR_IT_MILLISECONDS = 2000

/** The real bash answer, so nothing gives it away until the new tab opens. */
const SUDO_LINE = 'bash: sudo: command not found'
const COMMAND_NOT_FOUND_EXIT_STATUS = 127

/** `decrypt` prints the line, and `encrypt` the same line in base64, for whoever decodes it. */
const HIS_LINE = 'Was and is....'
const HIS_LINE_ENCODED = 'V2FzIGFuZCBpcy4uLi4='

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

function draws(name: string, drawing: readonly string[], line: string): EasterEgg {
  return { drawing, kind: 'command', lines: [[{ text: line }]], name }
}

function says(name: string, line: string, opens?: string): EasterEgg {
  return { kind: 'command', lines: [[{ text: line }]], name, opens }
}

function holds(path: string, line: string): EasterEgg {
  return { kind: 'file', lines: [[{ text: line }]], path }
}

/** Zack's words on 2026-11-06, or the works' own. The commands are never listed in `help`. */
export const terminalEasterEggs: readonly EasterEgg[] = [
  // The Hitchhiker's Guide to the Galaxy
  says('logout', 'So long, and thanks for all the fish.'),
  says('panic', "Don't Panic."),
  says('whatis', 'Mostly harmless.'),
  // The Legend of Zelda
  draws('link', TRIFORCE_LINES, "It's dangerous to go alone! Take this."),
  says('listen', 'Hey! Listen!'),
  says('secret', "It's a secret to everybody."),
  // Borderlands
  draws('guns', VAULT_LINES, '87 bazillion'),
  says('stairs', 'How did you know stairs were my only weakness?!'),
  // Cyberpunk
  says('choom', 'preem'),
  says('fade', 'Never fade away.', STAY_AT_YOUR_HOUSE_ADDRESS),
  says('samurai', 'Wake up, Samurai. We have a city to burn.'),
  // The Expanse
  says('beltalowda', 'Beltalowda!'),
  says('cant', 'Remember the Cant.'),
  says('miller', "Doors and corners, kid. That's where they get you."),
  // Community
  says('abed', 'Cool. Cool cool cool.'),
  says('renew', 'Six seasons and a movie!'),
  says('timeline', 'This is the darkest timeline.'),
  // How I Met Your Mother
  {
    kind: 'command',
    lines: [[{ text: 'wait for it...' }]],
    name: 'legen',
    pausedEnding: { afterMilliseconds: WAIT_FOR_IT_MILLISECONDS, text: ' dary!' },
  },
  says('suit', 'Suit up!'),
  says('ted', 'Have you met Ted?'),
  // Mr. Robot
  holds('~/fsociety00.dat', 'LEAVE ME HERE'),
  says('news', 'Exciting times in the world right now… exciting times…'),
  says('qwerty', "><(((('>"),
  // Silicon Valley
  {
    confirm: 'Warning: this is loud. Play it? [y/N]',
    kind: 'command',
    lines: [[{ text: 'ALERT: the price of Bitcoin has changed.' }]],
    name: 'bitcoin',
    opens: YOU_SUFFER_ADDRESS,
  },
  says('compress', 'Weissman score: 5.2'),
  says('decrypt', HIS_LINE),
  says('encrypt', HIS_LINE_ENCODED),
  says('mission', 'Making the world a better place.'),
  says('seefood', 'Not hotdog'),
  // The Good Place
  holds('/etc/motd', 'Welcome! Everything is fine.'),
  says('fork', 'Holy forking shirt!'),
  says('janet', 'Hi there!'),
  says(
    'rare',
    "It's a rare occurrence, like... like a double rainbow, or someone on the Internet saying, 'You know what? You've convinced me I was wrong.'",
  ),
  // The two links
  {
    exitStatus: COMMAND_NOT_FOUND_EXIT_STATUS,
    kind: 'command',
    lines: [[{ text: SUDO_LINE }]],
    name: 'sudo',
    opens: RICK_ROLL_ADDRESS,
  },
  {
    kind: 'file',
    lines: [[{ href: CALICO_CUT_PANTS_ADDRESS, text: CALICO_CUT_PANTS_ADDRESS }]],
    password: {
      doubts: ['Are you sure about that?', 'Are you sure about that?'],
      ending: "I'm joking. I'm joking",
      label: 'Password:',
    },
    path: '~/portfolio/.yougottagive',
  },
]
