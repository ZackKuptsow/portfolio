/** One row of text in a scene, in CSS pixels from the top of the scene. */
export type TextRow = {
  bottom: number
  top: number
}

/**
 * Merges boxes into rows: boxes that overlap on the way down are one row, so side-by-side
 * columns of lines at slightly different heights never get cut between them.
 */
export function mergeIntoRows(boxes: readonly TextRow[]): TextRow[] {
  const sortedBoxes = [...boxes].sort((first, second) => first.top - second.top)
  const rows: TextRow[] = []
  for (const box of sortedBoxes) {
    const lastRow = rows[rows.length - 1]
    if (lastRow && box.top < lastRow.bottom) {
      lastRow.bottom = Math.max(lastRow.bottom, box.bottom)
    } else {
      rows.push({ ...box })
    }
  }
  return rows
}

/** The rows of a scene that hold text. Text that is hidden from sight on purpose does not count. */
export function measureTextRows(scene: HTMLElement): TextRow[] {
  const sceneTop = scene.getBoundingClientRect().top
  const boxes: TextRow[] = []
  const walker = document.createTreeWalker(scene, NodeFilter.SHOW_TEXT)
  while (walker.nextNode()) {
    const textNode = walker.currentNode
    if (!textNode.textContent?.trim() || textNode.parentElement?.closest('.sr-only, dialog')) {
      continue
    }
    const range = document.createRange()
    range.selectNodeContents(textNode)
    for (const box of range.getClientRects()) {
      boxes.push({ bottom: box.bottom - sceneTop, top: box.top - sceneTop })
    }
  }
  return mergeIntoRows(boxes)
}

/** The heights in a scene between which its rows show. */
export type RowClip = {
  bottomEdge: number
  topEdge: number
}

/**
 * Shows only whole rows between two heights in the scene, as a terminal does. A row the edge
 * would cut through is left out altogether.
 */
export function clipToWholeRows(
  rows: readonly TextRow[],
  fromTop: number,
  toBottom: number,
): RowClip {
  let topEdge = fromTop
  let bottomEdge = toBottom
  for (const row of rows) {
    if (row.top < fromTop && row.bottom > fromTop) {
      topEdge = row.bottom
    }
    if (row.top < toBottom && row.bottom > toBottom) {
      bottomEdge = row.top
    }
  }
  return { bottomEdge, topEdge }
}

/**
 * The clip as CSS. The bottom is written from the top of the scene, through `calc`, so the edge
 * stays where it was worked out even if the scene has since grown.
 */
export function formatRowClip({ bottomEdge, topEdge }: RowClip): string {
  return `inset(${topEdge}px 0 calc(100% - ${bottomEdge}px) 0)`
}
