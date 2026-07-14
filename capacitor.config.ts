import type { CapacitorConfig } from '@capacitor/cli'

/** Set when live-loading on a device: CAPACITOR_DEV_SERVER=http://192.168.x.x:5173 npx cap sync ios */
const devServerUrl = process.env.CAPACITOR_DEV_SERVER

const config: CapacitorConfig = {
  appId: 'com.replock.app',
  appName: 'RepLock',
  webDir: 'dist',
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
  server: devServerUrl
    ? {
        url: devServerUrl,
        cleartext: true,
      }
    : {
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
