import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ssbgpt',
  appName: 'SSBGPT',
  webDir: 'dist',
  server: {
    url: 'https://58bfcb0e-7d94-45ef-a877-b41b0fb1b12f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
