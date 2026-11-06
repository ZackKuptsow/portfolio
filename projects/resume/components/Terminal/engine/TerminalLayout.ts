import {
  ENGINE_READY_ATTRIBUTE,
  MEASURING_TRACK_PIXELS,
  PROMPT_CLEARANCE_PIXELS,
  TERMINAL_ON_CLASS,
} from '../constants'
import {
  TRACK_ROOM_PAST_THE_END_PIXELS,
  keepPlaceInStep,
  mapStepsToScroll,
  offsetAt,
} from './scrollMap'
import { clipToWholeRows, formatRowClip, measureTextRows } from './textRows'
import { SESSION_OUTPUT_ATTRIBUTE } from '../shell/SessionOutput'

import type { SectionId, TerminalStep } from '../types'
import type { MappedStep } from './scrollMap'
import type { PrintRun } from './streamOutput'
import type { TextRow } from './textRows'

/** The elements the terminal draws with. React renders them, and only their styles change here. */
export type TerminalElements = {
  footer: HTMLElement
  prompt: HTMLElement
  root: HTMLElement
  scroller: HTMLElement
  stage: HTMLElement
  track: HTMLElement
  typed: HTMLElement
}

const HERO_HEIGHT_VARIABLE = '--terminal-hero-height'
const FOOTER_HEIGHT_VARIABLE = '--terminal-footer-height'
const TITLE_HEIGHT_VARIABLE = '--terminal-title-height'
/** Below this the prompt shows the short path. The stylesheet changes it at the same width. */
const PROMPT_SHORT_PATH_BELOW_PIXELS = 480

/** A column that prints on its own carries this attribute. Skills has three. */
const PRINT_COLUMN_SELECTOR = '[data-print-column]'
const NOTHING_SHOWN_CLIP = 'inset(0 0 100% 0)'

/** The longest line the prompt can hold, in characters, by which path it is showing. */
export type LongestPromptLine = {
  withFullPath: number
  withShortPath: number
}

/** How a step's output prints, ready for `streamOutput`. */
export type PrintPlan = {
  /** Takes back anything the runs left on the page, whether or not they got to the end. */
  finish: () => void
  lineHeight: number
  runs: readonly PrintRun[]
}

/**
 * What the terminal looks like at a given step and scroll position: the measurements, which
 * section shows, and which rows of it. It holds no state about commands or the reader.
 */
export class TerminalLayout {
  private readonly elements: TerminalElements
  private readonly longestPromptLine: LongestPromptLine
  private readonly steps: readonly TerminalStep[]

  private rowsByScene = new Map<SectionId, readonly TextRow[]>()
  private measuredSize = ''

  /** Where each step sits on the scroll track, and which part of its scene it shows. */
  mappedSteps: readonly MappedStep[] = []
  /** The height of screen the output may use, above the prompt. */
  usableHeight = 0

  constructor(
    elements: TerminalElements,
    steps: readonly TerminalStep[],
    longestPromptLine: LongestPromptLine,
  ) {
    this.elements = elements
    this.steps = steps
    this.longestPromptLine = longestPromptLine
  }

  sceneById(sectionId: SectionId): HTMLElement {
    const scene = this.elements.stage.querySelector<HTMLElement>(`[data-scene="${sectionId}"]`)
    if (!scene) {
      throw new Error(`The terminal has no scene for the section "${sectionId}"`)
    }
    return scene
  }

  sceneOf(stepIndex: number): HTMLElement {
    return this.sceneById(this.steps[stepIndex].sectionId)
  }

  blockOf(stepIndex: number): HTMLElement {
    const { blockId } = this.steps[stepIndex]
    const block = this.elements.stage.querySelector<HTMLElement>(`[data-block="${blockId}"]`)
    if (!block) {
      throw new Error(`The terminal has no block "${blockId}"`)
    }
    return block
  }

  private allScenes(): readonly HTMLElement[] {
    return [...this.elements.stage.querySelectorAll<HTMLElement>('[data-scene]')]
  }

  /**
   * What the lines depend on. The scroller's width changes when a scrollbar appears, and the root
   * font size when the reader changes the text size, and neither resizes the terminal itself.
   */
  private readSize(): string {
    const { root, scroller } = this.elements
    const rootFontSize = getComputedStyle(document.documentElement).fontSize
    return `${root.clientWidth}x${root.clientHeight}x${scroller.clientWidth}x${rootFontSize}`
  }

  /** Whether the terminal's size has changed since it was last measured. */
  hasSizeChanged(): boolean {
    return this.readSize() !== this.measuredSize
  }

  /** Characters of the prompt's font that fit in the width of an element. */
  measureColumns(element: HTMLElement, width: number): number {
    const probe = document.createElement('span')
    probe.style.position = 'absolute'
    probe.style.visibility = 'hidden'
    probe.textContent = '0'
    element.append(probe)
    const characterWidth = probe.getBoundingClientRect().width
    probe.remove()
    return Math.max(1, Math.floor(width / characterWidth))
  }

  /**
   * The room a command can wrap into stays reserved at every width and text size, so typing
   * never covers a line of output. Phones wrap the long ones.
   */
  private measurePromptReserve(): number {
    const { prompt } = this.elements
    const styles = getComputedStyle(prompt)
    const framing =
      parseFloat(styles.paddingTop) +
      parseFloat(styles.paddingBottom) +
      parseFloat(styles.borderTopWidth)
    return this.promptRows().rows * parseFloat(styles.lineHeight) + framing
  }

  /** The rows the prompt keeps for the longest command, and the characters each holds. */
  private promptRows(): { columns: number; rows: number } {
    const { prompt, root } = this.elements
    const styles = getComputedStyle(prompt)
    const innerWidth =
      root.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight)
    const longestLine =
      root.clientWidth < PROMPT_SHORT_PATH_BELOW_PIXELS
        ? this.longestPromptLine.withShortPath
        : this.longestPromptLine.withFullPath
    const columns = this.measureColumns(prompt, innerWidth)
    return { columns, rows: Math.max(1, Math.ceil(longestLine / columns)) }
  }

  /** Characters a typed line may have after a prefix, so typing never grows the prompt. */
  promptLineCapacity(prefixLength: number): number {
    const { columns, rows } = this.promptRows()
    return Math.max(0, rows * columns - prefixLength)
  }

  /** Measure after fonts, after scrollbars, and on rotation. Each of these moves every line. */
  measure(): void {
    const { footer, root, scroller, stage, track } = this.elements
    this.measuredSize = this.readSize()
    stage.style.height = `${scroller.clientHeight}px`
    track.style.height = `${MEASURING_TRACK_PIXELS}px`
    root.style.setProperty(FOOTER_HEIGHT_VARIABLE, `${footer.offsetHeight}px`)
    root.style.setProperty(TITLE_HEIGHT_VARIABLE, `${scroller.offsetTop}px`)
    this.usableHeight =
      scroller.clientHeight -
      footer.offsetHeight -
      this.measurePromptReserve() -
      PROMPT_CLEARANCE_PIXELS

    const scenes = this.allScenes()
    for (const scene of scenes) {
      scene.removeAttribute('hidden')
      scene.classList.add('is-active')
    }
    this.fitHeroToScreen()

    this.mappedSteps = mapStepsToScroll(
      this.steps.map((step, index) => {
        const sceneTop = this.sceneOf(index).getBoundingClientRect().top
        const block = this.blockOf(index)
        const box = block.getBoundingClientRect()
        return {
          bottom: this.bottomWithSessionOutput(block, box.bottom) - sceneTop,
          clearsBefore: step.clearsBefore,
          top: box.top - sceneTop,
        }
      }),
      this.usableHeight,
    )
    this.rowsByScene = new Map(
      scenes.map((scene) => [scene.dataset.scene as SectionId, measureTextRows(scene)]),
    )
    const lastStep = this.mappedSteps[this.mappedSteps.length - 1]
    track.style.height = `${lastStep.end + TRACK_ROOM_PAST_THE_END_PIXELS + scroller.clientHeight}px`
  }

  /**
   * A step reaches to the bottom of its block, or of the typed shell's output after it, whichever
   * is lower, so what a visitor typed is on the scroll track like everything else.
   */
  private bottomWithSessionOutput(block: HTMLElement, blockBottom: number): number {
    const next = block.nextElementSibling
    if (next instanceof HTMLElement && next.hasAttribute(SESSION_OUTPUT_ATTRIBUTE)) {
      return Math.max(blockBottom, next.getBoundingClientRect().bottom)
    }
    return blockBottom
  }

  /** The hero fills what the screen has, so its one screen needs no scrolling of its own. */
  private fitHeroToScreen(): void {
    const output = this.sceneById('hero').querySelector<HTMLElement>('.terminal-output')
    if (!output) {
      return
    }
    const styles = getComputedStyle(output)
    const padding = parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom)
    this.elements.root.style.setProperty(HERO_HEIGHT_VARIABLE, `${this.usableHeight - padding}px`)
  }

  /** Re-measures, and answers where the scroll goes so the reader keeps their place in the step. */
  remeasureKeepingPlace(stepIndex: number, scrollTop: number): number {
    const previous = this.mappedSteps[stepIndex]
    this.measure()
    return keepPlaceInStep(previous, this.mappedSteps[stepIndex], scrollTop)
  }

  /** Only the section on screen shows, and within it only the cards the reader has reached. */
  showStep(stepIndex: number): void {
    const activeScene = this.sceneOf(stepIndex)
    for (const scene of this.allScenes()) {
      const isActive = scene === activeScene
      scene.classList.toggle('is-active', isActive)
      if (isActive) {
        scene.removeAttribute('hidden')
      } else {
        // Hidden this way, a section can still be found by search and find in page.
        scene.setAttribute('hidden', 'until-found')
        scene.style.clipPath = ''
      }
    }
    let lastClear = stepIndex
    while (lastClear > 0 && !this.steps[lastClear].clearsBefore) {
      lastClear -= 1
    }
    this.steps.forEach((step, index) => {
      const isReached = index >= lastClear && index <= stepIndex
      const isOnActiveScene = step.sectionId === this.steps[stepIndex].sectionId
      this.blockOf(index).classList.toggle('is-cleared', isOnActiveScene && !isReached)
    })
  }

  /** Moves the scene 1:1 with the scroll and shows only whole rows of it. */
  draw(stepIndex: number, scrollTop: number): void {
    const offset = offsetAt(this.mappedSteps[stepIndex], scrollTop)
    const scene = this.sceneOf(stepIndex)
    scene.style.transform = `translate3d(0, ${-offset}px, 0)`
    this.clipScene(scene, offset, offset + this.usableHeight)
  }

  clipScene(scene: HTMLElement, fromTop: number, toBottom: number): void {
    const rows = this.rowsByScene.get(scene.dataset.scene as SectionId)
    if (rows) {
      scene.style.clipPath = formatRowClip(clipToWholeRows(rows, fromTop, toBottom))
    }
  }

  /**
   * What prints on screen for a step, in order, in heights of its scene. A block with columns prints
   * what is above them, then each column from its own top, so they read as column 1, then 2, then 3.
   * Stacked on a phone, that comes out top down like everything else.
   */
  planPrinting(stepIndex: number, startsAtBlock: boolean): PrintPlan {
    const scene = this.sceneOf(stepIndex)
    const block = this.blockOf(stepIndex)
    const sceneBox = scene.getBoundingClientRect()
    const screenTop = this.elements.stage.getBoundingClientRect().top - sceneBox.top
    const screenBottom = Math.min(sceneBox.height, screenTop + this.usableHeight)
    const blockTop = block.getBoundingClientRect().top - sceneBox.top
    const fromHeight = startsAtBlock ? Math.max(screenTop, blockTop) : screenTop
    const output = scene.querySelector<HTMLElement>('.terminal-output') ?? scene
    const lineHeight = parseFloat(getComputedStyle(output).lineHeight)
    const showSceneTo = (height: number) => this.clipScene(scene, screenTop, height)

    const columns = [...block.querySelectorAll<HTMLElement>(PRINT_COLUMN_SELECTOR)]
    if (columns.length === 0) {
      return {
        finish: () => undefined,
        lineHeight,
        runs: [{ fromHeight, showTo: showSceneTo, toHeight: screenBottom }],
      }
    }

    const heightOf = (box: DOMRect) => ({
      bottom: box.bottom - sceneBox.top,
      top: box.top - sceneBox.top,
    })
    const columnsTop = Math.min(
      ...columns.map((column) => heightOf(column.getBoundingClientRect()).top),
    )
    const columnRuns = columns.flatMap((column): PrintRun[] => {
      const { bottom, top } = heightOf(column.getBoundingClientRect())
      if (top >= screenBottom || bottom <= screenTop) {
        return []
      }
      const rows = measureTextRows(column)
      column.style.clipPath = NOTHING_SHOWN_CLIP
      return [
        {
          fromHeight: Math.max(top, screenTop),
          showTo: (height) => {
            showSceneTo(screenBottom)
            column.style.clipPath = formatRowClip(clipToWholeRows(rows, 0, height - top))
          },
          toHeight: Math.min(bottom, screenBottom),
        },
      ]
    })
    return {
      finish: () => this.clearColumnClips(),
      lineHeight,
      runs: [
        { fromHeight, showTo: showSceneTo, toHeight: Math.min(columnsTop, screenBottom) },
        ...columnRuns,
      ],
    }
  }

  /**
   * What prints for typed output: from a height in the scene, the bottom of what was there before,
   * down to the bottom of what can show on screen.
   */
  planPrintingFrom(stepIndex: number, fromSceneHeight: number): PrintPlan {
    const scene = this.sceneOf(stepIndex)
    const sceneBox = scene.getBoundingClientRect()
    const screenTop = this.elements.stage.getBoundingClientRect().top - sceneBox.top
    const screenBottom = Math.min(sceneBox.height, screenTop + this.usableHeight)
    const output = scene.querySelector<HTMLElement>('.terminal-output') ?? scene
    return {
      finish: () => undefined,
      lineHeight: parseFloat(getComputedStyle(output).lineHeight),
      runs: [
        {
          fromHeight: Math.max(screenTop, fromSceneHeight),
          showTo: (height) => this.clipScene(scene, screenTop, height),
          toHeight: screenBottom,
        },
      ],
    }
  }

  private clearColumnClips(): void {
    for (const column of this.elements.stage.querySelectorAll<HTMLElement>(PRINT_COLUMN_SELECTOR)) {
      column.style.clipPath = ''
    }
  }

  /** The element the fake download prints into. */
  downloadOutput(): HTMLElement {
    const output = this.sceneById('resume').querySelector<HTMLElement>('[data-download-output]')
    if (!output) {
      throw new Error('The resume section has no place to print the download')
    }
    return output
  }

  /**
   * The scroll position that brings an element of this step on screen, or null when it already
   * is. A control reached by keyboard must not sit behind the prompt or above the clip.
   */
  scrollToReveal(element: HTMLElement, stepIndex: number, scrollTop: number): number | null {
    const mapped = this.mappedSteps[stepIndex]
    const sceneTop = this.sceneOf(stepIndex).getBoundingClientRect().top
    const box = element.getBoundingClientRect()
    const shownFrom = offsetAt(mapped, scrollTop)
    if (box.bottom - sceneTop > shownFrom + this.usableHeight) {
      return mapped.sectionStart + box.bottom - sceneTop - this.usableHeight
    }
    if (box.top - sceneTop < shownFrom) {
      return mapped.sectionStart + Math.max(0, box.top - sceneTop)
    }
    return null
  }

  /** Takes every style back off, and the plain flow in the server's HTML is what remains. */
  applyPlainFlow(): void {
    const { root, stage, track } = this.elements
    document.documentElement.classList.remove(TERMINAL_ON_CLASS)
    root.removeAttribute(ENGINE_READY_ATTRIBUTE)
    root.style.removeProperty(HERO_HEIGHT_VARIABLE)
    root.style.removeProperty(FOOTER_HEIGHT_VARIABLE)
    root.style.removeProperty(TITLE_HEIGHT_VARIABLE)
    track.style.height = ''
    stage.style.height = ''
    for (const scene of this.allScenes()) {
      scene.removeAttribute('hidden')
      scene.classList.remove('is-active')
      scene.style.clipPath = ''
      scene.style.transform = ''
    }
    for (const block of stage.querySelectorAll('.is-cleared')) {
      block.classList.remove('is-cleared')
    }
    this.clearColumnClips()
  }

  /** The other way: the page goes back to being one fixed screen. */
  applyTerminalFlow(): void {
    document.documentElement.classList.add(TERMINAL_ON_CLASS)
    this.elements.root.setAttribute(ENGINE_READY_ATTRIBUTE, '')
  }
}
