import {
  ENGINE_READY_ATTRIBUTE,
  MEASURING_TRACK_PIXELS,
  PROMPT_CLEARANCE_PIXELS,
  TERMINAL_ON_CLASS,
} from '../constants'
import { keepPlaceInStep, mapStepsToScroll } from './scrollMap'
import { clipToWholeRows, formatRowClip, measureTextRows } from './textRows'

import type { SectionId, TerminalStep } from '../types'
import type { MappedStep } from './scrollMap'
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

/**
 * What the terminal looks like at a given step and scroll position: the measurements, which
 * section shows, and which rows of it. It holds no state about commands or the reader.
 */
export class TerminalLayout {
  private readonly elements: TerminalElements
  private readonly longestPromptLine: number
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
    longestPromptLine: number,
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
    const { prompt, root } = this.elements
    const styles = getComputedStyle(prompt)
    const framing =
      parseFloat(styles.paddingTop) +
      parseFloat(styles.paddingBottom) +
      parseFloat(styles.borderTopWidth)
    const innerWidth =
      root.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight)
    const rows = Math.ceil(this.longestPromptLine / this.measureColumns(prompt, innerWidth))
    return rows * parseFloat(styles.lineHeight) + framing
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
        const box = this.blockOf(index).getBoundingClientRect()
        return {
          bottom: box.bottom - sceneTop,
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
    track.style.height = `${lastStep.end + scroller.clientHeight}px`
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
    const mapped = this.mappedSteps[stepIndex]
    const moved = Math.min(mapped.length, Math.max(0, scrollTop - mapped.start))
    const offset = mapped.offsetStart + moved
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

  /** Where the printing of a step starts and ends on screen, in heights of its scene. */
  planPrinting(
    stepIndex: number,
    startsAtBlock: boolean,
  ): {
    fromHeight: number
    lineHeight: number
    showTo: (height: number) => void
    toHeight: number
  } {
    const scene = this.sceneOf(stepIndex)
    const sceneTop = scene.getBoundingClientRect().top
    const screenTop = this.elements.stage.getBoundingClientRect().top - sceneTop
    const sceneHeight = scene.getBoundingClientRect().height
    const blockTop = this.blockOf(stepIndex).getBoundingClientRect().top - sceneTop
    const output = scene.querySelector<HTMLElement>('.terminal-output') ?? scene
    return {
      fromHeight: startsAtBlock ? Math.max(screenTop, blockTop) : screenTop,
      lineHeight: parseFloat(getComputedStyle(output).lineHeight),
      showTo: (height) => this.clipScene(scene, screenTop, height),
      toHeight: Math.min(sceneHeight, screenTop + this.usableHeight),
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
    const shownFrom = mapped.offsetStart + Math.max(0, scrollTop - mapped.start)
    if (box.bottom - sceneTop > shownFrom + this.usableHeight) {
      return mapped.start + box.bottom - sceneTop - this.usableHeight - mapped.offsetStart
    }
    if (box.top - sceneTop < shownFrom) {
      return mapped.start + Math.max(0, box.top - sceneTop - mapped.offsetStart)
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
  }

  /** The other way: the page goes back to being one fixed screen. */
  applyTerminalFlow(): void {
    document.documentElement.classList.add(TERMINAL_ON_CLASS)
    this.elements.root.setAttribute(ENGINE_READY_ATTRIBUTE, '')
  }
}
