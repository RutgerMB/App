import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { IntroShell, IntroDots, IntroPrimaryButton } from '@/components/onboarding/IntroShell'
import {
  BlockAppsIllustration,
  EarnWorkoutIllustration,
  ProgressIllustration,
} from '@/components/onboarding/IntroIllustrations'
import { markWelcomeComplete } from '@/lib/welcome'
import { useTranslation } from '@/i18n/context'
import { openPrivacy, openTerms } from '@/lib/legal'

const SLIDE_COUNT = 3

export function WelcomePage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [slide, setSlide] = useState(0)

  const slides = [
    {
      headline: t('intro.slide1Headline'),
      subtitle: t('intro.slide1Subtitle'),
      Illustration: BlockAppsIllustration,
    },
    {
      headline: t('intro.slide2Headline'),
      subtitle: t('intro.slide2Subtitle'),
      Illustration: EarnWorkoutIllustration,
    },
    {
      headline: t('intro.slide3Headline'),
      subtitle: t('intro.slide3Subtitle'),
      Illustration: ProgressIllustration,
    },
  ]

  const current = slides[slide]

  const handleBegin = () => {
    markWelcomeComplete()
    navigate('/get-started', { replace: true })
  }

  const handleNext = () => {
    if (slide < SLIDE_COUNT - 1) {
      setSlide((s) => s + 1)
      return
    }
    handleBegin()
  }

  return (
    <IntroShell
      variant="hero"
      footer={
        <div className="space-y-4">
          <IntroPrimaryButton onClick={handleNext}>
            {slide < SLIDE_COUNT - 1 ? t('common.continue') : t('intro.begin')}
          </IntroPrimaryButton>

          <p className="text-center text-sm text-white/90">
            {t('intro.haveAccount')}{' '}
            <Link
              to="/login"
              onClick={() => markWelcomeComplete()}
              className="font-semibold underline underline-offset-2 hover:text-white"
            >
              {t('auth.signIn')}
            </Link>
          </p>

          <p className="text-center text-[11px] text-white/55 leading-relaxed px-2">
            {t('intro.legalPrefix')}{' '}
            <button type="button" onClick={openPrivacy} className="underline underline-offset-1">
              {t('legal.privacyTitle')}
            </button>{' '}
            {t('intro.legalAnd')}{' '}
            <button type="button" onClick={openTerms} className="underline underline-offset-1">
              {t('legal.termsTitle')}
            </button>
          </p>
        </div>
      }
    >
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
            className="flex-1 flex flex-col"
          >
            <h1 className="text-[1.75rem] sm:text-[2rem] font-bold leading-tight text-center px-2 mt-4">
              {current.headline}
            </h1>

            <div className="flex-1 flex items-center justify-center py-6 min-h-[240px]">
              <current.Illustration />
            </div>

            <p className="text-center text-base sm:text-lg font-semibold text-white px-4 leading-snug">
              {current.subtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        <IntroDots count={SLIDE_COUNT} active={slide} />
      </div>
    </IntroShell>
  )
}
