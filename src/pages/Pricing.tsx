import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Check, Sparkles, Grid3X3, BarChart3, Shield, Sliders, X, Star, Dumbbell,
} from 'lucide-react'
import { MotionButton } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { createCheckoutSession, formatPrice } from '@/lib/utils'
import { shouldUseNativeStripeCheckout, presentNativeProCheckout } from '@/lib/stripe'
import { useAuthStore } from '@/store/auth'
import { useToast } from '@/components/ui/Toast'
import { useStore } from '@/store'
import { PRO_PRICE_MONTHLY, TRIAL_APP_LIMIT } from '@/types'
import {
  getTrialDaysRemaining,
  getTrialHoursRemaining,
  getTrialStatus,
} from '@/lib/trial'
import { useTranslation } from '@/i18n/context'

export function PricingPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { profile, setProStatus } = useStore()
  const authUser = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)

  const trialStatus = getTrialStatus(profile)
  const daysLeft = getTrialDaysRemaining(profile.createdAt)
  const hoursLeft = getTrialHoursRemaining(profile.createdAt)
  const isUrgent = trialStatus === 'trial' && daysLeft <= 2
  const isExpired = trialStatus === 'expired'

  const features = [
    { icon: Grid3X3, titleKey: 'pricing.feature1Title', descKey: 'pricing.feature1Desc' },
    { icon: Dumbbell, titleKey: 'pricing.feature5Title', descKey: 'pricing.feature5Desc' },
    { icon: Sliders, titleKey: 'pricing.feature2Title', descKey: 'pricing.feature2Desc' },
    { icon: Shield, titleKey: 'pricing.feature3Title', descKey: 'pricing.feature3Desc' },
    { icon: BarChart3, titleKey: 'pricing.feature4Title', descKey: 'pricing.feature4Desc' },
  ]

  const trialTimeLeft =
    daysLeft > 0
      ? `${daysLeft} ${t('common.days')}`
      : `${hoursLeft} hours`

  const handleSubscribe = async () => {
    if (profile.isPro) {
      toast(t('pricing.alreadyPro'), 'info')
      return
    }

    setLoading(true)
    try {
      if (shouldUseNativeStripeCheckout()) {
        const result = await presentNativeProCheckout(
          authUser?.email ?? profile.email,
          profile.stripeCustomerId
        )
        setProStatus(true, result.customerId, result.subscriptionId, 'active')
        toast(t('pricing.onPro'), 'success')
        navigate('/success?native=1', { replace: true })
        return
      }

      const url = await createCheckoutSession('pro_monthly')
      window.location.href = url
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Checkout failed', 'error')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-surface-0 noise flex flex-col safe-top safe-bottom overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-violet-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-5 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors"
        >
          <X size={22} />
        </button>
        <Badge variant="pro">{t('common.pro')}</Badge>
        <div className="w-10" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6 py-6 max-w-md mx-auto w-full pb-8">
        {/* Trial status banner */}
        {!profile.isPro && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl border text-center ${
              isExpired
                ? 'bg-amber-500/10 border-amber-500/25'
                : isUrgent
                  ? 'bg-orange-500/10 border-orange-500/25'
                  : 'bg-indigo-500/10 border-indigo-500/20'
            }`}
          >
            {isExpired ? (
              <>
                <p className="text-sm font-semibold text-amber-300">{t('pricing.trialEnded')}</p>
                <p className="text-xs text-white/45 mt-1">
                  {t('pricing.trialEndedDesc')}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-indigo-300">
                  {t('pricing.trialLeft', { time: trialTimeLeft })}
                </p>
                <p className="text-xs text-white/45 mt-1">
                  {t('pricing.trialFullAccess', { count: TRIAL_APP_LIMIT })}
                </p>
              </>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {t('pricing.title')}
          </h1>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs mx-auto">
            {t('pricing.subtitle')}
          </p>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-1 mb-6"
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
          ))}
          <span className="text-xs text-white/40 ml-2">{t('pricing.socialProof')}</span>
        </motion.div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-3xl bg-surface-2 border border-indigo-500/30 gradient-border mb-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500/20 rounded-bl-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">{t('pricing.mostPopular')}</span>
          </div>

          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-bold">{formatPrice(PRO_PRICE_MONTHLY)}</span>
            <span className="text-white/40 text-sm">{t('pricing.perMonth')}</span>
          </div>
          <p className="text-xs text-white/35 mb-6">{t('pricing.lessThanCoffee')}</p>

          <div className="space-y-4">
            {features.map((f, i) => (
              <motion.div
                key={f.titleKey}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <f.icon size={16} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/85">{t(f.titleKey)}</p>
                  <p className="text-xs text-white/40 mt-0.5">{t(f.descKey)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Free vs Pro comparison */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mb-8 text-sm"
        >
          <div className="p-4 rounded-2xl bg-surface-2 border border-border">
            <p className="font-semibold mb-1 text-white/50">{t('pricing.freePlan')}</p>
            <p className="text-[10px] text-white/30 mb-3">{t('pricing.afterTrial')}</p>
            <ul className="space-y-2 text-white/40 text-xs">
              <li className="flex items-center gap-1.5"><Check size={12} /> {t('pricing.freeApp')}</li>
              <li className="flex items-center gap-1.5"><Check size={12} /> {t('pricing.mediumDifficulty')}</li>
              <li className="flex items-center gap-1.5"><Check size={12} /> {t('pricing.basicTracking')}</li>
            </ul>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/25">
            <p className="font-semibold mb-1 text-indigo-300">{t('pricing.proPlan')}</p>
            <p className="text-[10px] text-indigo-400/60 mb-3">{t('pricing.everything')}</p>
            <ul className="space-y-2 text-white/60 text-xs">
              <li className="flex items-center gap-1.5"><Check size={12} className="text-indigo-400" /> {t('pricing.unlimitedApps')}</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-indigo-400" /> {t('pricing.customLimits')}</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-indigo-400" /> {t('pricing.streakProtection')}</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-indigo-400" /> {t('pricing.difficultyModes')}</li>
              <li className="flex items-center gap-1.5"><Check size={12} className="text-indigo-400" /> {t('pricing.deepAnalytics')}</li>
            </ul>
          </div>
        </motion.div>

        {/* Value prop - no shortcuts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="p-4 rounded-2xl bg-surface-2/50 border border-border mb-8"
        >
          <p className="text-xs text-white/50 leading-relaxed text-center">
            {t('pricing.noShortcuts')}
            <span className="text-white/70 font-medium">{t('pricing.noShortcutsBold')}</span>
          </p>
        </motion.div>

        <div className="space-y-3">
          {profile.isPro ? (
            <div className="text-center p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <Check size={24} className="mx-auto text-emerald-400 mb-2" />
              <p className="font-semibold text-emerald-300">{t('pricing.onPro')}</p>
              <p className="text-xs text-white/40 mt-1">{t('pricing.onProDesc')}</p>
            </div>
          ) : (
            <>
              <MotionButton fullWidth size="xl" onClick={handleSubscribe} loading={loading}>
                {isExpired ? t('pricing.upgrade') : isUrgent ? t('pricing.keepAccess') : t('pricing.subscribe')}
              </MotionButton>
              {!isExpired && (
                <p className="text-center text-xs text-white/30">
                  {t('pricing.trialNote')}
                </p>
              )}
              <p className="text-center text-xs text-white/20">
                {t('pricing.testMode')}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
