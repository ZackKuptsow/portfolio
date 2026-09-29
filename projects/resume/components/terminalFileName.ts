const LEADING_OR_TRAILING_SEPARATOR = /^_+|_+$/g
const NON_ALPHANUMERIC_RUN = /[^a-z0-9]+/g
const WORD_SEPARATOR = '_'

/**
 * Turn a display title into the fake file name shown in a terminal prompt,
 * such as `cat low_rate_co.txt`. Each run of characters that are not letters
 * or digits becomes one underscore, and underscores at either end are dropped.
 * Without that, "Low Rate Co." would put two dots before the extension.
 */
export function toTerminalFileName(title: string): string {
  return title
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_RUN, WORD_SEPARATOR)
    .replace(LEADING_OR_TRAILING_SEPARATOR, '')
}
