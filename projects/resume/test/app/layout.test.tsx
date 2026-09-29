import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import RootLayout, { metadata } from '@/app/layout'

// next/font only works inside the Next compiler, so it cannot be imported for
// real here. The layout reads exactly these two fonts, and both are supplied.
vi.mock('next/font/google', () => ({
  IBM_Plex_Sans: () => ({ variable: 'font-ibm-plex-sans-stub' }),
  JetBrains_Mono: () => ({ variable: 'font-jetbrains-mono-stub' }),
}))

// The stylesheet needs the Tailwind PostCSS plugin, which only the Next build
// runs. It has no exports and nothing here reads styles.
vi.mock('@/app/globals.css', () => ({}))

const STRUCTURED_DATA_SCRIPT = /<script type="application\/ld\+json">/g

function renderLayout(): string {
  return renderToStaticMarkup(
    <RootLayout>
      <main>page content</main>
    </RootLayout>,
  )
}

describe('RootLayout', () => {
  it('puts the structured data in the head, once', () => {
    const [head] = renderLayout().split('</head>')

    expect(head.match(STRUCTURED_DATA_SCRIPT)).toHaveLength(1)
  })

  it('renders the page inside the body', () => {
    const [, body] = renderLayout().split('</head>')

    expect(body).toContain('<main>page content</main>')
  })

  it('hands Next the metadata that names the site and its canonical address', () => {
    expect(metadata.title).toBe('Zack Kuptsow | Full-Stack Software Engineer')
    expect(metadata.alternates?.canonical).toBe('/')
  })
})
