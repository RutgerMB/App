import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.replock.app',
  appName: 'RepLock',
  webDir: 'dist',
  // iOS (Xcode 15.4): no npm Capacitor plugins — Capacitor 8 SPM plugins need Xcode 26+.
  // Splash uses LaunchScreen.storyboard; status bar uses Info.plist. Android keeps all plugins.
  ios: {
    includePlugins: ['@capgo/native-purchases'],
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
