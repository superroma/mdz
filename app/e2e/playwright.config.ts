import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

export default defineConfig({
  globalSetup: require.resolve('./setup/global-setup'),
  webServer: [
    {
      command: 'pnpm -C ../backend dev',
      port: 3002,
      env: {
        STORAGE_ROOT: path.resolve(__dirname, 'test-pages'),
        PORT: '3002',
      },
      reuseExistingServer: true,
    },
    {
      command: 'pnpm vite --port 5174 --strictPort',
      port: 5174,
      cwd: path.resolve(__dirname, '../frontend'),
      env: {
        BACKEND_PORT: '3002',
      },
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
      reuseExistingServer: true,
    },
  ],
  use: {
    baseURL: 'http://localhost:5174',
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
