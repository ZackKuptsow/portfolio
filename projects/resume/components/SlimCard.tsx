'use client'

import {ReactNode} from 'react'

type SlimCardProps = {
  className?: string
  list: string[]
  title: string
}

export default function SlimCard({
  className = '',
  list,
  title
}: SlimCardProps) {

  return (
    <div
    className={`group relative rounded-xl border 
        border-[rgba(0,0,0,0.08)] dark:border-white/10 
        bg-[rgba(0,0,0,0.02)] dark:bg-white/5 
        shadow-sm dark:shadow-md
        p-6 transition-all duration-300 ease-in-out 
        hover:scale-[1.015] hover:border-emerald-500/40 
        hover:bg-[rgba(0,255,0,0.02)] dark:hover:bg-white/10
       ${className}`}>
      <h2 className="mb-2 text-lg font-medium transition-colors group-hover:text-emerald-500 dark:group-hover:text-emerald-400 text-[color:var(--foreground)]">
        {title}
      </h2>
      <ul>
      {list.map((skill: string, index: number) => <li className="ml-4 list-disc" key={index}>{skill}</li>)}
      </ul>
    </div>

  )
}
