import './globals.css'

import localFont from 'next/font/local'

import { siteMetadata } from '@/app/siteMetadata'
import ClientOnly from '@/components/ClientOnly'
import GlowCursor from '@/components/GlowCursor'
import { StructuredData } from '@/components/StructuredData'
import ThemeToggle from '@/components/ThemeToggle'

import type { Metadata, Viewport } from 'next'

/**
 * JetBrains Mono powers every terminal surface: headings, labels, and command
 * prompts. The file is variable, and a variable file needs its weight given as
 * a range: with one number the browser draws bold by smearing the regular
 * weight. This range is the file's whole weight axis.
 */
const jetBrainsMono = localFont({
  display: 'swap',
  src: './fonts/jetbrains-mono/latin.woff2',
  variable: '--font-jetbrains-mono',
  weight: '100 800',
})

/**
 * IBM Plex Sans carries the long-form body copy where a monospace face would
 * hurt readability. The file is variable as well, with a weight axis from 100
 * to 700. The range starts at 400 because the page offers nothing lighter: a
 * lighter request keeps drawing regular, not a thin weight no design chose.
 */
const ibmPlexSans = localFont({
  display: 'swap',
  src: './fonts/ibm-plex-sans/latin.woff2',
  variable: '--font-ibm-plex-sans',
  weight: '400 700',
})

/**
 * Set the theme class before the first paint so keyboard users and dark-mode
 * visitors never see a flash of the wrong theme. The logic mirrors ThemeToggle:
 * an explicit stored choice wins, otherwise fall back to the OS preference.
 */
const themeInitializationScript = `(function () {
  try {
    var storedTheme = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark;
    if (shouldUseDark) {
      document.documentElement.classList.add('dark');
    }
  } catch (error) {}
})();`

export const metadata: Metadata = siteMetadata

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
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
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
        <StructuredData />
      </head>
      <body className="bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 antialiased">
        <ClientOnly>
          <GlowCursor />
          <ThemeToggle />
        </ClientOnly>
        {children}
      </body>
    </html>
  )
}
