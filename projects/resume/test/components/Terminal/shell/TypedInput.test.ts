import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TypedInput } from '@/components/Terminal/shell/TypedInput'
import type { TypedInputHost } from '@/components/Terminal/shell/TypedInput'

function keyEvent(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { cancelable: true, key, ...init })
}

describe('TypedInput', () => {
  let typed: HTMLElement
  let host: TypedInputHost
  let input: TypedInput
  let onSubmit: ReturnType<typeof vi.fn>

  const type = (text: string) => {
    for (const character of text) {
      input.handleKey(keyEvent(character))
    }
  }

  beforeEach(() => {
    typed = document.createElement('span')
    onSubmit = vi.fn()
    host = {
      complete: () => [],
      maxLength: () => 80,
      onSubmit,
      typed,
    }
    input = new TypedInput(host)
  })

  it('leaves Space, arrows, Tab, Enter and Escape to the engine while the line is empty', () => {
    for (const key of [
      ' ',
      'ArrowUp',
      'ArrowDown',
      'Tab',
      'PageDown',
      'Enter',
      'Escape',
      'Home',
      'Backspace',
    ]) {
      expect(input.handleKey(keyEvent(key)), key).toBe(false)
    }
    expect(typed.textContent).toBe('')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('types printable keys and shows them, Space included once there is text', () => {
    for (const key of ['l', 's']) {
      expect(input.handleKey(keyEvent(key))).toBe(true)
    }
    const space = keyEvent(' ')
    expect(input.handleKey(space)).toBe(true)
    expect(space.defaultPrevented).toBe(true)

    expect(typed.textContent).toBe('ls ')
    expect(input.line).toBe('ls ')
  })

  it('ignores keys with Ctrl, Meta or Alt, except Ctrl+C and Ctrl+U which clear the line', () => {
    type('ls')
    expect(input.handleKey(keyEvent('v', { metaKey: true }))).toBe(false)
    expect(input.handleKey(keyEvent('a', { altKey: true }))).toBe(false)
    expect(input.handleKey(keyEvent('r', { ctrlKey: true }))).toBe(false)
    expect(input.line).toBe('ls')

    expect(input.handleKey(keyEvent('c', { ctrlKey: true }))).toBe(true)
    expect(input.line).toBe('')
    type('pwd')
    expect(input.handleKey(keyEvent('u', { ctrlKey: true }))).toBe(true)
    expect(input.line).toBe('')
    expect(typed.textContent).toBe('')
  })

  // On Windows AltGr reports Ctrl and Alt together, and `~` is an AltGr key on most of Europe's layouts.
  it('types a character made with AltGr, and takes no other key held with Ctrl and Alt', () => {
    expect(input.handleKey(keyEvent('~', { altKey: true, ctrlKey: true }))).toBe(true)
    expect(input.line).toBe('~')

    expect(input.handleKey(keyEvent('ArrowUp', { altKey: true, ctrlKey: true }))).toBe(false)
    expect(input.handleKey(keyEvent('~', { altKey: true, ctrlKey: true, metaKey: true }))).toBe(
      false,
    )
    expect(input.line).toBe('~')
  })

  it('deletes with Backspace and clears with Escape', () => {
    type('pwd')
    expect(input.handleKey(keyEvent('Backspace'))).toBe(true)
    expect(input.line).toBe('pw')
    expect(input.handleKey(keyEvent('Escape'))).toBe(true)
    expect(input.line).toBe('')
  })

  it('submits on Enter, clears, and recalls with Up only when there is text', () => {
    type('pwd')
    expect(input.handleKey(keyEvent('Enter'))).toBe(true)
    expect(onSubmit).toHaveBeenCalledWith('pwd')
    expect(input.line).toBe('')
    expect(typed.textContent).toBe('')

    input.recordHistory('pwd')
    input.recordHistory('ls -a')
    expect(input.handleKey(keyEvent('ArrowUp'))).toBe(false)
    expect(input.line).toBe('')

    type('x')
    const up = keyEvent('ArrowUp')
    expect(input.handleKey(up)).toBe(true)
    expect(up.defaultPrevented).toBe(true)
    expect(input.line).toBe('ls -a')
    input.handleKey(keyEvent('ArrowUp'))
    expect(input.line).toBe('pwd')
    input.handleKey(keyEvent('ArrowUp'))
    expect(input.line).toBe('pwd')
    input.handleKey(keyEvent('ArrowDown'))
    expect(input.line).toBe('ls -a')
    input.handleKey(keyEvent('ArrowDown'))
    expect(input.line).toBe('x')
  })

  it("completes the last word and prevents the browser's Tab", () => {
    host.complete = (prefix) => (prefix === 'wo' ? ['work_experience/'] : [])
    type('cd wo')
    const tab = keyEvent('Tab')

    expect(input.handleKey(tab)).toBe(true)
    expect(tab.defaultPrevented).toBe(true)
    expect(input.line).toBe('cd work_experience/')
    expect(typed.textContent).toBe('cd work_experience/')
  })

  it('completes several candidates to their common prefix', () => {
    host.complete = () => ['cyber_university_of_delaware.txt', 'eleg_university_of_delaware.txt']
    type('cat ')
    input.handleKey(keyEvent('Tab'))
    expect(input.line).toBe('cat ')

    host.complete = () => ['teampay.txt', 'terraform.txt']
    type('te')
    input.handleKey(keyEvent('Tab'))
    expect(input.line).toBe('cat te')
    host.complete = () => ['teampay.txt']
    input.handleKey(keyEvent('Tab'))
    expect(input.line).toBe('cat teampay.txt')
  })

  it('caps the line at what the prompt can hold', () => {
    host.maxLength = () => 8
    type('abcdefghijkl')

    expect(input.line).toBe('abcdefgh')
    expect(typed.textContent).toBe('abcdefgh')
  })

  it('consumes Left, Right, Home and End with text, so they neither move nor scroll', () => {
    type('ls')
    for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) {
      const event = keyEvent(key)
      expect(input.handleKey(event), key).toBe(true)
      expect(event.defaultPrevented, key).toBe(true)
    }
    expect(input.line).toBe('ls')
  })

  it('clears from outside, as a scroll past the end does', () => {
    type('ls')
    input.clearLine()
    expect(input.line).toBe('')
    expect(typed.textContent).toBe('')
  })
})
