import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { useStore } from '@/store'
import { OnboardingPage } from '@/pages/Onboarding'
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const onboardingComplete = useStore((s) => s.profile.onboardingComplete)
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cancel" element={<CancelPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exercise"
          element={
            <ProtectedRoute>
              <ExercisePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exercise/category/:category"
          element={
            <ProtectedRoute>
              <ExerciseCategoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <ExerciseSessionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exercise/workout"
          element={
            <ProtectedRoute>
              <WorkoutSessionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/apps"
          element={
            <ProtectedRoute>
              <AppsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activity"
          element={
            <ProtectedRoute>
              <ActivityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  )
}
