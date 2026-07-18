import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { useStore } from '@/store'
import { useAuthStore } from '@/store/auth'
import { OnboardingPage } from '@/pages/Onboarding'
import { WelcomePage } from '@/pages/Welcome'
import { hasCompletedWelcome } from '@/lib/welcome'
import { AuthChoicePage, LoginPage, RegisterPage, ForgotPasswordPage } from '@/pages/Auth'
import { HomePage } from '@/pages/Home'
import { ExercisePage, ExerciseCategoryPage } from '@/pages/Exercise'
import { ExerciseSessionPage } from '@/pages/ExerciseSession'
import { WorkoutSessionPage } from '@/pages/WorkoutSession'
import { AppsPage } from '@/pages/Apps'
import { ActivityPage } from '@/pages/Activity'
import { SettingsPage } from '@/pages/Settings'
import { PricingPage } from '@/pages/Pricing'
import { SuccessPage } from '@/pages/Success'
import { CancelPage } from '@/pages/Cancel'
import { PrivacyPage, TermsPage } from '@/pages/Legal'
import { DataPrivacyPage } from '@/pages/DataPrivacy'
import { BlockerPermissionPrompt } from '@/components/BlockerPermissionPrompt'
import { TrialExpiryNotifier } from '@/components/TrialExpiryNotifier'
import { NotificationReminderSync } from '@/components/NotificationReminderSync'
import { ShieldHandoffSync } from '@/components/ShieldHandoffSync'
import { ScrollToTop } from '@/components/layout/ScrollToTop'

function AuthRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const onboardingComplete = useStore((s) => s.profile.onboardingComplete)
  if (!token) {
    if (!hasCompletedWelcome()) return <Navigate to="/welcome" replace />
    return <Navigate to="/login" replace />
  }
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function SignedInRoute({
  children,
  requireOnboarding = true,
}: {
  children: React.ReactNode
  requireOnboarding?: boolean
}) {
  const token = useAuthStore((s) => s.token)
  const onboardingComplete = useStore((s) => s.profile.onboardingComplete)
  if (!token) {
    if (!hasCompletedWelcome()) return <Navigate to="/welcome" replace />
    return <Navigate to="/login" replace />
  }
  if (requireOnboarding && !onboardingComplete) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const onboardingComplete = useStore((s) => s.profile.onboardingComplete)
  if (token) {
    return <Navigate to={onboardingComplete ? '/' : '/onboarding'} replace />
  }
  if (!hasCompletedWelcome()) {
    return <Navigate to="/welcome" replace />
  }
  return <>{children}</>
}

function WelcomeRoute() {
  const token = useAuthStore((s) => s.token)
  const onboardingComplete = useStore((s) => s.profile.onboardingComplete)
  if (token) {
    return <Navigate to={onboardingComplete ? '/' : '/onboarding'} replace />
  }
  if (hasCompletedWelcome()) {
    return <Navigate to="/get-started" replace />
  }
  return <WelcomePage />
}

function OnboardingRoute() {
  const token = useAuthStore((s) => s.token)
  const onboardingComplete = useStore((s) => s.profile.onboardingComplete)
  if (!token) {
    if (!hasCompletedWelcome()) return <Navigate to="/welcome" replace />
    return <Navigate to="/login" replace />
  }
  if (onboardingComplete) return <Navigate to="/" replace />
  return <OnboardingPage />
}

export default function App() {
  return (
    <ToastProvider>
      <TrialExpiryNotifier />
      <NotificationReminderSync />
      <ShieldHandoffSync />
      <ScrollToTop />
      <BlockerPermissionPrompt />
      <Routes>
        <Route path="/welcome" element={<WelcomeRoute />} />
        <Route path="/get-started" element={<GuestRoute><AuthChoicePage /></GuestRoute>} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/onboarding" element={<OnboardingRoute />} />
        <Route path="/pricing" element={<SignedInRoute requireOnboarding={false}><PricingPage /></SignedInRoute>} />
        <Route path="/success" element={<SignedInRoute requireOnboarding={false}><SuccessPage /></SignedInRoute>} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/cancel" element={<SignedInRoute requireOnboarding={false}><CancelPage /></SignedInRoute>} />
        <Route path="/" element={<AuthRoute><HomePage /></AuthRoute>} />
        <Route path="/exercise" element={<AuthRoute><ExercisePage /></AuthRoute>} />
        <Route path="/exercise/category/:category" element={<AuthRoute><ExerciseCategoryPage /></AuthRoute>} />
        <Route path="/exercise/session" element={<AuthRoute><ExerciseSessionPage /></AuthRoute>} />
        <Route path="/exercise/workout" element={<AuthRoute><WorkoutSessionPage /></AuthRoute>} />
        <Route path="/apps" element={<AuthRoute><AppsPage /></AuthRoute>} />
        <Route path="/activity" element={<AuthRoute><ActivityPage /></AuthRoute>} />
        <Route path="/settings" element={<AuthRoute><SettingsPage /></AuthRoute>} />
        <Route path="/settings/data-privacy" element={<AuthRoute><DataPrivacyPage /></AuthRoute>} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </ToastProvider>
  )
}
