import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight } from 'lucide-react'
import { useStore } from '@/store'
import { useTranslation } from '@/i18n/context'
import { cn } from '@/lib/utils'
import { openUpgradeOrFallback } from '@/lib/replock-revenuecat-native'

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
      onClick={() => {
        void openUpgradeOrFallback(() => navigate('/pricing'))
      }}
      className={cn(
        'w-full text-left rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/5',
        'hover:from-emerald-500/14 hover:to-teal-500/8 hover:border-emerald-500/30 transition-all duration-200',
        compact ? 'p-3.5 mb-0' : 'p-4 mb-6',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
          <Sparkles size={16} className="text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-200">{t(`proPromo.${variant}.title`)}</p>
          <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{t(`proPromo.${variant}.desc`)}</p>
          <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-emerald-300">
            {t('proPromo.cta')}
            <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </button>
  )
}
