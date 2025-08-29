import './globals.css'

import ClientOnly from '@/components/ClientOnly'
import GlowCursor from '@/components/GlowCursor'
import ThemeToggle from '@/components/ThemeToggle'

import type { Metadata } from 'next'

export const metadata: Metadata =  {
  title: 'Zack Kuptsow',
  description: 'Zack Kuptsow: Full Stack Software Engineer portfolio site',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/Zachary_Kuptsow_Resume.pdf" as="fetch" crossOrigin="anonymous" />
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
