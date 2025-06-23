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
      className={`group relative rounded-xl border border-white/10 bg-white/5 p-6 transition-all duration-300 ease-in-out hover:scale-[1.015] hover:border-emerald-500/40 hover:bg-white/10 ${href ? 'cursor-pointer' : ''} ${className}`}
    >
      {icon && <div className="mb-4 text-emerald-400">{icon}</div>}
      <h3 className="text-lg font-medium text-white group-hover:text-emerald-400 transition-colors">
        {title}
      </h3>
      <h5 className="font-medium text-white/60">{subtitle}</h5>
      <p className="mt-2 text-sm text-white/40 leading-relaxed">{description}</p>
    </Wrapper>
  )
}
