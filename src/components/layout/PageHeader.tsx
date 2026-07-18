import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
  large?: boolean
  /** Exercise-style centered brand header */
  centered?: boolean
  brand?: boolean
}

export function PageHeader({
  title,
  subtitle,
  action,
  className,
  large,
  centered,
  brand = true,
}: PageHeaderProps) {
  if (centered) {
    return (
      <header className={cn('relative text-center pt-3 pb-1', className)}>
        {action && (
          <div className="absolute right-0 top-3 z-10">{action}</div>
        )}
        <div className="relative">
          {brand && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/70 mb-2">
              RepLock
            </p>
          )}
          <h1
            className={cn(
              'font-bold tracking-tight leading-none',
              large ? 'text-[2.25rem]' : 'text-[2rem]'
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/45 text-sm mt-2.5 max-w-[18rem] mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </header>
    )
  }

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

export function SectionLabel({
  children,
  className,
  icon,
}: {
  children: ReactNode
  className?: string
  icon?: ReactNode
}) {
  return (
    <div className={cn('flex items-center justify-center gap-2 mb-4', className)}>
      {icon}
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
        {children}
      </h2>
    </div>
  )
}
