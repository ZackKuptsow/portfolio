import { describe, expect, it } from 'vitest'

import { toTerminalFileName } from '@/components/terminalFileName'

describe('toTerminalFileName', () => {
  it.each([
    { title: 'DrayNow', fileName: 'draynow' },
    { title: 'Work Experience', fileName: 'work_experience' },
    { title: 'University of Delaware', fileName: 'university_of_delaware' },
  ])('lowercases "$title" and joins its words with underscores', ({ title, fileName }) => {
    expect(toTerminalFileName(title)).toBe(fileName)
  })

  it('drops a trailing period, so the extension is not preceded by two dots', () => {
    expect(toTerminalFileName('Low Rate Co.')).toBe('low_rate_co')
  })

  it('drops an ampersand without leaving a doubled underscore', () => {
    expect(toTerminalFileName('Languages & Frameworks')).toBe('languages_frameworks')
  })
})
