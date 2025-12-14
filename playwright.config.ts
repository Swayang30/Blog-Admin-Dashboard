import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /.*\.(pw|spec)\.ts$/,
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  reporter: 'list',
  use: {
    headless: true,
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
