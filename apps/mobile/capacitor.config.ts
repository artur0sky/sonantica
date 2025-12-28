import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sonantica.app',
  appName: 'Sonántica',
  webDir: '../web/dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a',
    },
    Filesystem: {
      // Request permissions on app start for better UX
      // Android: READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE
      // iOS: Photo Library access
    },
  },
};

export default config;
