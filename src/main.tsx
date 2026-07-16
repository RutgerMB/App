import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n/context'
import { AuthProvider } from '@/components/AuthProvider'
import { initBlockingSync } from '@/lib/blocking-sync'
import { initMobilePurchases } from '@/lib/mobile-purchases'
import { syncEntitlementAfterPurchase } from '@/lib/entitlement'
import { subscribeNativeCustomerInfoUpdates } from '@/lib/replock-revenuecat-native'
import App from './App'
import './index.css'

initMobilePurchases().catch(() => {})
initBlockingSync()

void subscribeNativeCustomerInfoUpdates((info) => {
  if (info.isPro) {
    void syncEntitlementAfterPurchase().catch(() => {})
  }
})

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
