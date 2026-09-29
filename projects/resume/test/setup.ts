import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library unmounts between tests on its own only when the runner exposes
// globals, and this config imports from vitest explicitly instead.
afterEach(() => {
  cleanup()
})

// jsdom 30 ships HTMLDialogElement as an empty class, with no showModal() or close().
// This stub only toggles `open` and fires `close`. Inertness, Escape and focus return
// are browser behavior, and they are checked by hand in Task 6.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
