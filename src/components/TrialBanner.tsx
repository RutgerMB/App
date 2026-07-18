import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, Clock, AlertTriangle } from 'lucide-react'
import { useStore } from '@/store'
import { getTrialDaysRemaining, getTrialHoursRemaining, getTrialStatus } from '@/lib/trial'
import { TRIAL_DAYS } from '@/types'
import { useTranslation } from '@/i18n/context'
import { openUpgradeOrFallback } from '@/lib/replock-revenuecat-native'

interface TrialBannerProps {
  compact?: boolean
}

export function TrialBanner({ compact }: TrialBannerProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const profile = useStore((s) => s.profile)
  const status = getTrialStatus(profile)

  if (status === 'pro') return null

  const daysLeft = getTrialDaysRemaining(profile.createdAt)
  const hoursLeft = getTrialHoursRemaining(profile.createdAt)
  const isUrgent = status === 'trial' && daysLeft <= 2
  const isExpired = status === 'expired'

  const timeLabel =
    daysLeft > 0
      ? t('trial.daysLeft', { count: daysLeft })
      : hoursLeft > 0
        ? t('trial.hoursLeft', { count: hoursLeft })
        : t('trial.trialEnded')

  const openUpgrade = () => {
    void openUpgradeOrFallback(() => navigate('/pricing'))
  }

  if (compact) {
    return (
      <button
        onClick={openUpgrade}
        className={`w-full p-3 rounded-xl border flex items-center gap-3 text-left transition-colors ${
          isExpired
            ? 'bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/15'
            : isUrgent
              ? 'bg-orange-500/10 border-orange-500/25 hover:bg-orange-500/15'
              : 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15'
        }`}
      >
        {isExpired ? (
          <AlertTriangle size={16} className="text-amber-400 shrink-0" />
        ) : (
          <Clock size={16} className={`shrink-0 ${isUrgent ? 'text-orange-400' : 'text-emerald-400'}`} />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {isExpired
              ? t('trial.upgradeKeepApps')
              : `${t('trial.fullAccess')} · ${timeLabel}`}
          </p>
        </div>
        <Sparkles size={14} className="text-emerald-400 shrink-0" />
      </button>
    )
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={openUpgrade}
      className={`w-full mb-6 p-5 rounded-2xl border text-left transition-all ${
        isExpired
          ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/25'
          : isUrgent
            ? 'bg-gradient-to-br from-orange-500/10 to-red-500/5 border-orange-500/25'
            : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isExpired ? 'bg-amber-500/20' : isUrgent ? 'bg-orange-500/20' : 'bg-emerald-500/20'
          }`}
        >
          {isExpired ? (
            <AlertTriangle size={18} className="text-amber-400" />
          ) : (
            <Clock size={18} className={isUrgent ? 'text-orange-400' : 'text-emerald-400'} />
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">
            {isExpired
              ? t('trial.trialEnded')
              : isUrgent
                ? t('trial.onlyLeft', { time: timeLabel })
                : `${t('trial.trialFeatures', { days: TRIAL_DAYS })} · ${timeLabel}`}
          </p>
          <p className="text-xs text-white/45 mt-1 leading-relaxed">
            {isExpired ? t('trial.endedDesc') : t('trial.activeDesc')}
          </p>
          <span className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-emerald-300">
            <Sparkles size={12} />
            {isExpired ? t('trial.upgradePro') : t('trial.viewPro')}
          </span>
        </div>
      </div>
    </motion.button>
  )
}
