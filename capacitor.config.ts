import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.paintpile.app',
  appName: 'PaintPile',
  webDir: 'out',
  server: {
    url: 'https://www.paintpile.com',
    cleartext: true,
  },
};

export default config;
