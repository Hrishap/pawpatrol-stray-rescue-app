import type { ExpoConfig } from 'expo/config';

// Dynamic config so Supabase/Mapbox credentials can come from environment
// variables (see .env.example) instead of being hardcoded. EXPO_PUBLIC_*
// vars are also inlined at build time for use via process.env in JS code;
// the values are mirrored into `extra` too so they're readable from
// Constants.expoConfig at runtime on every platform.
const config: ExpoConfig = {
  name: 'PawPatrol',
  slug: 'pawpatrol-stray-rescue-app',
  scheme: 'pawpatrol',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.pawpatrol.strayrescue',
  },
  android: {
    package: 'app.pawpatrol.strayrescue',
    adaptiveIcon: {
      backgroundColor: '#fbf6ea',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-splash-screen',
    'expo-image',
    'expo-secure-store',
    [
      '@rnmapbox/maps',
      {
        RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN,
      },
    ],
    'expo-font',
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
};

export default config;
