/**
 * The typed shell's fixed values. It is a closed table for show: nothing typed is evaluated. See
 * "Typed commands at the terminal prompt" in docs/superpowers/specs.
 */

/** The one way to join commands, because the tour types `clear && cd ../education && ls`. */
export const COMMAND_JOINER = '&&'

/** A pair of either groups words into one and is stripped. The whole of the quoting the shell knows. */
export const QUOTE_CHARACTERS = ['"', "'"] as const

/** Syntax a real shell would act on and this one refuses, each with bash's error line. */
export const REFUSED_TOKENS = ['|', ';', '>', '<', '`', '$('] as const
