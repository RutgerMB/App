import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { MotionCard } from '@/components/ui/Card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon?: LucideIcon
  iconClassName?: string
  value: ReactNode
  label: string
  onClick?: () => void
  valueClassName?: string
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-3 gap-3', className)}>{children}</div>
}

export function StatCard({ icon: Icon, iconClassName, value, label, onClick, valueClassName }: StatCardProps) {
  const card = (
    <MotionCard hover={!!onClick} className="p-3.5 text-center h-full">
      {Icon && <Icon size={15} className={cn('mx-auto mb-1.5', iconClassName)} />}
      <p className={cn('text-xl font-bold leading-none tabular-nums', valueClassName)}>{value}</p>
      <p className="text-[10px] text-white/40 uppercase tracking-wider mt-1.5">{label}</p>
    </MotionCard>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="text-left w-full">
        {card}
      </button>
    )
  }

  return card
}
