import { beforeEach, describe, expect, it } from 'vitest'

import { SESSION_OUTPUT_ATTRIBUTE, SessionOutput } from '@/components/Terminal/shell/SessionOutput'

function block(id: string): HTMLElement {
  const element = document.createElement('div')
  element.className = 'terminal-block'
  element.dataset.block = id
  return element
}

describe('SessionOutput', () => {
  let scene: HTMLElement
  let blockA: HTMLElement
  let blockB: HTMLElement
  let session: SessionOutput

  beforeEach(() => {
    document.body.replaceChildren()
    scene = document.createElement('div')
    blockA = block('work-0')
    blockB = block('work-1')
    scene.append(blockA, blockB)
    document.body.append(scene)
    session = new SessionOutput()
  })

  it('sits after the block as its next sibling, once, and is read as it prints', () => {
    const first = session.ensureAfter(blockA)
    const second = session.ensureAfter(blockA)

    expect(first).toBe(second)
    expect(blockA.nextElementSibling).toBe(first)
    expect(first.hasAttribute(SESSION_OUTPUT_ATTRIBUTE)).toBe(true)
    expect(first.getAttribute('aria-live')).toBe('polite')
    expect(first.className).toBe('terminal-session')
    expect(session.element).toBe(first)
  })

  it('keeps what was typed after one card when typing moves on to the next', () => {
    const first = session.ensureAfter(blockA)
    const second = session.ensureAfter(blockB)

    expect(document.querySelectorAll(`[${SESSION_OUTPUT_ATTRIBUTE}]`)).toHaveLength(2)
    expect(blockA.nextElementSibling).toBe(first)
    expect(blockB.nextElementSibling).toBe(second)
    expect(session.element).toBe(second)
    expect(session.ensureAfter(blockA)).toBe(first)
  })

  it('removes every container at once, and says whether there was anything to remove', () => {
    expect(session.remove()).toBe(false)

    session.ensureAfter(blockA)
    session.ensureAfter(blockB)

    expect(session.remove()).toBe(true)
    expect(document.querySelectorAll(`[${SESSION_OUTPUT_ATTRIBUTE}]`)).toHaveLength(0)
    expect(session.remove()).toBe(false)
  })

  it('appends nodes in order, and a blank of the asked height for clear', () => {
    session.ensureAfter(blockA)
    const line = document.createElement('p')
    line.textContent = 'ls'
    session.append([line])
    session.appendBlankScreen(640)

    const children = [...(session.element?.children ?? [])]
    expect(children[0]).toBe(line)
    expect(children[1].className).toBe('terminal-session-blank')
    expect((children[1] as HTMLElement).style.height).toBe('640px')
  })

  it('removes itself, and knows it is gone', () => {
    session.ensureAfter(blockA)
    session.remove()

    expect(document.querySelector(`[${SESSION_OUTPUT_ATTRIBUTE}]`)).toBeNull()
    expect(session.element).toBeNull()
    expect(() => session.remove()).not.toThrow()
  })

  it('refuses to append before it has a place', () => {
    expect(() => session.append([document.createElement('p')])).toThrow(/no session container/)
  })
})
