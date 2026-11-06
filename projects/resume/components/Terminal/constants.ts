import type { SectionId } from './types'

/** Each section's folder under `~/portfolio`. Part of the commands and of the prompt's path. */
export const SECTION_DIRECTORY = {
  education: 'education',
  projects: 'projects',
  skills: 'skills',
  work: 'work_experience',
} as const

/** The heading of each section that has one. */
export const SECTION_HEADING = {
  education: 'Education',
  projects: 'Projects',
  skills: 'Skills',
  work: 'Work Experience',
} as const

/**
 * The folder the session starts in. It is the portfolio and not `~`, so the first command in
 * DESIGN.md's table, `cat developer.profile`, is true as typed.
 */
export const INITIAL_PATH = '~/portfolio'

/** Typed for the resume by every route. `get_resume.sh` is decoration: that address is a 404. */
export const RESUME_COMMAND = 'wget kups.me/get_resume.sh && sh get_resume.sh'

/** Typed when the reader scrolls up past the first screen, which reprints the hero. */
export const EXIT_COMMAND = 'exit'

/** What stands between the prompt's path and the command. */
export const PROMPT_SEPARATOR = ' $ '

/** The address the hero prints, a line of today's site. */
export const HERO_PATH = '~/root/portfolio'

/** Shown before the path in the title bar, on anything wider than a phone. */
export const TITLE_BAR_USER = 'zack@kups:'

/** The footer's line about how the site is made. */
export const BUILT_WITH_LINE =
  'Built with Next.js, deployed via AWS CDK, automated through GitHub Actions'

/** Added to `<html>` before the first paint when the terminal should run. See `prePaintScript`. */
export const TERMINAL_ON_CLASS = 'terminal-on'

/** Added to `<html>` when a script is running, which is when the controls can do something. */
export const SCRIPT_RUNNING_CLASS = 'script-running'

/** Set on the terminal's root once the engine has taken over the page. */
export const ENGINE_READY_ATTRIBUTE = 'data-engine-ready'

/** The section entries of the menu, in reading order. */
export const MENU_SECTIONS: readonly { label: string; sectionId: SectionId }[] = [
  { label: '~/whoami', sectionId: 'hero' },
  { label: 'developer.profile', sectionId: 'about' },
  { label: 'work_experience/', sectionId: 'work' },
  { label: 'education/', sectionId: 'education' },
  { label: 'skills/', sectionId: 'skills' },
  { label: 'get_resume.sh', sectionId: 'resume' },
  { label: 'projects/', sectionId: 'projects' },
]

/** The menu's other entries. */
export const MENU_LABEL = {
  darkMode: 'dark mode',
  lightMode: 'light mode',
  plainView: 'plain view',
  terminalView: 'terminal view',
} as const

/** The drawer's heading, after a decorative prompt symbol. */
export const MENU_HEADING_COMMAND = 'ls ~/portfolio'

/** The lines of the fake download, around its progress bar. */
export const DOWNLOAD_COPY = {
  fileName: 'get_resume.sh',
  fileSize: '1.3K',
  linesBeforeProgress: [
    'Resolving kups.me... done.',
    'Connecting to kups.me:443... connected.',
    'HTTP request sent, awaiting response... 200 OK',
    "Saving to: 'get_resume.sh'",
  ],
  opening: 'Opening the resume...',
  saved: "'get_resume.sh' saved",
  scriptAddress: 'https://kups.me/get_resume.sh',
} as const

/** Scroll distances, in CSS pixels. DESIGN.md's Timing table holds what Zack set them to, and why. */
export const SCROLL_PAST_END_TO_TRIGGER_PIXELS = 300
export const SCROLL_WHILE_RUNNING_TO_FAST_FORWARD_PIXELS = 500
/** A phone reports only the finger, and none of the momentum a wheel counts, so this is less. */
export const SCROLL_WHILE_RUNNING_TO_FAST_FORWARD_BY_TOUCH_PIXELS = 160
export const SCROLL_UP_AT_TOP_TO_EXIT_PIXELS = 400
export const SCROLL_UP_AT_TOP_TO_EXIT_BY_TOUCH_PIXELS = 240
/** Below this a change of scroll position is noise, not a direction. */
export const SCROLL_NOISE_PIXELS = 2
/** Tall enough to lay every scene out while measuring it. */
export const MEASURING_TRACK_PIXELS = 100000
/** Kept clear between the last line of output and the prompt. */
export const PROMPT_CLEARANCE_PIXELS = 20

/** Times, in milliseconds, from the same table. */
/** Input this far apart is two swipes. A trackpad's momentum never leaves a gap this long. */
export const GESTURE_QUIET_MILLISECONDS = 200
/** How long a swipe short of a command still counts towards the next one. */
export const PULL_FORGOTTEN_AFTER_MILLISECONDS = 700
export const JUMP_SETTLE_MILLISECONDS = 80
export const RESIZE_SETTLE_MILLISECONDS = 150
export const DRAWER_CLOSE_MILLISECONDS = 190
export const TYPING_TOTAL_MILLISECONDS = 1800
export const TYPING_FASTEST_CHARACTER_MILLISECONDS = 40
export const TYPING_SLOWEST_CHARACTER_MILLISECONDS = 120
export const ENTER_PAUSE_MILLISECONDS = 320
/** The output prints a line at a time at this pace, however little of it there is. */
export const OUTPUT_LINE_MILLISECONDS = 70
/** Long output prints faster, to be done in this time. */
export const OUTPUT_TOTAL_MILLISECONDS = 1500
export const OUTPUT_TICK_MILLISECONDS = 40
export const DOWNLOAD_LINE_PAUSES_MILLISECONDS = [270, 540, 510, 450, 210] as const
export const DOWNLOAD_PROGRESS_TICK_MILLISECONDS = 130
export const DOWNLOAD_PROGRESS_STALL_MILLISECONDS = 360
export const DOWNLOAD_AFTER_SAVED_MILLISECONDS = 360
export const DOWNLOAD_BEFORE_WINDOW_MILLISECONDS = 800

/** A character's typing time is its share of the total, times a factor from this range. */
export const TYPING_JITTER_LOWEST = 0.55
export const TYPING_JITTER_RANGE = 0.9

/** A real download hesitates, so the middle of the bar runs slower. */
export const DOWNLOAD_STALL_FROM_PERCENT = 55
export const DOWNLOAD_STALL_TO_PERCENT = 75
export const DOWNLOAD_SMALLEST_STEP_PERCENT = 6
export const DOWNLOAD_STEP_RANGE_PERCENT = 14
export const DOWNLOAD_BAR_WIDE_CHARACTERS = 38
export const DOWNLOAD_BAR_NARROW_CHARACTERS = 20
export const DOWNLOAD_BAR_SMALLEST_CHARACTERS = 8
/** With fewer columns than this the bar drops the file name in front of it. */
export const DOWNLOAD_WIDE_FROM_COLUMNS = 62
/** `' 62%[' + '] 1.3K'`, the bar's own text around its characters. */
export const DOWNLOAD_BAR_FRAME_CHARACTERS = 13
