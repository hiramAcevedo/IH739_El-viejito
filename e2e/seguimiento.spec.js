import { test, expect } from '@playwright/test'
import { CORREO, PAGADO } from './ayuda.js'

test.describe('Rastrear pedido', () => {
  test('con el correo y el folio muestra el pedido pagado con su guía', async ({ page }) => {
    await page.goto('/seguimiento')
    await page.fill('#seg-correo', CORREO)
    await page.fill('#seg-folio', PAGADO)
    await page.click('form button[type=submit]')
    await page.waitForURL(`**/seguimiento/${PAGADO}**`)
    await expect(page.getByText(`#${PAGADO}`)).toBeVisible()
    await expect(page.getByText('Pagado').first()).toBeVisible()
    await expect(page.getByText(/Guía/)).toBeVisible()
  })

  test('con otro correo no revela si el folio existe', async ({ page }) => {
    await page.goto('/seguimiento')
    await page.fill('#seg-correo', 'otra.persona@example.com')
    await page.fill('#seg-folio', PAGADO)
    await page.click('form button[type=submit]')
    await expect(page.getByText(/No encontramos un pedido con esos datos/)).toBeVisible()
    await expect(page).toHaveURL(/\/seguimiento$/)
  })
})
