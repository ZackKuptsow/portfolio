const LEADING_OR_TRAILING_SEPARATOR = /^_+|_+$/g
const NON_ALPHANUMERIC_RUN = /[^a-z0-9]+/g
const WORD_SEPARATOR = '_'

/**
 * Turn a display title into the fake file name shown in a terminal prompt,
 * such as `cat work_experience.txt`. Punctuation is dropped, because a title
 * like "Low Rate Co." would otherwise put two dots before the extension.
 */
export function toTerminalFileName(title: string): string {
  return title
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_RUN, WORD_SEPARATOR)
    .replace(LEADING_OR_TRAILING_SEPARATOR, '')
}
