import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import robots from '@/app/robots'
import sitemap from '@/app/sitemap'

const BUILD_TIME = new Date('2026-09-29T12:00:00.000Z')

describe('robots', () => {
  it('lets every crawler read the whole site and points it at the sitemap', () => {
    expect(robots()).toEqual({
      rules: { allow: '/', userAgent: '*' },
      sitemap: 'https://kups.me/sitemap.xml',
    })
  })

  it('blocks nothing, because a crawler must fetch the PDF to see its noindex header', () => {
    expect(JSON.stringify(robots())).not.toContain('disallow')
  })
})

describe('sitemap', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(BUILD_TIME)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('lists the one page, stamped with the time of the build', () => {
    expect(sitemap()).toEqual([
      { changeFrequency: 'monthly', lastModified: BUILD_TIME, priority: 1, url: 'https://kups.me' },
    ])
  })
})
