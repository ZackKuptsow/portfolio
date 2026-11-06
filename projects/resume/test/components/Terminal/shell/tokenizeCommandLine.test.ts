import { describe, expect, it } from 'vitest'

import { REFUSED_TOKENS } from '@/components/Terminal/shell/constants'
import { tokenizeCommandLine } from '@/components/Terminal/shell/tokenizeCommandLine'

describe('tokenizeCommandLine', () => {
  it('splits words and commands, and trims the line', () => {
    expect(tokenizeCommandLine('  clear && cd ./work_experience && ls ')).toEqual({
      commands: [['clear'], ['cd', './work_experience'], ['ls']],
      kind: 'ok',
    })
  })

  it('groups and strips a pair of double or single quotes', () => {
    expect(tokenizeCommandLine(`echo "Let's build something amazing together"`)).toEqual({
      commands: [['echo', "Let's build something amazing together"]],
      kind: 'ok',
    })
    expect(tokenizeCommandLine("echo 'a  b' c")).toEqual({
      commands: [['echo', 'a  b', 'c']],
      kind: 'ok',
    })
  })

  it('refuses each unsupported token with the token named', () => {
    expect(REFUSED_TOKENS).toEqual(['|', ';', '>', '<', '`', '$('])
    for (const token of REFUSED_TOKENS) {
      expect(tokenizeCommandLine(`ls ${token} x`)).toEqual({ kind: 'syntax-error', token })
    }
  })

  it('leaves a refused character alone inside quotes', () => {
    expect(tokenizeCommandLine('echo "a | b"')).toEqual({
      commands: [['echo', 'a | b']],
      kind: 'ok',
    })
  })

  it('treats an empty line as no commands, and closes an open quote at the end', () => {
    expect(tokenizeCommandLine('   ')).toEqual({ commands: [], kind: 'ok' })
    expect(tokenizeCommandLine('echo "open')).toEqual({ commands: [['echo', 'open']], kind: 'ok' })
  })

  it('drops an empty command between two joiners, as a word list with nothing in it', () => {
    expect(tokenizeCommandLine('ls && && pwd')).toEqual({
      commands: [['ls'], ['pwd']],
      kind: 'ok',
    })
  })
})
