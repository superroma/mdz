import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

export default defineConfig({
  globalSetup: require.resolve('./setup/global-setup'),
  webServer: [
    {
      command: 'pnpm -C ../backend dev',
      port: 3001,
      env: { STORAGE_ROOT: path.resolve(__dirname, 'test-pages') },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm -C ../frontend dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
  use: {
    baseURL: 'http://localhost:5173',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/*.spec.ts', '!**/*.mobile.spec.ts'],
    },
    {
      name: 'mobile',
      use: { viewport: { width: 375, height: 812 } },
      testMatch: ['**/*.mobile.spec.ts', '**/mobile-*.spec.ts'],
    },
  ],
})
