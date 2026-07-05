/** Legal & support URLs — override via env for production hosting. */
export const LEGAL = {
  privacyUrl: import.meta.env.VITE_PRIVACY_URL || '/privacy',
  termsUrl: import.meta.env.VITE_TERMS_URL || '/terms',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@replock.app',
  supportUrl: import.meta.env.VITE_SUPPORT_URL || 'https://replock.app/support',
} as const

export function openPrivacy() {
  window.open(LEGAL.privacyUrl, '_blank', 'noopener,noreferrer')
}

export function openTerms() {
  window.open(LEGAL.termsUrl, '_blank', 'noopener,noreferrer')
}

export function openSupport() {
  if (LEGAL.supportUrl.startsWith('mailto:')) {
    window.location.href = LEGAL.supportUrl
    return
  }
  window.open(`mailto:${LEGAL.supportEmail}`, '_blank')
}
