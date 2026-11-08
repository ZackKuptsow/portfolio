import { BrandMark } from '@/components/BrandMark'
import ThemeToggle from '@/components/ThemeToggle'

import type { Metadata } from 'next'

const MESSAGE = 'This page could not be found.'
const STATUS = '404'

export const metadata: Metadata = {
  title: `${STATUS}: ${MESSAGE}`,
}

/**
 * The page CloudFront answers a missing path with. The words are Next's own default, which is
 * what this page has always said. It exists as a file only to carry the theme switch, which on
 * the other pages without a terminal comes from `SmsProgramPage`.
 */
export default function NotFound() {
  return (
    <div className="custom-gradient flex min-h-screen flex-col items-center justify-center gap-2 font-mono">
      <ThemeToggle />
      <BrandMark className="h-12 w-12" />
      <h1 className="text-2xl font-bold text-primary">{STATUS}</h1>
      <p className="text-sm text-muted-foreground">{MESSAGE}</p>
    </div>
  )
}
