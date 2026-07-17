export function mapAuthError(err: unknown): Error {
  if (err instanceof Error && !('code' in err)) {
    return err
  }

  const code = (err as { code?: string })?.code ?? ''

  switch (code) {
    case 'auth/email-already-in-use':
      return new Error('An account with this email already exists')
    case 'auth/invalid-email':
      return new Error('Please enter a valid email address')
    case 'auth/missing-email':
      return new Error('Please enter your email address')
    case 'auth/weak-password':
      return new Error('Password must be at least 8 characters')
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return new Error('Invalid email or password')
    case 'auth/too-many-requests':
      return new Error('Too many attempts. Please try again later.')
    case 'auth/network-request-failed':
      return new Error('Network error. Check your connection and try again.')
    case 'auth/operation-not-allowed':
      return new Error('This sign-in method is not enabled. Please contact support.')
    default:
      if (err instanceof Error) return err
      return new Error('Something went wrong. Please try again.')
  }
}
