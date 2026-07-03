import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from '@/i18n/context'
import { initStripe } from '@/lib/stripe'
import App from './App'
import './index.css'

initStripe().catch((err) => {
  console.warn('Stripe init skipped:', err)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <App />
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
)
