import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:5174',
    viewport: { width: 1440, height: 1000 },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {} } },
    { name: 'mobile-webkit', testMatch: '**/mobile.spec.ts', use: { browserName: 'webkit', viewport: { width: 402, height: 874 }, isMobile: true, hasTouch: true } },
  ],
  webServer: process.env.E2E_BASE_URL ? undefined : { command: 'npm run preview -- --host 127.0.0.1 --port 5174 --strictPort', url: 'http://127.0.0.1:5174', reuseExistingServer: false },
})
