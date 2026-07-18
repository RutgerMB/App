import { motion } from 'framer-motion'
import { Shield, Smartphone, BarChart3, Check } from 'lucide-react'
import { useTranslation } from '@/i18n/context'
import { getScreenTimePlatform } from '@/lib/screen-time'
import { cn } from '@/lib/utils'

export function SetupIntroIllustration() {
  return (
    <div className="relative w-full max-w-[260px] mx-auto h-[210px] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-[140px] h-[210px] rounded-[2rem] bg-gradient-to-b from-surface-3 to-surface-2 border border-white/[0.1] shadow-2xl overflow-hidden"
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3.5 rounded-full bg-black/80" />
        <div className="absolute inset-3 top-7 rounded-[1.25rem] bg-gradient-to-br from-emerald-950 via-teal-950 to-surface-0 flex flex-col items-center justify-center gap-3 p-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Shield size={28} className="text-white" strokeWidth={1.75} />
          </div>
          <div className="w-full space-y-1.5">
            <div className="h-1.5 rounded-full bg-white/15 w-full" />
            <div className="h-1.5 rounded-full bg-white/10 w-4/5 mx-auto" />
            <div className="h-1.5 rounded-full bg-emerald-500/40 w-3/5 mx-auto" />
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-2 top-12 w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center backdrop-blur-sm"
      >
        <BarChart3 size={20} className="text-emerald-400" />
      </motion.div>

      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        className="absolute -left-1 bottom-16 w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center backdrop-blur-sm"
      >
        <Smartphone size={18} className="text-emerald-400" />
      </motion.div>
    </div>
  )
}

export function ScreenTimePermissionStep({
  platform,
  granted,
  loading,
  onRequest,
  onRefresh,
}: {
  platform: ReturnType<typeof getScreenTimePlatform>
  granted: boolean
  loading: boolean
  onRequest: () => void
  onRefresh: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-6">
        <BarChart3 size={32} className="text-emerald-400" />
      </div>

      {platform === 'android' && (
        <>
          <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-sm">
            {t('onboarding.screenTimePermissionAndroid')}
          </p>
          {granted ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3">
              <Check size={16} className="text-emerald-400" />
              <p className="text-sm text-emerald-400 font-medium">
                {t('onboarding.screenTimePermissionGranted')}
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={onRequest}
              className="w-full max-w-xs h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/35 text-emerald-200 font-semibold text-sm hover:bg-emerald-500/30 active:scale-[0.98] transition-all"
            >
              {t('onboarding.screenTimePermissionOpenSettings')}
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={onRefresh}
            className="mt-4 text-xs text-white/35 hover:text-white/55"
          >
            {loading ? t('common.loading') : t('onboarding.screenTimePermissionRefresh')}
          </button>
        </>
      )}

      {platform === 'ios' && (
        <>
          <p className="text-sm text-white/50 leading-relaxed mb-6 max-w-sm">
            {t('onboarding.screenTimePermissionIos')}
          </p>
          {granted ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3 mb-4">
              <Check size={16} className="text-emerald-400" />
              <p className="text-sm text-emerald-400 font-medium">{t('onboarding.screenTimeIosAuthorized')}</p>
            </div>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={onRequest}
              className={cn(
                'w-full max-w-xs h-12 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 touch-manipulation',
                'bg-emerald-500/20 border border-emerald-500/35 text-emerald-200 hover:bg-emerald-500/30'
              )}
            >
              {loading ? t('common.loading') : t('onboarding.screenTimePermissionIosAuthorize')}
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={onRefresh}
            className="mt-4 text-xs text-white/35 hover:text-white/55 touch-manipulation"
          >
            {loading ? t('common.loading') : t('onboarding.screenTimePermissionRefresh')}
          </button>
          <p className="text-xs text-white/30 mt-6 max-w-xs leading-relaxed">
            {t('onboarding.screenTimePermissionIosSkip')}
          </p>
        </>
      )}

      {platform === 'web' && (
        <p className="text-sm text-white/50 leading-relaxed max-w-sm">
          {t('onboarding.screenTimePermissionWeb')}
        </p>
      )}
    </div>
  )
}
