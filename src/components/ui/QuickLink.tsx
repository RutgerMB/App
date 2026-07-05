import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { MotionCard } from '@/components/ui/Card'

interface QuickLinkProps {
  icon: ReactNode
  label: string
  onClick: () => void
}

export function QuickLink({ icon, label, onClick }: QuickLinkProps) {
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <MotionCard
        hover
        className="flex items-center justify-between gap-3 py-3.5 px-4"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-white/75">
          {icon}
          {label}
        </span>
        <ChevronRight size={16} className="text-white/25 shrink-0" />
      </MotionCard>
    </button>
  )
}
