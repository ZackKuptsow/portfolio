import {
  ACTIVE_MARK,
  MARKS,
  MARK_GRID_SIZE,
  MARK_INK_COLOR,
  MARK_TILE_COLOR,
  MARK_TILE_CORNER_RADIUS,
} from '@/brand/marks'
import type { MarkCut, MarkShape } from '@/brand/marks'

type BrandMarkProps = {
  className?: string
  /** `small` where the mark is shown at about 26 pixels or less, `full` above that. */
  cut: MarkCut
}

const VIEW_BOX = `0 0 ${MARK_GRID_SIZE} ${MARK_GRID_SIZE}`

function Shape({ shape }: { shape: MarkShape }) {
  if (shape.kind === 'fill') {
    return <path d={shape.d} fill={MARK_INK_COLOR} />
  }
  return (
    <path
      d={shape.d}
      fill="none"
      stroke={MARK_INK_COLOR}
      strokeLinecap={shape.lineCap}
      strokeLinejoin="round"
      strokeWidth={shape.width}
    />
  )
}

/**
 * The site's mark, drawn inline on its near-black tile in both themes, as Zack asked: "On the
 * near-black tile everywhere". It is decoration beside text that already says who this is, so
 * it is hidden from assistive technology. Which mark it draws is `ACTIVE_MARK`, in the cut the
 * place asks for.
 */
export function BrandMark({ className, cut }: BrandMarkProps) {
  return (
    <svg aria-hidden="true" className={className} focusable="false" viewBox={VIEW_BOX}>
      <rect
        fill={MARK_TILE_COLOR}
        height={MARK_GRID_SIZE}
        rx={MARK_TILE_CORNER_RADIUS}
        width={MARK_GRID_SIZE}
      />
      {MARKS[ACTIVE_MARK].shapes[cut].map((shape) => (
        <Shape key={shape.d} shape={shape} />
      ))}
    </svg>
  )
}
