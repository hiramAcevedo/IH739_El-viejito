import { test, expect } from '@playwright/test'
import { sembrarCarrito, llenarCheckout, PAGADO } from './ayuda.js'

// Objetivos de sprint que se comprueban en el navegador (los demás, contra la API, en las pruebas de servicios).
test.describe('Aceptación por sprint', () => {
  test('sprint 2: un pago abandonado a la mitad vuelve a "Completa tu pago" con su folio', async ({ page, request }) => {
    await sembrarCarrito(page, request, [['Extra Añejo', 1]])
    await page.goto('/checkout')
    await llenarCheckout(page, 'Prueba PI abandonado')
    await page.check('input[type=checkbox][required]')
    await page.click('button[type=submit]')
    await page.waitForURL('https://checkout.stripe.com/**')
    // la flecha de regreso de la página de Stripe lleva al sitio sin pagar
    await page.locator("a[href*='localhost:5173']").first().click()
    await page.waitForURL(/\/pago\/(error|pendiente)/)
    await expect(page.getByText('Completa tu pago')).toBeVisible()
    await expect(page.getByText(/^#[0-9A-F]{8}$/)).toBeVisible()
  })

  test('sprint 3: la liga firmada del correo de confirmación abre el detalle del pedido', async ({ page }) => {
    const firma = process.env.E2E_FIRMA
    test.skip(!firma, 'sin E2E_FIRMA')
    await page.goto(`/seguimiento/${PAGADO}?firma=${firma}`)
    await expect(page.getByText(`#${PAGADO}`)).toBeVisible()
    await expect(page.getByText('Pagado').first()).toBeVisible()
  })
})
