import { COMMAND_JOINER, QUOTE_CHARACTERS, REFUSED_TOKENS } from './constants'

type QuoteCharacter = (typeof QUOTE_CHARACTERS)[number]

/** The commands of a typed line, each as its words, or the first token the shell refuses. */
export type TokenizedLine =
  | { commands: readonly (readonly string[])[]; kind: 'ok' }
  | { kind: 'syntax-error'; token: string }

function isQuote(character: string): character is QuoteCharacter {
  return (QUOTE_CHARACTERS as readonly string[]).includes(character)
}

function isWhitespace(character: string): boolean {
  return /\s/.test(character)
}

/** The first refused token outside quotes, or null. */
function findRefusedToken(line: string): string | null {
  let openQuote: QuoteCharacter | null = null
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (openQuote) {
      if (character === openQuote) {
        openQuote = null
      }
      continue
    }
    if (isQuote(character)) {
      openQuote = character
      continue
    }
    const refused = REFUSED_TOKENS.find((token) => line.startsWith(token, index))
    if (refused) {
      return refused
    }
  }
  return null
}

/**
 * Splits a typed line into commands and words. A pair of quotes groups words and is stripped, an
 * unclosed quote runs to the end of the line, and only `&&` separates commands. Nothing here
 * interprets anything: the words go to a closed table.
 */
export function tokenizeCommandLine(line: string): TokenizedLine {
  const refused = findRefusedToken(line)
  if (refused !== null) {
    return { kind: 'syntax-error', token: refused }
  }

  const commands: string[][] = []
  let words: string[] = []
  let word: string | null = null
  let openQuote: QuoteCharacter | null = null

  const endWord = () => {
    if (word !== null) {
      words.push(word)
      word = null
    }
  }
  const endCommand = () => {
    endWord()
    if (words.length > 0) {
      commands.push(words)
      words = []
    }
  }

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    if (openQuote) {
      if (character === openQuote) {
        openQuote = null
      } else {
        word = (word ?? '') + character
      }
      continue
    }
    if (isQuote(character)) {
      openQuote = character
      word = word ?? ''
      continue
    }
    if (line.startsWith(COMMAND_JOINER, index)) {
      endCommand()
      index += COMMAND_JOINER.length - 1
      continue
    }
    if (isWhitespace(character)) {
      endWord()
      continue
    }
    word = (word ?? '') + character
  }
  endCommand()

  return { commands, kind: 'ok' }
}
