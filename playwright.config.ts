import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
  },
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 5174 --strictPort', url: 'http://127.0.0.1:5174', reuseExistingServer: false },
})
