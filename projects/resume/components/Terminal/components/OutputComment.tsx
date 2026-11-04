import { OUTPUT_COMMENT } from '../constants'

type OutputCommentProps = {
  /** The section id or file name the comment belongs to. */
  commentKey: string
}

/**
 * A comment is a line of the output, so it scrolls with the text and never covers any. It is
 * decoration, hidden from assistive technology like the typed commands.
 */
export function OutputComment({ commentKey }: OutputCommentProps) {
  const comment = OUTPUT_COMMENT[commentKey]
  if (!comment) {
    return null
  }
  return (
    <p aria-hidden="true" className="terminal-comment">
      {comment}
    </p>
  )
}
