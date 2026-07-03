import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'pro'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-white/5 text-white/60 border-white/10',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border-red-500/20',
  pro: 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-300 border-indigo-500/30',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
