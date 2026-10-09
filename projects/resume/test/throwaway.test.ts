import { expect, it } from 'vitest'

it('fails on purpose, to prove the test gate goes red', () => {
  expect('green').toBe('red')
})
