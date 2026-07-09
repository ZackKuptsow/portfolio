import './globals.css'

import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'

import ClientOnly from '@/components/ClientOnly'
import GlowCursor from '@/components/GlowCursor'
import ThemeToggle from '@/components/ThemeToggle'

import type { Metadata, Viewport } from 'next'

/**
 * JetBrains Mono powers every terminal surface: headings, labels, and command
 * prompts. It is a variable font, so next/font pulls the full weight range and
 * exposes it through the `--font-jetbrains-mono` CSS variable.
 */
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

/**
 * IBM Plex Sans carries the long-form body copy where a monospace face would
 * hurt readability. It is a static font, so the required weights are listed
 * explicitly.
 */
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ibm-plex-sans',
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

const siteUrl = 'https://kups.me'
const siteDescription =
  'Zack Kuptsow — full stack software engineer with a security background, building reliable, maintainable systems.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Zack Kuptsow — Full Stack Software Engineer',
  description: siteDescription,
  openGraph: {
    title: 'Zack Kuptsow — Full Stack Software Engineer',
    description: siteDescription,
    url: siteUrl,
    siteName: 'Zack Kuptsow',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Zack Kuptsow — Full Stack Software Engineer',
    description: siteDescription,
  },
}

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
