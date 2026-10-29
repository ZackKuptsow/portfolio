import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProjectDemo } from '@/components/ProjectDemo'
import type { ProjectVideo } from '@/data/projects'

const VIDEO: ProjectVideo = {
  description: 'A tour of the app on a phone.',
  durationLabel: '1:30',
  posterPath: '/tour-poster.jpg',
  sourcePath: '/tour.mp4',
  title: 'The app, a short tour',
  triggerLabel: 'watch the tour',
}

/** The dialog, open or closed. The role query hides a closed dialog, so this goes by tag. */
function findDialog(container: HTMLElement): HTMLDialogElement {
  const dialog = container.querySelector('dialog')
  if (!dialog) {
    throw new Error('no dialog rendered')
  }
  return dialog
}

describe('ProjectDemo', () => {
  // jsdom has no media playback, so pause() is a stub here. The check is that closing calls it.
  const pause = vi.fn()

  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(pause)
  })

  afterEach(() => {
    pause.mockReset()
    vi.restoreAllMocks()
  })

  it('offers the recording as a control that names it and its length, closed until pressed', () => {
    const { container } = render(<ProjectDemo video={VIDEO} />)

    const trigger = screen.getByRole('button', { name: 'watch the tour (1:30)' })

    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(findDialog(container).hasAttribute('open')).toBe(false)
  })

  it('opens the recording in a window named after it, and closes on the close button', async () => {
    const user = userEvent.setup()
    const { container } = render(<ProjectDemo video={VIDEO} />)

    await user.click(screen.getByRole('button', { name: 'watch the tour (1:30)' }))

    const dialog = findDialog(container)
    expect(dialog.hasAttribute('open')).toBe(true)
    expect(screen.getByRole('dialog', { name: VIDEO.title })).toBe(dialog)

    await user.click(screen.getByRole('button', { name: 'Close (esc)' }))

    expect(dialog.hasAttribute('open')).toBe(false)
  })

  it('pauses the recording when the window closes, so no sound plays on behind the page', async () => {
    const user = userEvent.setup()
    render(<ProjectDemo video={VIDEO} />)

    await user.click(screen.getByRole('button', { name: 'watch the tour (1:30)' }))
    expect(pause).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Close (esc)' }))

    expect(pause).toHaveBeenCalledTimes(1)
  })

  it('plays nothing until asked: the player loads the poster and the metadata only', () => {
    const { container } = render(<ProjectDemo video={VIDEO} />)

    const player = container.querySelector('video')

    expect(player?.getAttribute('preload')).toBe('metadata')
    expect(player?.getAttribute('poster')).toBe(VIDEO.posterPath)
    expect(player?.hasAttribute('autoplay')).toBe(false)
    expect(player?.hasAttribute('controls')).toBe(true)
  })

  it('names the recording for anyone who cannot watch it, and offers the file', () => {
    const { container } = render(<ProjectDemo video={VIDEO} />)

    const player = container.querySelector('video')
    const source = container.querySelector('video > source')
    const download = container.querySelector('video > a')

    expect(player?.getAttribute('aria-label')).toBe(VIDEO.description)
    expect(source?.getAttribute('src')).toBe(VIDEO.sourcePath)
    expect(source?.getAttribute('type')).toBe('video/mp4')
    expect(download?.getAttribute('href')).toBe(VIDEO.sourcePath)
    expect(download?.textContent).toBe('Download the recording')
  })
})
