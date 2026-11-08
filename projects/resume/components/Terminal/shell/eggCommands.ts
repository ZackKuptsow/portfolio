import type { EasterEgg, EggQuestion } from '@/data/terminalEasterEggs'

import { TOOL_COPY, EXIT_STATUS } from './constants'
import { fail, succeed, text } from './outcomes'

import type { CommandHandler, CommandOutcome, ShellContext, ShellQuestion } from './types'

type CommandEgg = Extract<EasterEgg, { kind: 'command' }>

/** What counts as yes to a `[y/N]`. Anything else, Enter alone included, is no. */
const YES_ANSWER = /^y(es)?$/i
/** What a drawing with no line of its own says when the window cannot hold it. */
export const WINDOW_TOO_NARROW = 'window too narrow'
const COMMAND_JOINER = '&&'

function pickAtRandom<Item>(items: readonly Item[]): Item {
  return items[Math.floor(Math.random() * items.length)]
}

/** The width of a drawing, in characters: its longest row. */
export function widestRow(rows: readonly string[]): number {
  return Math.max(...rows.map((row) => row.length))
}

/** Every command egg a visitor may be pointed at, so never one of the surprises. */
export function gameEggs(eggs: readonly EasterEgg[]): readonly CommandEgg[] {
  return eggs.flatMap((egg) => (egg.kind === 'command' && !egg.isNotAGame ? [egg] : []))
}

/** Takes any answer, and either prints its reply or asks again. Escape is the only way out. */
function asking(question: EggQuestion): ShellQuestion {
  return {
    answer: () =>
      question.repeats
        ? succeed([], { asks: asking(question) })
        : succeed(question.reply ? [question.reply] : []),
    isSecret: false,
    label: question.label,
  }
}

function runEgg(egg: CommandEgg, context: ShellContext): CommandOutcome {
  const exitStatus = egg.exitStatus ?? EXIT_STATUS.success
  const { animation, drawing, oneOf, plays, opens, pausedEnding } = egg
  if (animation) {
    const fits = context.columns >= Math.max(...animation.frames.map(({ rows }) => widestRow(rows)))
    return fits
      ? { animation, exitStatus, lines: [] }
      : { exitStatus, lines: [text(animation.finalLine)] }
  }
  const fits = drawing && context.columns >= widestRow(drawing)
  const isOnlyADrawing = drawing && egg.lines.length === 0
  const lines = oneOf
    ? [text(pickAtRandom(oneOf))]
    : isOnlyADrawing && !fits
      ? [text(`${egg.name}: ${WINDOW_TOO_NARROW}`)]
      : egg.lines
  return {
    art: fits ? drawing : undefined,
    effect: plays
      ? { kind: 'play-video', videoId: plays }
      : opens
        ? { href: opens, kind: 'open-url' }
        : undefined,
    exitStatus,
    lines,
    pausedEnding,
  }
}

/** What running an egg's command does, by which of the data's shapes it has. */
export function eggHandler(egg: CommandEgg): CommandHandler {
  const { confirm, onlyWithArgument, question } = egg
  return ([, word], _, context) => {
    if (onlyWithArgument && word === undefined) {
      return fail(onlyWithArgument.missingLine)
    }
    if (onlyWithArgument && word !== onlyWithArgument.argument) {
      return fail(onlyWithArgument.otherLine(word as string), onlyWithArgument.otherExitStatus)
    }
    if (question) {
      return succeed([], { asks: asking(question) })
    }
    if (confirm) {
      return succeed([], {
        asks: {
          answer: (line) => (YES_ANSWER.test(line.trim()) ? runEgg(egg, context) : succeed()),
          isSecret: false,
          label: confirm,
        },
      })
    }
    return runEgg(egg, context)
  }
}

/** Names one command not tried yet. What has been tried lives in the history, gone with the page. */
export const hint: CommandHandler = (_, state, context) => {
  const tried = new Set(
    state.history.flatMap((line) =>
      line.split(COMMAND_JOINER).map((command) => command.trim().split(' ')[0]),
    ),
  )
  const untried = gameEggs(context.eggs).filter(({ name }) => !tried.has(name))
  if (untried.length === 0) {
    return succeed([TOOL_COPY.hintNothingLeft])
  }
  const { name, onlyWithArgument } = pickAtRandom(untried)
  return succeed([
    TOOL_COPY.hintTry(onlyWithArgument ? `${name} ${onlyWithArgument.argument}` : name),
  ])
}

/** A random line from the ones already written, so it adds no new words. */
export const fortune: CommandHandler = (_, __, context) => {
  const lines = gameEggs(context.eggs).flatMap((egg) =>
    egg.confirm || egg.plays || egg.opens ? [] : egg.lines,
  )
  return lines.length === 0
    ? succeed()
    : { exitStatus: EXIT_STATUS.success, lines: [pickAtRandom(lines)] }
}
