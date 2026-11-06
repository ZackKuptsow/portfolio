import { describe, expect, it } from 'vitest'

import { checkEasterEggs } from '@/components/Terminal/shell/checkEasterEggs'
import { terminalEasterEggs } from '@/data/terminalEasterEggs'

// The eggs are chosen with Zack on a decision page and added here. Until then the list is empty,
// and this keeps whatever is added to the rules the shell relies on: no name of the table's, no
// duplicate, no em or en dash, art that fits its columns, files with a place to live.
describe('the easter eggs', () => {
  it('follow the rules the shell relies on', () => {
    expect(checkEasterEggs(terminalEasterEggs)).toEqual([])
  })
})
