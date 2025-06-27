'use client'

import { ReactNode } from 'react'

type CardProps = {
  className?: string
  description: string
  href?: string
  icon?: ReactNode
  subtitle?: string
  title: string
}

export default function Card({
  className = '',
  description,
  href,
  icon,
  subtitle,
  title,
}: CardProps) {
  const Wrapper = href ? 'a' : 'div'

  return (
    <Wrapper
      href={href}
      className={`group relative rounded-xl border 
        border-[rgba(0,0,0,0.08)] dark:border-white/10 
        bg-[rgba(0,0,0,0.02)] dark:bg-white/5 
        shadow-sm dark:shadow-md
        p-6 transition-all duration-300 ease-in-out 
        hover:scale-[1.015] hover:border-emerald-500/40 
        hover:bg-[rgba(0,255,0,0.02)] dark:hover:bg-white/10
        ${href ? 'cursor-pointer' : ''} ${className}`}
    >
      {icon && (
        <div className="absolute top-4 right-4 text-emerald-500 dark:text-emerald-400">{icon}</div>
      )}

      <h3 className="text-lg font-medium transition-colors group-hover:text-emerald-500 dark:group-hover:text-emerald-400 text-[color:var(--foreground)]">
        {title}
      </h3>

      {subtitle && (
        <h5 className="mt-1 font-medium text-[color:var(--foreground)]/80">{subtitle}</h5>
      )}

      <p className="mt-2 text-sm leading-relaxed text-[color:var(--foreground)]/60">
        {description}
      </p>
    </Wrapper>
  )
}
