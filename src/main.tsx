import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n/context'
import { AuthProvider } from '@/components/AuthProvider'
import { Capacitor } from '@capacitor/core'
import { initBlockingSync } from '@/lib/blocking-sync'
import App from './App'
import './index.css'

// Stripe is Android/web only — iOS uses Apple IAP (do not load Stripe native plugin)
if (Capacitor.getPlatform() !== 'ios') {
  import('@/lib/stripe').then(({ initStripe }) => {
    initStripe().catch((err) => {
      console.warn('Stripe init skipped:', err)
    })
  })
}

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
