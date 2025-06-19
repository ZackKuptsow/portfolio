import './globals.css'

import { Geist, Geist_Mono } from 'next/font/google'

import GlowCursor from '@/components/GlowCursor'

import type { Metadata } from 'next'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GlowCursor />
        {children}
      </body>
    </html>
  )
}
