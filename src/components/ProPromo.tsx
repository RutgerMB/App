import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'
import { useTranslation } from '@/i18n/context'
import { cn } from '@/lib/utils'

export type ProPromoVariant = 'home' | 'exercise' | 'apps' | 'activity' | 'settings'

interface ProPromoProps {
  variant: ProPromoVariant
  className?: string
  compact?: boolean
}

export function ProPromo({ variant, className, compact }: ProPromoProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isPro = useStore((s) => s.profile.isPro)

  if (isPro) return null

  return (
    <button
      type="button"
      onClick={() => navigate('/pricing')}
      className={cn(
        'w-full text-left rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 hover:from-indigo-500/15 hover:to-violet-500/10 transition-all',
        compact ? 'p-3 mb-4' : 'p-4 mb-6',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-indigo-200">{t(`proPromo.${variant}.title`)}</p>
          <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{t(`proPromo.${variant}.desc`)}</p>
          <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-indigo-300">
            {t('proPromo.cta')}
            <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </button>
  )
}
