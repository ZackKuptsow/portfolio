import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { StructuredData } from '@/components/StructuredData'

const BUILD_TIME = new Date('2026-09-29T12:00:00.000Z')
const SCRIPT_PATTERN = /^<script type="([^"]+)">(.*)<\/script>$/s

describe('StructuredData', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(BUILD_TIME)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('emits one script that a crawler recognizes and can parse', () => {
    const [, scriptType, scriptBody] =
      renderToStaticMarkup(<StructuredData />).match(SCRIPT_PATTERN) ?? []

    expect(scriptType).toBe('application/ld+json')
    // JSON.parse throws if React escaped the quotes, which is what happens
    // when the data is rendered as children instead of as inner HTML.
    expect(JSON.parse(scriptBody)).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      dateModified: '2026-09-29T12:00:00.000Z',
      mainEntity: { '@id': 'https://kups.me/#person', name: 'Zack Kuptsow' },
    })
  })
})
