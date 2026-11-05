import {
  buildCommand,
  initialCwd,
  measureLongestPromptLine,
  shortenPromptPath,
} from '../buildCommand'
import { buildSections, buildSteps } from '../buildSections'
import {
  DRAWER_CLOSE_MILLISECONDS,
  EXIT_COMMAND,
  INITIAL_PATH,
  SCROLL_UP_AT_TOP_TO_EXIT_BY_TOUCH_PIXELS,
  SCROLL_UP_AT_TOP_TO_EXIT_PIXELS,
} from '../constants'
import { CommandClock } from './commandClock'
import { playDownload } from './playDownload'
import { ScrollDriver } from './ScrollDriver'
import { findStepAt } from './scrollMap'
import { streamOutput } from './streamOutput'
import { TerminalLayout } from './TerminalLayout'
import { typeCommand } from './typeCommand'
import { wireTerminalInput } from './wireTerminalInput'

import type { CommandRoute, TerminalCommand } from '../buildCommand'
import type { SectionId, TerminalSection, TerminalStep } from '../types'
import type { ScrollDirection } from './ScrollDriver'
import type { TerminalElements } from './TerminalLayout'

/** What the rest of the page shows from the engine: the folder and the section on screen. */
export type TerminalLocation = {
  cwd: string
  sectionId: SectionId
}

export type TerminalEngineOptions = {
  elements: TerminalElements
  onLocationChange: (location: TerminalLocation) => void
  openResumeWindow: () => void
  /** Find in page matched a section the terminal hides. The plain flow can show it. */
  requestPlainView: () => void
  startSectionId: SectionId
}

/** Keys that jump instead of scrolling, which would race every command they pass. */
const JUMP_KEY_SECTION: Partial<Record<string, SectionId>> = { End: 'projects', Home: 'hero' }
const KEYS_THAT_SCROLL_UP = new Set(['ArrowUp', 'PageUp'])

/**
 * The terminal, on top of the plain flow in the server's HTML: one stationary screen that the
 * scroll drives. Reading is 1:1. Scrolling past the end of a section types a command on its own
 * time, then the screen clears and the output prints top down in whole rows.
 *
 * It holds no text of its own and writes no markup: it moves, clips and hides the sections
 * React rendered, so every word stays in the HTML for search, screen readers and find in page.
 * Checks read it through the DOM: `data-busy`, `data-current-step`, `data-step-start` and
 * `data-step-end` on the root.
 */
export class TerminalEngine {
  private readonly abortController = new AbortController()
  private readonly clock = new CommandClock()
  private readonly elements: TerminalElements
  private readonly layout: TerminalLayout
  private readonly options: TerminalEngineOptions
  private readonly scroll: ScrollDriver
  private readonly sections: readonly TerminalSection[]
  private readonly steps: readonly TerminalStep[]

  private currentStepIndex: number
  private cwd = INITIAL_PATH
  private exitPull = 0
  private isBusy = false
  private isDestroyed = false
  private isPlain = false
  private needsRemeasure = false
  private pendingNavigation: { sectionId: SectionId; stepIndex?: number } | null = null
  private stopInput: () => void = () => undefined

  constructor(options: TerminalEngineOptions) {
    this.options = options
    this.elements = options.elements
    this.sections = buildSections()
    this.steps = buildSteps(this.sections)
    this.layout = new TerminalLayout(options.elements, this.steps, {
      withFullPath: measureLongestPromptLine(this.sections, this.steps, (path) => path),
      withShortPath: measureLongestPromptLine(this.sections, this.steps, shortenPromptPath),
    })
    this.currentStepIndex = this.firstStepOf(options.startSectionId)
    this.cwd = initialCwd(this.sectionOf(this.currentStepIndex))
    this.scroll = new ScrollDriver({
      isActive: () => !this.isPlain,
      isBusy: () => this.isBusy,
      onDraw: () => this.draw(),
      onFastForward: () => this.clock.fastForward(),
      onJump: (reached, scrollTop) => this.jumpTo(reached, scrollTop),
      onMoveDown: () => this.moveDownOneStep(),
      onMoveUp: () => this.moveUpOneStep(),
      readCurrentStep: () => this.currentStepIndex,
      readMappedSteps: () => this.layout.mappedSteps,
      scroller: options.elements.scroller,
    })
  }

  /** Takes over from the plain flow. Nothing here runs unless the page opted in before painting. */
  start(): void {
    this.layout.applyTerminalFlow()
    this.showCurrentStep()
    this.stopInput = wireTerminalInput({
      elements: this.elements,
      handlers: {
        onClick: this.fastForwardIfBusy,
        onFindInPage: this.options.requestPlainView,
        onFocusIn: this.revealFocused,
        onKeyDown: this.handleKeyDown,
        onOutputWrapped: () => this.remeasure(),
        onResize: this.handleResize,
        onScroll: this.scroll.schedule,
        onTouchPull: (pulled) => {
          this.scroll.noteFlick()
          this.countUpwardAtTop(pulled, SCROLL_UP_AT_TOP_TO_EXIT_BY_TOUCH_PIXELS)
        },
        onWheelUp: (amount) => {
          this.scroll.noteFlick()
          this.countUpwardAtTop(amount, SCROLL_UP_AT_TOP_TO_EXIT_PIXELS)
        },
      },
      signal: this.abortController.signal,
    })
    this.elements.scroller.focus({ preventScroll: true })
    this.announceLocation()
    // A font that arrives late moves every line.
    void document.fonts.ready.then(() => {
      if (!this.isDestroyed) {
        this.remeasure()
      }
    })
  }

  destroy(): void {
    this.isDestroyed = true
    this.abortController.abort()
    this.clock.reset()
    this.scroll.stop()
    this.stopInput()
  }

  /** Types a section's command and goes there, as the menu, a footer link or End and Home do. */
  navigate(
    sectionId: SectionId,
    options: { afterDrawerCloses?: boolean; stepIndex?: number } = {},
  ): void {
    if (this.isPlain) {
      return
    }
    if (this.isBusy) {
      // Finish what is running at once, then go.
      this.pendingNavigation = { sectionId, stepIndex: options.stepIndex }
      this.clock.fastForward()
      return
    }
    const target = options.stepIndex ?? this.firstStepOf(sectionId)
    const typeIt = () => {
      const { command, cwd } = this.commandFor(target, 'menu')
      this.runCommand(command, cwd, (done) => this.land(target, 'down', done))
    }
    if (options.afterDrawerCloses) {
      // Busy from now on, so a flick while the drawer closes cannot start a command of its own.
      this.clock.reset()
      this.markBusy()
      this.clock.after(DRAWER_CLOSE_MILLISECONDS, typeIt)
    } else {
      typeIt()
    }
  }

  /** Switches between the terminal and the plain flow, keeping the reader on the same section. */
  setPlain(isPlain: boolean): void {
    if (isPlain === this.isPlain) {
      return
    }
    this.isPlain = isPlain
    this.clock.reset()
    this.isBusy = false
    this.pendingNavigation = null
    delete this.elements.root.dataset.busy
    this.elements.typed.textContent = ''
    if (isPlain) {
      this.layout.applyPlainFlow()
      this.layout.sceneOf(this.currentStepIndex).scrollIntoView()
      return
    }
    this.layout.applyTerminalFlow()
    this.showCurrentStep()
    this.elements.scroller.focus({ preventScroll: true })
  }

  /** The window closed, by any route. Whichever route opened it, Projects loads under it. */
  handleResumeWindowClosed(): void {
    if (this.isPlain || this.steps[this.currentStepIndex].sectionId !== 'resume') {
      return
    }
    this.elements.scroller.focus({ preventScroll: true })
    const target = this.firstStepOf('projects')
    const { command, cwd } = this.commandFor(target, 'down')
    this.runCommand(command, cwd, (done) => this.land(target, 'down', done))
  }

  private firstStepOf(sectionId: SectionId): number {
    return this.steps.findIndex((step) => step.sectionId === sectionId)
  }

  private sectionOf(stepIndex: number): TerminalSection {
    const { sectionId } = this.steps[stepIndex]
    return this.sections.find((section) => section.id === sectionId) as TerminalSection
  }

  private commandFor(stepIndex: number, route: CommandRoute): TerminalCommand {
    return buildCommand({
      cameFromSectionId: this.steps[this.currentStepIndex].sectionId,
      cwd: this.cwd,
      route,
      section: this.sectionOf(stepIndex),
      step: this.steps[stepIndex],
    })
  }

  private announceLocation(): void {
    this.options.onLocationChange({
      cwd: this.cwd,
      sectionId: this.steps[this.currentStepIndex].sectionId,
    })
    this.publishStep()
  }

  /** The checks walk every scroll position of a step, so they need to know where it runs. */
  private publishStep(): void {
    const { dataset } = this.elements.root
    const mapped = this.layout.mappedSteps[this.currentStepIndex]
    dataset.currentStep = String(this.currentStepIndex)
    dataset.stepStart = String(mapped.start)
    dataset.stepEnd = String(mapped.end)
  }

  private showCurrentStep(): void {
    this.layout.measure()
    this.layout.showStep(this.currentStepIndex)
    this.scroll.setScroll(this.layout.mappedSteps[this.currentStepIndex].start)
    this.draw()
  }

  private draw(): void {
    this.layout.draw(this.currentStepIndex, this.elements.scroller.scrollTop)
  }

  private handleResize = (): void => {
    if (this.layout.hasSizeChanged()) {
      this.remeasure()
    }
  }

  /** The reader stays on the same step, at the same point in it. */
  private remeasure(): void {
    if (this.isPlain) {
      return
    }
    if (this.isBusy) {
      this.needsRemeasure = true
      return
    }
    const scrollTop = this.layout.remeasureKeepingPlace(
      this.currentStepIndex,
      this.elements.scroller.scrollTop,
    )
    this.layout.showStep(this.currentStepIndex)
    this.scroll.setScroll(scrollTop)
    this.draw()
    this.publishStep()
  }

  private moveDownOneStep(): void {
    const next = this.currentStepIndex + 1
    const { command, cwd } = this.commandFor(next, 'down')
    this.runCommand(command, cwd, (done) => this.landFromScroll(next, 'down', done))
  }

  /** Going up never opens the resume window, so the trip passes over it. */
  private moveUpOneStep(): void {
    const oneBack = this.currentStepIndex - 1
    const previous = this.steps[oneBack].sectionId === 'resume' ? oneBack - 1 : oneBack
    const { command, cwd } = this.commandFor(previous, 'up')
    this.runCommand(command, cwd, (done) => this.landFromScroll(previous, 'up', done))
  }

  private jumpTo(reached: number, scrollTop: number): void {
    const isGoingUp = reached < this.currentStepIndex
    // Going up never opens the window, however far the jump.
    const target = isGoingUp && this.steps[reached].sectionId === 'resume' ? reached - 1 : reached
    const { command, cwd } = this.commandFor(target, 'down')
    this.runCommand(command, cwd, (done) => this.land(target, 'down', done, scrollTop))
  }

  private markBusy(): void {
    this.isBusy = true
    this.scroll.noteBusyStart()
    this.elements.root.dataset.busy = 'true'
  }

  private runCommand(
    command: string,
    nextCwd: string,
    afterEnter: (done: () => void) => void,
  ): void {
    const { typed } = this.elements
    this.clock.reset()
    this.markBusy()
    typeCommand({
      clock: this.clock,
      command,
      element: typed,
      onEntered: () => {
        typed.textContent = ''
        this.cwd = nextCwd
        afterEnter(this.finishCommand)
      },
    })
  }

  private finishCommand = (): void => {
    this.isBusy = false
    delete this.elements.root.dataset.busy
    if (this.needsRemeasure) {
      this.needsRemeasure = false
      this.remeasure()
    } else {
      this.draw()
    }
    if (this.pendingNavigation) {
      const { sectionId, stepIndex } = this.pendingNavigation
      this.pendingNavigation = null
      this.navigate(sectionId, { stepIndex })
      return
    }
    this.scroll.schedule()
  }

  /**
   * A reader still moving can carry the scroll past this step while the command types. Land
   * where the scroll is, and leave it alone: setting it would cancel a smooth scroll that is
   * still running. A wheel or touch stays on the next step unless the reader is fast-forwarding,
   * so a short section isn't skipped. The resume is never skipped, only shortened.
   */
  private landFromScroll(target: number, way: ScrollDirection, done: () => void): void {
    const liveScrollTop = this.elements.scroller.scrollTop
    const liveTarget = findStepAt(this.layout.mappedSteps, liveScrollTop)
    const isPastTarget = way === 'down' ? liveTarget > target : liveTarget < target
    const isResume = this.steps[target].sectionId === 'resume'
    if (isPastTarget && !isResume && (this.clock.isFastForwarding || !this.scroll.isFlicking())) {
      this.land(liveTarget, way, done, liveScrollTop)
    } else {
      this.land(target, way, done)
    }
  }

  private land(
    target: number,
    way: ScrollDirection,
    done: () => void,
    keepScrollTop?: number,
  ): void {
    this.currentStepIndex = target
    this.scroll.direction = way
    this.exitPull = 0
    this.layout.showStep(target)
    const settleScroll = () => {
      if (keepScrollTop === undefined) {
        const mapped = this.layout.mappedSteps[target]
        this.scroll.setScroll(way === 'down' ? mapped.start : mapped.end)
      } else {
        this.scroll.adoptScroll()
      }
    }
    settleScroll()
    this.draw()
    this.announceLocation()
    if (this.steps[target].sectionId === 'resume') {
      this.printDownload(done)
      return
    }
    this.printOutput(target, way, () => {
      settleScroll()
      done()
    })
  }

  private printDownload(done: () => void): void {
    const output = this.layout.downloadOutput()
    playDownload({
      clock: this.clock,
      columns: this.layout.measureColumns(output, output.clientWidth),
      onDone: () => {
        this.options.openResumeWindow()
        done()
      },
      output,
    })
  }

  /**
   * Output comes in bursts of whole lines, always from the top of what is on screen. Going down
   * inside a section, what is already printed stays, and printing starts at the new block.
   */
  private printOutput(target: number, way: ScrollDirection, onDone: () => void): void {
    const startsAtBlock = way === 'down' && !this.steps[target].clearsBefore
    streamOutput({
      clock: this.clock,
      onDone,
      ...this.layout.planPrinting(target, startsAtBlock),
    })
  }

  /** Up from the first screen types `exit` and reprints the hero. There is no logout screen. */
  private countUpwardAtTop(amount: number, needed: number): void {
    if (this.isBusy || this.isPlain) {
      return
    }
    const isAtTop = this.currentStepIndex === 0 && this.elements.scroller.scrollTop <= 0
    if (!isAtTop || amount <= 0) {
      this.exitPull = 0
      return
    }
    this.exitPull += amount
    if (this.exitPull >= needed) {
      this.exitPull = 0
      this.runCommand(EXIT_COMMAND, INITIAL_PATH, (done) => this.land(0, 'down', done))
    }
  }

  private fastForwardIfBusy = (): void => {
    if (this.isBusy) {
      this.clock.fastForward()
    }
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isPlain) {
      return
    }
    this.fastForwardIfBusy()
    if (KEYS_THAT_SCROLL_UP.has(event.key)) {
      this.countUpwardAtTop(SCROLL_UP_AT_TOP_TO_EXIT_PIXELS, SCROLL_UP_AT_TOP_TO_EXIT_PIXELS)
    }
    const jumpSection = JUMP_KEY_SECTION[event.key]
    if (!jumpSection) {
      return
    }
    // A smooth scroll to the end would race every command it passes, so these keys jump instead.
    event.preventDefault()
    this.navigate(jumpSection, {
      stepIndex: event.key === 'End' ? this.steps.length - 1 : undefined,
    })
  }

  /** A control reached by keyboard must be on screen, not behind the prompt or above the clip. */
  private revealFocused = (target: HTMLElement): void => {
    const block = target.closest<HTMLElement>('[data-block]')
    if (this.isPlain || this.isBusy || !block) {
      return
    }
    const stepIndex = this.steps.findIndex((step) => step.blockId === block.dataset.block)
    if (stepIndex !== this.currentStepIndex) {
      this.currentStepIndex = stepIndex
      this.layout.showStep(stepIndex)
      this.scroll.setScroll(this.layout.mappedSteps[stepIndex].start)
      this.draw()
      this.announceLocation()
    }
    const revealedAt = this.layout.scrollToReveal(
      target,
      stepIndex,
      this.elements.scroller.scrollTop,
    )
    if (revealedAt !== null) {
      this.scroll.setScroll(revealedAt)
    }
    this.draw()
  }
}
