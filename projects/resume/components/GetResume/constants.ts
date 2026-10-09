/** Accessible name of the close button. It contains the visible text, per WCAG 2.5.3. */
export const CLOSE_BUTTON_LABEL = 'Close (esc)'

/** Visible text of the close button. */
export const CLOSE_BUTTON_TEXT = 'esc ✕'

/** Decorative path in the dialog's terminal window header. */
export const DIALOG_HEADER_PATH = '~/portfolio/get_resume.sh'

/** Visible heading of the dialog, and its accessible name. */
export const DIALOG_TITLE = 'Get the resume'

/** File name the browser saves the PDF as. */
export const RESUME_PDF_FILE_NAME = 'Zachary_Kuptsow_Resume.pdf'

/** Where the static export serves the PDF from (`public/`). */
export const RESUME_PDF_PATH = '/Zachary_Kuptsow_Resume.pdf'

/** Section headings inside the dialog, each shown after a decorative `## `. */
export const SECTION_TITLE = {
  download: 'download',
  email: 'email',
  qrCode: 'qr code',
} as const

/**
 * Shared by the trigger and the download link, so both keep the original button look.
 * `terminal-button` is the hook globals.css uses to give the prompt the button's own text
 * color: its usual color is the fill of the button.
 */
export const TERMINAL_BUTTON_CLASS_NAME = [
  'terminal-button group relative overflow-hidden',
  'bg-primary text-background font-mono text-sm font-semibold',
  'px-6 py-3 rounded-lg border-2 border-primary',
  'hover:bg-transparent hover:text-primary',
  'transition-all duration-300 ease-out',
  'hover:shadow-glow hover:-translate-y-1',
  'before:absolute before:inset-0 before:bg-gradient-to-r',
  'before:from-transparent before:via-background/20 before:to-transparent',
  'before:-translate-x-full hover:before:translate-x-full',
  'before:transition-transform before:duration-700 before:ease-in-out',
].join(' ')

/**
 * The quieter twin of the terminal button, for a second action under it: outlined at rest
 * and filled on hover. The border needs `!` because the unlayered `*` border color in
 * globals.css outranks every Tailwind utility.
 */
export const TERMINAL_OUTLINE_BUTTON_CLASS_NAME = [
  'terminal-button',
  'bg-transparent text-primary font-mono text-sm font-semibold',
  'px-6 py-3 rounded-lg border-2 border-primary!',
  'hover:bg-primary hover:text-background',
  'transition-all duration-300 ease-out',
  'hover:-translate-y-1',
].join(' ')

/** Command text on the button that opens the dialog. */
export const TRIGGER_COMMAND = './get_resume.sh'
