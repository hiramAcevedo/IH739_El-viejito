// Pruebas de punta a punta del sitio con Playwright, en el Chrome instalado (no baja navegadores).
// Por omisión van contra el build de producción servido en localhost:5173 (npm run build y vite preview), con la API
// en 127.0.0.1:8000 y la CLI de Stripe reenviando los avisos. E2E_BASE_URL cambia el sitio, por ejemplo al publicado.
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    channel: 'chrome',
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  }
})
