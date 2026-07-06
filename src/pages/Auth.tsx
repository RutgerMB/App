import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import {
  IntroShell,
  IntroProgressBar,
  IntroPrimaryButton,
  IntroAuthButton,
} from '@/components/onboarding/IntroShell'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth'
import { useStore } from '@/store'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/i18n/context'
import { isDevLoginEnabled, validateDevLogin } from '@/lib/dev-auth'
import { openPrivacy, openTerms } from '@/lib/legal'

const REGISTER_DRAFT_KEY = 'replock-register-draft'

function loadRegisterDraft(): { name: string; email: string; acceptedTerms: boolean } | null {
  try {
    const raw = sessionStorage.getItem(REGISTER_DRAFT_KEY)
    if (!raw) return null
    const draft = JSON.parse(raw) as { name?: string; email?: string; acceptedTerms?: boolean }
    return {
      name: draft.name ?? '',
      email: draft.email ?? '',
      acceptedTerms: Boolean(draft.acceptedTerms),
    }
  } catch {
    return null
  }
}

function saveRegisterDraft(draft: { name: string; email: string; acceptedTerms: boolean }) {
  sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draft))
}

function clearRegisterDraft() {
  sessionStorage.removeItem(REGISTER_DRAFT_KEY)
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-surface-2 border border-border p-5 sm:p-6 shadow-xl">
      {children}
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const login = useAuthStore((s) => s.login)
  const devLogin = useAuthStore((s) => s.devLogin)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showDevLogin, setShowDevLogin] = useState(false)
  const [devCode, setDevCode] = useState('')
  const [devPassword, setDevPassword] = useState('')
  const showDev = isDevLoginEnabled()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email.trim(), password)
      const onboardingComplete = useStore.getState().profile.onboardingComplete
      toast(t('auth.welcomeBack'), 'success')
      navigate(onboardingComplete ? '/' : '/onboarding', { replace: true })
    } catch (err) {
      toast(err instanceof Error ? err.message : t('auth.loginFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateDevLogin(devCode, devPassword)) {
      toast(t('auth.devLoginFailed'), 'error')
      return
    }
    devLogin()
    toast(t('auth.devLoginSuccess'), 'success')
    navigate('/', { replace: true })
  }

  return (
    <IntroShell variant="auth">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <IntroProgressBar step={1} total={5} />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{t('auth.loginTitle')}</h1>
          <p className="text-white/50 mt-2 text-base">{t('auth.loginSubtitle')}</p>
        </motion.div>

        {!showForm ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <IntroAuthButton icon={<Mail size={20} />} onClick={() => setShowForm(true)}>
              {t('intro.continueEmail')}
            </IntroAuthButton>
          </motion.div>
        ) : (
          <AuthCard>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="login-email"
                type="email"
                label={t('auth.email')}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="h-12 text-base"
              />
              <Input
                id="login-password"
                type="password"
                label={t('auth.password')}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="h-12 text-base"
              />
              <IntroPrimaryButton type="submit" disabled={loading}>
                {loading ? '…' : t('auth.signIn')}
              </IntroPrimaryButton>
            </form>
          </AuthCard>
        )}

        <p className="text-center text-sm text-white/50 mt-8">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-indigo-400 font-semibold hover:underline">
            {t('auth.createAccount')}
          </Link>
        </p>

        {showDev && (
          <div className="mt-8 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setShowDevLogin((v) => !v)}
              className="w-full text-center text-sm text-amber-400 font-medium"
            >
              {t('auth.devLogin')}
            </button>
            {showDevLogin && (
              <form onSubmit={handleDevLogin} className="mt-4 space-y-3">
                <Input id="dev-code" label={t('auth.devCode')} value={devCode} onChange={(e) => setDevCode(e.target.value)} className="h-11" />
                <Input id="dev-password" type="password" label={t('auth.devPassword')} value={devPassword} onChange={(e) => setDevPassword(e.target.value)} className="h-11" />
                <IntroPrimaryButton type="submit">{t('auth.devLoginSubmit')}</IntroPrimaryButton>
              </form>
            )}
          </div>
        )}
      </div>
    </IntroShell>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const register = useAuthStore((s) => s.register)
  const draft = loadRegisterDraft()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState(draft?.name ?? '')
  const [email, setEmail] = useState(draft?.email ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(draft?.acceptedTerms ?? false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    saveRegisterDraft({ name, email, acceptedTerms })
  }, [name, email, acceptedTerms])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptedTerms) {
      toast(t('auth.termsRequired'), 'error')
      return
    }
    if (password !== confirm) {
      toast(t('auth.passwordMismatch'), 'error')
      return
    }
    if (password.length < 8) {
      toast(t('auth.passwordTooShort'), 'error')
      return
    }
    setLoading(true)
    try {
      await register(email.trim(), password, name.trim())
      clearRegisterDraft()
      toast(t('auth.accountCreated'), 'success')
      navigate('/onboarding', { replace: true })
    } catch (err) {
      toast(err instanceof Error ? err.message : t('auth.registerFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <IntroShell variant="auth">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <button
          type="button"
          onClick={() => (showForm ? setShowForm(false) : navigate('/welcome'))}
          className="text-sm text-white/50 mb-4 self-start hover:text-white/80"
        >
          ← {t('common.back')}
        </button>

        <IntroProgressBar step={1} total={5} />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-3xl sm:text-[2rem] font-bold leading-tight">
            {t('intro.getStartedWith')}{' '}
            <span className="gradient-text">RepLock</span>
          </h1>
        </motion.div>

        {!showForm ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <IntroAuthButton icon={<Mail size={20} />} onClick={() => setShowForm(true)}>
              {t('intro.continueEmail')}
            </IntroAuthButton>
            <p className="text-center text-sm text-white/50 pt-4">
              {t('auth.haveAccount')}{' '}
              <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
                {t('auth.signIn')}
              </Link>
            </p>
          </motion.div>
        ) : (
          <AuthCard>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="register-name"
                label={t('auth.displayName')}
                placeholder={t('onboarding.namePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                className="h-12 text-base"
              />
              <Input
                id="register-email"
                type="email"
                label={t('auth.email')}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="h-12 text-base"
              />
              <Input
                id="register-password"
                type="password"
                label={t('auth.password')}
                placeholder={t('auth.passwordHint')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                className="h-12 text-base"
              />
              <Input
                id="register-confirm"
                type="password"
                label={t('auth.confirmPassword')}
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                className="h-12 text-base"
              />

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 rounded border-border text-indigo-500 focus:ring-indigo-500/40"
                />
                <span className="text-xs text-white/50 leading-relaxed">
                  {t('auth.agreeTerms')}{' '}
                  <button type="button" onClick={openTerms} className="text-indigo-400 font-medium">
                    {t('legal.termsTitle')}
                  </button>
                  {' · '}
                  <button type="button" onClick={openPrivacy} className="text-indigo-400 font-medium">
                    {t('legal.privacyTitle')}
                  </button>
                </span>
              </label>

              <IntroPrimaryButton type="submit" disabled={loading}>
                {loading ? '…' : t('auth.createAccount')}
              </IntroPrimaryButton>
            </form>
          </AuthCard>
        )}

        {!showForm && (
          <p className="text-center text-[11px] text-white/40 leading-relaxed mt-8 px-2">
            {t('intro.legalPrefix')}{' '}
            <button type="button" onClick={openPrivacy} className="underline">
              {t('legal.privacyTitle')}
            </button>{' '}
            {t('intro.legalAnd')}{' '}
            <button type="button" onClick={openTerms} className="underline">
              {t('legal.termsTitle')}
            </button>
          </p>
        )}
      </div>
    </IntroShell>
  )
}
