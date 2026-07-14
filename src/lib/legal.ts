/** Legal & support URLs — override via env for production hosting. */
export const LEGAL = {
  privacyUrl:
    import.meta.env.VITE_PRIVACY_URL ||
    'https://rutgermb.github.io/App/legal/privacy.html',
  termsUrl:
    import.meta.env.VITE_TERMS_URL ||
    'https://rutgermb.github.io/App/legal/terms.html',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'RepLockIssue@outlook.com',
  supportUrl:
    import.meta.env.VITE_SUPPORT_URL ||
    'https://rutgermb.github.io/App/legal/support.html',
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
  if (LEGAL.supportUrl.startsWith('http')) {
    window.open(LEGAL.supportUrl, '_blank', 'noopener,noreferrer')
    return
  }
  window.open(`mailto:${LEGAL.supportEmail}`, '_blank')
}
