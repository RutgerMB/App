import type { ReactNode, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type HeaderChipVariant = 'neutral' | 'accent'

interface HeaderChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: HeaderChipVariant
  as?: 'button' | 'span'
}

const base =
  'inline-flex items-center justify-center gap-1.5 h-10 w-[8.75rem] px-2 rounded-xl text-xs font-semibold border transition-all duration-200'

const variants: Record<HeaderChipVariant, string> = {
  neutral:
    'bg-white/[0.06] border-white/10 text-white/80 hover:bg-white/[0.1] active:scale-[0.98] cursor-pointer',
  accent:
    'bg-indigo-500/10 border-indigo-500/25 text-indigo-300 hover:bg-indigo-500/18 active:scale-[0.98] cursor-pointer',
}

export function HeaderChip({
  children,
  variant = 'neutral',
  as,
  className,
  type = 'button',
  ...props
}: HeaderChipProps) {
  const isInteractive = as === 'button' || props.onClick != null

  if (isInteractive) {
    return (
      <button type={type} className={cn(base, variants[variant], className)} {...props}>
        {children}
      </button>
    )
  }

  return (
    <span className={cn(base, variants[variant], className)}>
      {children}
    </span>
  )
}
