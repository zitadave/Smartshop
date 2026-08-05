import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'et.smartshop.app',
  appName: 'Smart Shop',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
  },
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: true,
      spinnerColor: '#3b82f6',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
