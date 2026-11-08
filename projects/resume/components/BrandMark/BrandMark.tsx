import {
  ACTIVE_MARK,
  MARKS,
  MARK_GRID_SIZE,
  MARK_INK_COLOR,
  MARK_TILE_COLOR,
  MARK_TILE_CORNER_RADIUS,
} from '@/brand/marks'
import type { MarkShape } from '@/brand/marks'

type BrandMarkProps = {
  className?: string
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
 * it is hidden from assistive technology. Which mark it draws is `ACTIVE_MARK`.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg aria-hidden="true" className={className} focusable="false" viewBox={VIEW_BOX}>
      <rect
        fill={MARK_TILE_COLOR}
        height={MARK_GRID_SIZE}
        rx={MARK_TILE_CORNER_RADIUS}
        width={MARK_GRID_SIZE}
      />
      {MARKS[ACTIVE_MARK].shapes.map((shape) => (
        <Shape key={shape.d} shape={shape} />
      ))}
    </svg>
  )
}
