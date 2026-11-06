import { describe, expect, it, vi } from 'vitest'

import { GIT_LOG_LINES, readGitLog } from '@/app/readGitLog'

const SHORT_HASH_THEN_SUBJECT = /^[0-9a-f]{7,} \S/

describe('readGitLog', () => {
  it('returns one line per commit, asking git for a fixed number in oneline form', () => {
    const runGit = vi.fn(() => 'abc1234 feat: one\nbcd2345 fix: two\n')

    const lines = readGitLog(runGit)

    expect(lines).toEqual(['abc1234 feat: one', 'bcd2345 fix: two'])
    expect(runGit).toHaveBeenCalledWith(['log', '-n', String(GIT_LOG_LINES), '--format=%h %s'])
  })

  // No em or en dash in anything a visitor reads, and a commit subject can hold one.
  it('prints a plain hyphen for an em or en dash in a commit subject', () => {
    const lines = readGitLog(() => 'abc1234 fix: one — two\nbcd2345 fix: three – four\n')

    expect(lines).toEqual(['abc1234 fix: one - two', 'bcd2345 fix: three - four'])
  })

  it('reads the real repository by default', () => {
    const lines = readGitLog()

    expect(lines.length).toBeGreaterThan(0)
    expect(lines.length).toBeLessThanOrEqual(GIT_LOG_LINES)
    expect(lines[0]).toMatch(SHORT_HASH_THEN_SUBJECT)
  })

  it('fails loudly when git has nothing to say', () => {
    expect(() => readGitLog(() => '')).toThrow(/git log/)
  })

  it('fails loudly when git cannot run', () => {
    const runGit = () => {
      throw new Error('spawnSync git ENOENT')
    }

    expect(() => readGitLog(runGit)).toThrow(/git log.*ENOENT/)
  })
})
