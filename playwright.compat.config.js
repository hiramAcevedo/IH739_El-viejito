// Compatibilidad: el recorrido de compra y el seguimiento en el motor de Safari con perfil de iPhone, en Chrome con
// perfil de Android y en Firefox de escritorio. WebKit y Firefox son los navegadores de Playwright
// (npx playwright install webkit firefox); Chrome es el instalado. Mismo sitio, API y CLI de Stripe que playwright.config.js.
import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config.js'

export default defineConfig({
  ...base,
  testMatch: /(compra|seguimiento)\.spec\.js/,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-compat' }]],
  use: {
    baseURL: base.use.baseURL,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'iPhone 14, Safari (WebKit)', use: { ...devices['iPhone 14'] } },
    { name: 'Pixel 7, Chrome', use: { ...devices['Pixel 7'], channel: 'chrome' } },
    { name: 'Escritorio, Firefox', use: { ...devices['Desktop Firefox'] } }
  ]
})
