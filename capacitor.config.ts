import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.replock.app',
  appName: 'RepLock',
  webDir: 'dist',
  // iOS: Apple IAP only — exclude Stripe native SDK (fixes StripeCore Swift compile errors in Xcode)
  ios: {
    includePlugins: ['@capacitor/splash-screen', '@capacitor/status-bar'],
  },
  android: {
    includePlugins: [
      '@capacitor-community/stripe',
      '@capacitor/splash-screen',
      '@capacitor/status-bar',
    ],
  },
  server: {
    // http allows the WebView to call the dev API at http://10.0.2.2:3001 (Android emulator)
    androidScheme: 'http',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A0A0B',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0A0B',
    },
  },
}

export default config
