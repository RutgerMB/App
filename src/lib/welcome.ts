const WELCOME_KEY = 'replock-welcome-done'

export function hasCompletedWelcome(): boolean {
  try {
    return localStorage.getItem(WELCOME_KEY) === '1'
  } catch {
    return false
  }
}

export function markWelcomeComplete(): void {
  try {
    localStorage.setItem(WELCOME_KEY, '1')
  } catch {
    /* private mode */
  }
}
