import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n/context'
import { AuthProvider } from '@/components/AuthProvider'
import { Capacitor } from '@capacitor/core'
import { initBlockingSync } from '@/lib/blocking-sync'
import { initMobilePurchases } from '@/lib/mobile-purchases'
import App from './App'
import './index.css'

// Stripe is dev/Android legacy only — mobile launch uses App Store / Play Store billing
if (
  Capacitor.getPlatform() === 'android' &&
  !import.meta.env.VITE_REVENUECAT_API_KEY_ANDROID
) {
  import('@/lib/stripe').then(({ initStripe }) => {
    initStripe().catch((err) => {
      console.warn('Stripe init skipped:', err)
    })
  })
}

initMobilePurchases().catch(() => {})
initBlockingSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
)
