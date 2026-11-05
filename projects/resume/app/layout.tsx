import './globals.css'

import localFont from 'next/font/local'

import { PRE_PAINT_SCRIPT } from '@/app/prePaintScript'
import { siteMetadata } from '@/app/siteMetadata'
import ClientOnly from '@/components/ClientOnly'
import GlowCursor from '@/components/GlowCursor'
import { StructuredData } from '@/components/StructuredData'
import { THEME_COLOR } from '@/components/themeColor'

import type { Metadata, Viewport } from 'next'

/**
 * JetBrains Mono powers every terminal surface, long text included, so each line
 * reads as terminal output. The file is variable, and a variable file needs its
 * weight given as a range: with one number the browser draws bold by smearing the
 * regular weight. This range is the file's whole weight axis.
 */
const jetBrainsMono = localFont({
  display: 'swap',
  src: './fonts/jetbrains-mono/latin.woff2',
  variable: '--font-jetbrains-mono',
  weight: '100 800',
})

/**
 * IBM Plex Sans carries the SMS pages, which a reviewer reads word for word. The
 * file is variable as well, with a weight axis from 100 to 700. The range starts
 * at 400 because the page offers nothing lighter: a lighter request keeps drawing
 * regular, not a thin weight no design chose.
 */
const ibmPlexSans = localFont({
  display: 'swap',
  src: './fonts/ibm-plex-sans/latin.woff2',
  variable: '--font-ibm-plex-sans',
  weight: '400 700',
})

export const metadata: Metadata = siteMetadata

/** Dark, as the site opens for everyone. `useTheme` changes it for a visitor who chose light. */
export const viewport: Viewport = {
  themeColor: THEME_COLOR.dark,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jetBrainsMono.variable} ${ibmPlexSans.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT_SCRIPT }} />
        <StructuredData />
      </head>
      <body className="bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 antialiased">
        <ClientOnly>
          <GlowCursor />
        </ClientOnly>
        {children}
      </body>
    </html>
  )
}
