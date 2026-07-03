import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { MotionButton } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuthStore } from '@/store/auth'
import { useStore } from '@/store'
import { useToast } from '@/components/ui/Toast'
import { useTranslation } from '@/i18n/context'

export function LoginPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="min-h-dvh bg-surface-0 noise flex flex-col px-6 py-10 safe-top safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-bold">
            R
          </div>
          <h1 className="text-3xl font-bold mb-2">{t('auth.loginTitle')}</h1>
          <p className="text-white/45 text-lg">{t('auth.loginSubtitle')}</p>
        </div>

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
            className="h-14 text-base"
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
            className="h-14 text-base"
          />
          <MotionButton fullWidth size="xl" type="submit" loading={loading} className="mt-6 h-14 text-lg">
            {t('auth.signIn')}
            <ArrowRight size={20} />
          </MotionButton>
        </form>

        <p className="text-center text-sm text-white/40 mt-8">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-indigo-400 font-medium hover:text-indigo-300">
            {t('auth.createAccount')}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { t } = useTranslation()
  const register = useAuthStore((s) => s.register)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      toast(t('auth.accountCreated'), 'success')
      navigate('/onboarding', { replace: true })
    } catch (err) {
      toast(err instanceof Error ? err.message : t('auth.registerFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-surface-0 noise flex flex-col px-6 py-10 safe-top safe-bottom overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-6"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('auth.registerTitle')}</h1>
          <p className="text-white/45 text-lg">{t('auth.registerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="register-name"
            label={t('auth.displayName')}
            placeholder={t('onboarding.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            className="h-14 text-base"
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
            className="h-14 text-base"
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
            className="h-14 text-base"
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
            className="h-14 text-base"
          />
          <MotionButton fullWidth size="xl" type="submit" loading={loading} className="mt-6 h-14 text-lg">
            {t('auth.createAccount')}
            <ArrowRight size={20} />
          </MotionButton>
        </form>

        <p className="text-center text-sm text-white/40 mt-8">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="text-indigo-400 font-medium hover:text-indigo-300">
            {t('auth.signIn')}
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
