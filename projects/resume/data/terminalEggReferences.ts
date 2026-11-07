import { GAMES_DIRECTORY } from '@/components/Terminal/shell/constants'

import type { OutputLine } from './terminalEasterEggs'

/**
 * What each easter egg comes from, for a file in `/usr/games` (Zack, 2026-11-06). A test holds this
 * to the list of eggs, so a new one cannot be added without saying where it is from. `sudo` is left
 * out so it stays a surprise, and the Rick Roll is a song, not one of these kinds of work anyway.
 */

export const REFERENCES_FILE_PATH = `${GAMES_DIRECTORY}/references.txt`

const SONG_THAT_FADE_PLAYS = 'the song fade plays'

/** References that are not an egg of their own: a number, a key sequence, a song inside an egg. */
export const REFERENCES_BEYOND_THE_EGG_LIST = [
  'echo $?',
  'the Konami code',
  SONG_THAT_FADE_PLAYS,
] as const

type WorkReferences = {
  /** Left out where it is not a work, as with an old Unix tradition. */
  medium?: 'book' | 'show' | 'video game'
  /** How a visitor reaches each one: its command, or its file's path. */
  references: readonly string[]
  work: string
}

/** In order of the work's name, so a visitor can find one. */
export const EGG_REFERENCES: readonly WorkReferences[] = [
  {
    medium: 'video game',
    references: ['claptrap', 'guns', 'loot', 'stairs'],
    work: 'Borderlands',
  },
  { medium: 'video game', references: ['xyzzy'], work: 'Colossal Cave Adventure' },
  {
    medium: 'show',
    references: ['abed', 'greendale', 'pop', 'renew', 'timeline', 'troy'],
    work: 'Community',
  },
  { medium: 'video game', references: ['the Konami code'], work: 'Contra' },
  {
    medium: 'video game',
    references: ['breach', 'choom', 'fade', 'samurai'],
    work: 'Cyberpunk 2077',
  },
  { medium: 'show', references: [SONG_THAT_FADE_PLAYS], work: 'Cyberpunk: Edgerunners' },
  {
    medium: 'show',
    references: ['challenge', 'legen', 'suit', 'ted', 'true'],
    work: 'How I Met Your Mother',
  },
  { medium: 'show', references: ['~/portfolio/.yougottagive'], work: 'I Think You Should Leave' },
  {
    medium: 'show',
    references: ['fuxsocy', 'news', 'qwerty', 'tyrell', '~/fsociety00.dat'],
    work: 'Mr. Robot',
  },
  {
    medium: 'show',
    references: [
      'bitcoin',
      'compress',
      'decrypt',
      'encrypt',
      'mission',
      'seefood',
      'special',
      'tabs',
    ],
    work: 'Silicon Valley',
  },
  {
    medium: 'show',
    references: ['amos', 'beltalowda', 'cant', 'miller', 'ping ceres'],
    work: 'The Expanse',
  },
  {
    medium: 'show',
    references: ['/etc/motd', 'basic', 'chidi', 'fork', 'janet', 'rare'],
    work: 'The Good Place',
  },
  {
    medium: 'book',
    references: ['deepthought', 'echo $?', 'logout', 'panic', 'whatis'],
    work: "The Hitchhiker's Guide to the Galaxy",
  },
  {
    medium: 'video game',
    references: ['chest', 'link', 'listen', 'secret'],
    work: 'The Legend of Zelda',
  },
  { references: ['sl'], work: 'Unix tradition' },
]

/** What the file prints, one line per work: `Borderlands (video game): claptrap, guns`. */
export const REFERENCE_LINES: readonly OutputLine[] = EGG_REFERENCES.map(
  ({ medium, references, work }) => [
    { text: `${work}${medium ? ` (${medium})` : ''}: ${references.join(', ')}` },
  ],
)
