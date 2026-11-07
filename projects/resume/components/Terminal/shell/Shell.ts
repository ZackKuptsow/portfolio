import { applyTheme, readIsDark } from '@/components/applyTheme'
import { FRESH_SHELL_EXIT_STATUS } from '@/data/terminalEasterEggs'

import { assertEasterEggsValid } from './checkEasterEggs'
import { buildCommandTable } from './commandTable'
import { findNode, listFolder, resolvePath } from './fakeFileSystem'
import { cloneCard, renderArt, renderEchoedLine, renderLines, renderListing } from './renderOutput'
import { runCommandLine } from './runCommandLine'
import { SessionOutput } from './SessionOutput'
import { TypedInput } from './TypedInput'
import { playDownload } from '../engine/playDownload'

import type { CommandOutcome, ShellContext, ShellQuestion, ShellState } from './types'
import type { CommandClock } from '../engine/commandClock'

/** What the shell asks of the engine. The engine stays the owner of the screen and the clock. */
export type ShellHost = {
  /** An element's bottom, in heights of the scene it is in, where new output starts printing. */
  bottomInScene: (element: HTMLElement) => number
  clock: CommandClock
  /** The block of the furthest card reached, which typed output follows. */
  currentBlock: () => HTMLElement
  cwd: () => string
  /** Re-measures and scrolls to the end, so what has just been added shows, with no streaming. */
  followOutput: () => void
  isBusy: () => boolean
  /** What `exit` does: the hero reprints, as scrolling up from the first screen does today. */
  landOnHero: (done: () => void) => void
  measureColumns: (element: HTMLElement) => number
  openResumeWindow: () => void
  /** Re-measures, scrolls to the end, and streams the rows from a height in the scene. */
  printAppended: (fromSceneHeight: number, done: () => void) => void
  /** Characters the prompt's reserved rows hold after the folder and ` $ `. */
  promptLineCapacity: () => number
  requestPlainView: () => void
  /** Marks the terminal busy, resets the clock, and finishes as a tour command finishes. */
  runBusy: (work: (done: () => void) => void) => void
  setCwd: (cwd: string) => void
  usableHeight: () => number
}

type ShellOptions = {
  context: Omit<ShellContext, 'columns' | 'isDark' | 'now'>
  elements: { scroller: HTMLElement; typed: HTMLElement }
  host: ShellHost
}

const DOWNLOAD_CLASS = 'terminal-download'
const PATH_SEPARATOR = '/'
const HIDDEN_PREFIX = '.'
const NEW_TAB = '_blank'
const NEW_TAB_FEATURES = 'noopener,noreferrer'

/**
 * The typed shell: the line at the prompt, the closed table it runs through, and the container
 * its output prints into. Everything printed is prebuilt; nothing typed is evaluated, sent or
 * stored. Scrolling stays the main road: typing never moves the tour's step, except `exit`.
 */
export class Shell {
  private readonly host: ShellHost
  private readonly input: TypedInput
  private readonly scroller: HTMLElement
  private readonly session = new SessionOutput()
  private readonly context: ShellOptions['context']
  private readonly commandNames: readonly string[]
  private state: ShellState
  /** A question the next typed line answers, and what the line it came from has left to run. */
  private waiting: {
    labelLine: HTMLElement
    question: ShellQuestion
    queue: CommandOutcome[]
  } | null = null

  constructor({ context, elements, host }: ShellOptions) {
    this.host = host
    this.context = context
    this.scroller = elements.scroller
    assertEasterEggsValid(context.eggs)
    this.commandNames = [...buildCommandTable([]).keys()].sort()
    this.state = { cwd: host.cwd(), history: [], lastExitStatus: FRESH_SHELL_EXIT_STATUS }
    this.input = new TypedInput({
      complete: (prefix) => this.complete(prefix),
      maxLength: host.promptLineCapacity,
      onCancelQuestion: () => this.cancelQuestion(),
      onSubmit: (line) => this.submit(line),
      typed: elements.typed,
    })
  }

  /**
   * True when the key was the shell's. Keys from a control inside the scroller are the control's.
   * While a command runs, the engine has already hurried it; the key is kept, as a terminal keeps
   * typing it has not got to yet, except Enter, which nothing runs over a running command.
   */
  handleKey(event: KeyboardEvent): boolean {
    if (event.target !== this.scroller) {
      return false
    }
    if (this.host.isBusy() && event.key === 'Enter') {
      return true
    }
    return this.input.handleKey(event)
  }

  /** The tour's command has landed and wiped the prompt; what was typed over it shows again. */
  onCommandFinished(): void {
    this.input.redraw()
  }

  /** The tour typed a command: it joins the history, and whatever was half typed is gone. */
  recordTourCommand(command: string): void {
    this.cancelQuestion()
    this.input.clearLine()
    this.input.recordHistory(command)
    this.state = { ...this.state, history: [...this.state.history, command] }
  }

  /**
   * The screen shows something else now, so what was typed into it is gone, as `clear` would leave
   * it. Says whether anything went, because the layout was measured with it in place.
   */
  onScreenChanged(): boolean {
    return this.session.remove()
  }

  remove(): void {
    this.cancelQuestion()
    this.session.remove()
    this.input.clearLine()
  }

  private cancelQuestion(): void {
    if (this.waiting) {
      this.waiting = null
      this.input.endQuestion()
    }
  }

  private fullContext(): ShellContext {
    const output = this.session.element ?? this.host.currentBlock()
    return {
      ...this.context,
      columns: this.host.measureColumns(output),
      isDark: readIsDark,
      now: () => new Date(),
    }
  }

  private submit(line: string): void {
    if (this.waiting) {
      this.answerQuestion(line)
      return
    }
    const cwd = this.host.cwd()
    const { outcomes, state } = runCommandLine(line, { ...this.state, cwd }, this.fullContext())
    this.state = state
    this.input.recordHistory(line)
    if (state.cwd !== cwd) {
      this.host.setCwd(state.cwd)
    }
    this.host.runBusy((done) => {
      const container = this.session.ensureAfter(this.host.currentBlock())
      const fromHeight = this.host.bottomInScene(container)
      this.session.append([renderEchoedLine(cwd, line)])
      this.playOutcomes([...outcomes], fromHeight, done)
    })
  }

  /**
   * The line typed answers the question, and is never run. A plain answer joins the question's line,
   * as it would in a terminal. A secret goes no further than `answer`, which does not keep it: it is
   * not echoed, and it joins neither history. Runs inside the key press, so a tab a yes opens is not
   * blocked as a popup.
   */
  private answerQuestion(line: string): void {
    const waiting = this.waiting
    if (!waiting) {
      return
    }
    this.waiting = null
    this.input.endQuestion()
    const { labelLine, question, queue } = waiting
    if (!question.isSecret && line.length > 0) {
      labelLine.append(document.createTextNode(` ${line}`))
    }
    const outcome = question.answer(line)
    this.state = { ...this.state, lastExitStatus: outcome.exitStatus }
    this.host.runBusy((done) => {
      const container = this.session.ensureAfter(this.host.currentBlock())
      this.playOutcomes([outcome, ...queue], this.host.bottomInScene(container), done)
    })
  }

  /**
   * Appends each outcome in turn. Printing streams once per stretch of plain output; a download,
   * the resume window, plain view and `exit` wait for the stretch before them to print.
   */
  private playOutcomes(queue: CommandOutcome[], fromHeight: number, done: () => void): void {
    const outcome = queue.shift()
    if (!outcome) {
      this.host.printAppended(fromHeight, done)
      return
    }
    this.appendOutcome(outcome)
    const effect = outcome.effect
    const next = () => this.playOutcomes(queue, fromHeight, done)
    const bottomOfOutput = () => {
      const container = this.session.element
      return container ? this.host.bottomInScene(container) : fromHeight
    }
    if (outcome.asks) {
      this.askQuestion(outcome.asks, queue, fromHeight, done)
      return
    }
    if (outcome.pausedEnding) {
      const { afterMilliseconds, text } = outcome.pausedEnding
      const lastLine = this.session.element?.lastElementChild
      this.host.printAppended(fromHeight, () => {
        this.host.clock.after(afterMilliseconds, () => {
          lastLine?.append(document.createTextNode(text))
          this.host.followOutput()
          this.playOutcomes(queue, bottomOfOutput(), done)
        })
      })
      return
    }
    switch (effect?.kind) {
      case 'clear':
        // A blank is not output, so nothing prints through it, and what follows starts below it.
        this.playOutcomes(queue, bottomOfOutput(), done)
        return
      case 'download':
        this.host.printAppended(fromHeight, () =>
          this.playDownload(() => this.playOutcomes(queue, bottomOfOutput(), done)),
        )
        return
      case 'exit':
        this.host.printAppended(fromHeight, () => this.host.landOnHero(done))
        return
      case 'open-resume':
        this.host.printAppended(fromHeight, () => {
          this.host.openResumeWindow()
          done()
        })
        return
      case 'plain-view':
        this.host.printAppended(fromHeight, () => {
          this.host.requestPlainView()
          done()
        })
        return
      default:
        next()
    }
  }

  /** Secret from here on, before the question prints, so no key typed meanwhile can show. */
  private askQuestion(
    question: ShellQuestion,
    queue: CommandOutcome[],
    fromHeight: number,
    done: () => void,
  ): void {
    const [labelLine] = renderLines([[{ text: question.label }]])
    this.session.append([labelLine])
    this.waiting = { labelLine, question, queue }
    this.input.beginQuestion(question.isSecret)
    this.host.printAppended(fromHeight, done)
  }

  private appendOutcome(outcome: CommandOutcome): void {
    // A drawing goes above its line.
    const nodes = [...(outcome.art ? [renderArt(outcome.art)] : []), ...renderLines(outcome.lines)]
    if (outcome.listing) {
      nodes.push(renderListing(outcome.listing))
    }
    if (outcome.cardBlockId !== undefined) {
      const block = this.scroller.querySelector<HTMLElement>(
        `[data-block="${outcome.cardBlockId}"]`,
      )
      if (!block) {
        throw new Error(`The page has no card "${outcome.cardBlockId}" to print`)
      }
      nodes.push(cloneCard(block))
    }
    this.session.append(nodes)
    switch (outcome.effect?.kind) {
      case 'clear':
        this.session.appendBlankScreen(this.host.usableHeight())
        return
      case 'open-url':
        window.open(outcome.effect.href, NEW_TAB, NEW_TAB_FEATURES)
        return
      case 'theme':
        applyTheme(outcome.effect.isDark)
        return
      default:
        return
    }
  }

  /** The fake download, as the tour plays it, in the container. The screen follows each line. */
  private playDownload(onDone: () => void): void {
    const output = document.createElement('div')
    output.className = DOWNLOAD_CLASS
    output.setAttribute('aria-hidden', 'true')
    this.session.append([output])
    const observer = new MutationObserver(() => this.host.followOutput())
    observer.observe(output, { childList: true, subtree: true })
    playDownload({
      clock: this.host.clock,
      columns: this.host.measureColumns(output),
      onDone: () => {
        observer.disconnect()
        onDone()
      },
      output,
    })
  }

  /** Command names for the first word; the entries of the folder named for the rest. Never an egg. */
  private complete(prefix: string): readonly string[] {
    const typedSoFar = this.input.line
    const isFirstWord = !typedSoFar.slice(0, typedSoFar.length - prefix.length).trim()
    if (isFirstWord) {
      return this.commandNames.filter((name) => name.startsWith(prefix))
    }
    const separatorAt = prefix.lastIndexOf(PATH_SEPARATOR)
    const folderPart = separatorAt === -1 ? '' : prefix.slice(0, separatorAt + 1)
    const namePart = prefix.slice(separatorAt + 1)
    const folder = findNode(
      this.context.root,
      resolvePath(this.host.cwd(), folderPart === '' ? '.' : folderPart),
    )
    if (!folder || folder.kind !== 'folder') {
      return []
    }
    return listFolder(folder, { showHidden: namePart.startsWith(HIDDEN_PREFIX) })
      .filter((name) => name.startsWith(namePart))
      .map((name) => `${folderPart}${name}`)
  }
}
