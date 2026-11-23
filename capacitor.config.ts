import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.astronova3d.tv',
  appName: 'Astro Nova 3D',
  webDir: 'dist',
  android: {
    backgroundColor: '#060b19',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
