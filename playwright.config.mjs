import { defineConfig } from '@playwright/test';

// Tests dans un vrai navigateur (Chromium). Profils smartphone et Chromebook.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: process.env.NYVO_URL || 'http://localhost:4173/',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },
  projects: [
    { name: 'smartphone-390', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
    { name: 'chromebook-1366', use: { viewport: { width: 1366, height: 768 } } },
  ],
  webServer: process.env.NYVO_URL
    ? undefined
    : { command: 'node scripts/serve.mjs app 4173', url: 'http://localhost:4173/', reuseExistingServer: true },
});
