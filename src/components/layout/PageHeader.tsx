import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
  large?: boolean
}

export function PageHeader({ title, subtitle, action, className, large }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div className="flex-1 min-w-0">
        <h1
          className={cn(
            'font-bold tracking-tight leading-tight',
            large ? 'text-3xl sm:text-4xl' : 'text-2xl'
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/45 text-sm mt-1 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
