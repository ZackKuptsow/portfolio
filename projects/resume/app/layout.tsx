import './globals.css'

import GlowCursor from '@/components/GlowCursor'
import type { Metadata } from 'next'
import ThemeToggle from '@/components/ThemeToggle'

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
      <body className="bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300 antialiased">
        <GlowCursor />
        <ThemeToggle />
        {children}
      </body>
    </html>
  )
}
