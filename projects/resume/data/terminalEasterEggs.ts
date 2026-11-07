import {
  CIGARETTE_IN_ASHTRAY_DRAWING,
  ROBOT_AT_THE_STAIRS_DRAWING,
  SUIT_DRAWING,
  TRAIN_DRAWING,
  TRIFORCE_DRAWING,
  VAULT_DRAWING,
} from './terminalEggDrawings'
import {
  crossingTheScreen,
  gettingADotBack,
  gridPath,
  losingADot,
  progressBar,
  progressThenLine,
  timedLines,
} from './terminalEggFrames'

import type { EggAnimation } from './terminalEggFrames'

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

/** Asked when the command runs. It takes any answer: `reply` prints, or `repeats` asks again. */
export type EggQuestion = {
  label: string
  reply?: string
  repeats?: boolean
}

/** A command that only does its trick for one word, and answers as the real tool for the rest. */
export type OnlyWithArgument = {
  argument: string
  missingLine: string
  otherLine: (word: string) => string
  otherExitStatus: number
}

export type EasterEgg =
  | {
      animation?: EggAnimation
      /** Asked before anything else happens. Only a yes prints `lines` and plays or opens. */
      confirm?: string
      /** Rows printed above `lines`. A window narrower than the widest row leaves them out. */
      drawing?: readonly string[]
      exitStatus?: number
      /** Real tools, kept out of `/usr/games`, `hint` and `fortune`, so they stay a surprise. */
      isNotAGame?: boolean
      /** Runs by its name with any arguments after it: `sudo rm -rf /` and `sudo` alike. */
      kind: 'command'
      lines: readonly OutputLine[]
      name: string
      /** One of these prints each time, at random. */
      oneOf?: readonly string[]
      onlyWithArgument?: OnlyWithArgument
      /** A fixed address that opens in a new tab, and by `open <name>`. */
      opens?: string
      pausedEnding?: PausedEnding
      /** A YouTube video that plays in the output, from its official upload. */
      plays?: string
      question?: EggQuestion
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

/** The Konami code's reward: the extra lives it famously gave in Contra. */
export const KONAMI_LINE = '+30 lives'

/** The site hosts no audio of anyone's: a song plays from its official upload, in the output. */
const STAY_AT_YOUR_HOUSE_VIDEO = 'KvMY1uzSC1E'
const YOU_SUFFER_VIDEO = '9Z1IGjr2cT0'
const RICK_ROLL_ADDRESS = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const CALICO_CUT_PANTS_ADDRESS = 'https://getcalicocutpants.com/'

/** Barney's pause. Zack asked for a real one. His to set by feel. */
const WAIT_FOR_IT_MILLISECONDS = 2000

/** The real bash answer, so nothing gives it away until the new tab opens. */
const SUDO_LINE = 'bash: sudo: command not found'
const COMMAND_NOT_FOUND_EXIT_STATUS = 127

/** The text from the show, Zack's words. `encrypt` loses a dot off it, and `decrypt` gets it back. */
const THE_TEXT_TO_MONICA =
  "Just dotted the I's, crossed the T's, and every single detail is....perfect,"

const THE_ANSWER = 42
const DEEP_THOUGHT_YEARS = [7_500_000, 6_000_000, 4_500_000, 3_000_000, 1_500_000, 500_000, 0]
const DEEP_THOUGHT_STEP_MILLISECONDS = 500

const FUXSOCY_BAR_WIDTH = 20
const FUXSOCY_STEP_MILLISECONDS = 120

const CHEST_PAUSE_MILLISECONDS = 2400

const BREACH_CODES = ['55', '1C', 'BD', 'E9', '7A'] as const
const BREACH_GRID_SIZE = 5
const BREACH_START_MILLISECONDS = 600
const BREACH_STEP_MILLISECONDS = 450
/** Row, column, as the game has it: each pick moves along the row or the column of the last. */
const BREACH_PATH = [
  [0, 1],
  [3, 1],
  [3, 4],
  [1, 4],
] as const

/** Ceres, about 2.5 times the distance to the Sun away: 2,494 seconds there and back at light speed. */
const CERES_ROUND_TRIP_MILLISECONDS = 2_494_000
const CERES_ADDRESS = '192.0.2.42'
const PING_REPLIES = 3
/** A real pause, though not the real one, which is 42 minutes. */
const PING_REPLY_MILLISECONDS = 1500
const PING_STATISTICS_MILLISECONDS = 300
const PING_NAME_NOT_KNOWN_EXIT_STATUS = 2

const TRAIN_WINDOW_COLUMNS = 70
const TRAIN_STEP_COLUMNS = 2
const TRAIN_STEP_MILLISECONDS = 40

function draws(name: string, drawing: readonly string[], line?: string): EasterEgg {
  return { drawing, kind: 'command', lines: line ? [[{ text: line }]] : [], name }
}

function says(name: string, line: string): EasterEgg {
  return { kind: 'command', lines: [[{ text: line }]], name }
}

function holds(path: string, line: string): EasterEgg {
  return { kind: 'file', lines: [[{ text: line }]], path }
}

function animates(name: string, animation: EggAnimation, exitStatus?: number): EasterEgg {
  return { animation, exitStatus, kind: 'command', lines: [], name }
}

function pingCeres(): EggAnimation {
  const replies = Array.from({ length: PING_REPLIES }, (_, index) => ({
    holdMilliseconds: PING_REPLY_MILLISECONDS,
    line: `64 bytes from ceres (${CERES_ADDRESS}): icmp_seq=${index + 1} ttl=54 time=${CERES_ROUND_TRIP_MILLISECONDS} ms`,
  }))
  return timedLines([
    {
      holdMilliseconds: PING_REPLY_MILLISECONDS,
      line: `PING ceres (${CERES_ADDRESS}) 56(84) bytes of data.`,
    },
    ...replies,
    { holdMilliseconds: PING_STATISTICS_MILLISECONDS, line: ' ' },
    { holdMilliseconds: PING_STATISTICS_MILLISECONDS, line: '--- ceres ping statistics ---' },
    {
      holdMilliseconds: 0,
      line: `${PING_REPLIES} packets transmitted, ${PING_REPLIES} received, 0% packet loss, time ${
        PING_REPLIES * CERES_ROUND_TRIP_MILLISECONDS
      }ms`,
    },
  ])
}

const BREACH_GRID = Array.from({ length: BREACH_GRID_SIZE }, (_, row) =>
  Array.from(
    { length: BREACH_GRID_SIZE },
    (_, column) => BREACH_CODES[(row * 2 + column * 3) % BREACH_CODES.length],
  ),
)

/** Zack's words on 2026-11-06, or the works' own. The commands are never listed in `help`. */
export const terminalEasterEggs: readonly EasterEgg[] = [
  // The Hitchhiker's Guide to the Galaxy
  animates(
    'deepthought',
    progressThenLine({
      finalLine: String(THE_ANSWER),
      labels: DEEP_THOUGHT_YEARS.map(
        (years) => `Computing... ${years.toLocaleString('en-US')} years remaining`,
      ),
      stepMilliseconds: DEEP_THOUGHT_STEP_MILLISECONDS,
    }),
    THE_ANSWER,
  ),
  says('logout', 'So long, and thanks for all the fish.'),
  says('panic', "Don't Panic."),
  says('whatis', 'Mostly harmless.'),
  // The Legend of Zelda
  animates(
    'chest',
    timedLines([
      { holdMilliseconds: CHEST_PAUSE_MILLISECONDS, line: ' ' },
      { holdMilliseconds: 0, line: 'You got the Master Sword!' },
    ]),
  ),
  draws('link', TRIFORCE_DRAWING, "It's dangerous to go alone! Take this."),
  says('listen', 'Hey! Listen!'),
  says('secret', "It's a secret to everybody."),
  // Borderlands
  says('claptrap', 'Minion!'),
  draws('guns', VAULT_DRAWING, '87 bazillion'),
  {
    kind: 'command',
    lines: [],
    name: 'loot',
    oneOf: [
      'You found: Conference Call (Legendary)',
      'You found: Fibber (Legendary)',
      'You found: Infinity (Legendary)',
      'You found: Maggie (Legendary)',
      'You found: Norfleet (Legendary)',
      'You found: Unkempt Harold (Legendary)',
    ],
  },
  draws('stairs', ROBOT_AT_THE_STAIRS_DRAWING, 'How did you know stairs were my only weakness?!'),
  // Cyberpunk
  animates(
    'breach',
    gridPath({
      finalLine: 'Daemon uploaded.',
      grid: BREACH_GRID,
      path: BREACH_PATH,
      startMilliseconds: BREACH_START_MILLISECONDS,
      stepMilliseconds: BREACH_STEP_MILLISECONDS,
    }),
  ),
  says('choom', 'preem'),
  {
    kind: 'command',
    lines: [[{ text: 'Never fade away.' }]],
    name: 'fade',
    plays: STAY_AT_YOUR_HOUSE_VIDEO,
  },
  says('samurai', 'Wake up, Samurai. We have a city to burn.'),
  // The Expanse
  says('amos', 'I am that guy.'),
  says('beltalowda', 'Beltalowda!'),
  says('cant', 'Remember the Cant.'),
  says('miller', "Doors and corners, kid. That's where they get you."),
  {
    animation: pingCeres(),
    kind: 'command',
    lines: [],
    name: 'ping',
    onlyWithArgument: {
      argument: 'ceres',
      missingLine: 'ping: usage error: Destination address required',
      otherExitStatus: PING_NAME_NOT_KNOWN_EXIT_STATUS,
      otherLine: (word) => `ping: ${word}: Name or service not known`,
    },
  },
  // Community
  says('abed', 'Cool. Cool cool cool.'),
  says('greendale', "You're already accepted!"),
  says('pop', 'Pop pop!'),
  says('renew', 'Six seasons and a movie!'),
  says('timeline', 'This is the darkest timeline.'),
  says('troy', 'Troy and Abed in the morning!'),
  // How I Met Your Mother
  says('challenge', 'Challenge accepted.'),
  {
    kind: 'command',
    lines: [[{ text: 'wait for it...' }]],
    name: 'legen',
    pausedEnding: { afterMilliseconds: WAIT_FOR_IT_MILLISECONDS, text: ' dary!' },
  },
  draws('suit', SUIT_DRAWING, 'Suit up!'),
  says('ted', 'Have you met Ted?'),
  says('true', 'True story.'),
  // Mr. Robot
  holds('~/fsociety00.dat', 'LEAVE ME HERE'),
  animates(
    'fuxsocy',
    progressBar({
      barWidth: FUXSOCY_BAR_WIDTH,
      stepMilliseconds: FUXSOCY_STEP_MILLISECONDS,
      title: 'Executing FuxSocy',
    }),
  ),
  says('news', 'Exciting times in the world right now… exciting times…'),
  says('qwerty', "><(((('>"),
  says('tyrell', 'Bonsoir, Elliot.'),
  // Silicon Valley
  {
    confirm: 'Warning: this is loud. Play it? [y/N]',
    kind: 'command',
    lines: [[{ text: 'ALERT: the price of Bitcoin has changed.' }]],
    name: 'bitcoin',
    plays: YOU_SUFFER_VIDEO,
  },
  says('compress', 'Weissman score: 5.2'),
  animates('decrypt', gettingADotBack(THE_TEXT_TO_MONICA)),
  animates('encrypt', losingADot(THE_TEXT_TO_MONICA)),
  says('mission', 'Making the world a better place.'),
  says('seefood', 'Not hotdog'),
  draws('special', CIGARETTE_IN_ASHTRAY_DRAWING),
  {
    kind: 'command',
    lines: [],
    name: 'tabs',
    question: { label: 'Tabs or spaces?', reply: 'Tabs.' },
  },
  // The Good Place
  says('basic', 'Ya basic!'),
  {
    kind: 'command',
    lines: [],
    name: 'chidi',
    question: { label: 'Are you sure? [y/N]', repeats: true },
  },
  holds('/etc/motd', 'Welcome! Everything is fine.'),
  says('fork', 'Holy forking shirt!'),
  says('janet', 'Hi there!'),
  says(
    'rare',
    "It's a rare occurrence, like... like a double rainbow, or someone on the Internet saying, 'You know what? You've convinced me I was wrong.'",
  ),
  // Old Unix traditions
  animates(
    'sl',
    crossingTheScreen({
      finalLine: 'A steam train goes by.',
      sprite: TRAIN_DRAWING,
      stepColumns: TRAIN_STEP_COLUMNS,
      stepMilliseconds: TRAIN_STEP_MILLISECONDS,
      windowColumns: TRAIN_WINDOW_COLUMNS,
    }),
  ),
  says('xyzzy', 'Nothing happens.'),
  // The two surprises
  {
    exitStatus: COMMAND_NOT_FOUND_EXIT_STATUS,
    isNotAGame: true,
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
