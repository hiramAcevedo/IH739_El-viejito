import { test, expect } from '@playwright/test'

const RUTAS = ['/', '/nosotros', '/productos', '/contacto', '/carrito', '/checkout', '/seguimiento', '/privacidad']

test.describe('A 360 píxeles de ancho', () => {
  test.use({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true })
  for (const ruta of RUTAS) {
    test(`${ruta} no se desborda a lo ancho`, async ({ page }) => {
      await page.goto(ruta)
      await page.waitForLoadState('networkidle')
      const ancho = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(ancho).toBeLessThanOrEqual(360)
    })
  }
})
