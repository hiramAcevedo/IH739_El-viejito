import { test, expect } from '@playwright/test'
import { sembrarCarrito, llenarCheckout } from './ayuda.js'

test.describe('Compra', () => {
  test('el checkout no avanza sin la confirmación de mayoría de edad', async ({ page, request }) => {
    await sembrarCarrito(page, request, [['Blanco Clásico', 1]])
    await page.goto('/checkout')
    await llenarCheckout(page, 'Prueba 3.4 sin edad')
    await page.click('button[type=submit]')
    await expect(page).toHaveURL(/\/checkout$/)
    const edad = page.locator('input[type=checkbox][required]')
    await expect(edad).not.toBeChecked()
    expect(await edad.evaluate((el) => el.validity.valueMissing)).toBe(true)
  })

  test('compra aprobada con la tarjeta 4242 termina en «Pago confirmado»', async ({ page, request }) => {
    await sembrarCarrito(page, request, [['Reposado Suave', 1]])
    await page.goto('/checkout')
    await llenarCheckout(page, 'Prueba 3.4 aprobado')
    await page.check('input[type=checkbox][required]')
    await page.click('button[type=submit]')
    await page.waitForURL('https://checkout.stripe.com/**')
    await page.fill('#cardNumber', '4242424242424242')
    await page.fill('#cardExpiry', '12 / 34')
    await page.fill('#cardCvc', '123')
    await page.fill('#billingName', 'Prueba 3.4 aprobado')
    await page.click('button[type=submit]')
    await page.waitForURL('**/pago/confirmado**', { timeout: 60_000 })
    await expect(page.getByText('Gracias por tu compra')).toBeVisible({ timeout: 70_000 })
  })

  test('tarjeta rechazada: Stripe lo avisa y el sitio ofrece intentar de nuevo', async ({ page, request }) => {
    await sembrarCarrito(page, request, [['Blanco Clásico', 1]])
    await page.goto('/checkout')
    await llenarCheckout(page, 'Prueba 3.4 rechazado')
    await page.check('input[type=checkbox][required]')
    await page.click('button[type=submit]')
    await page.waitForURL('https://checkout.stripe.com/**')
    await page.fill('#cardNumber', '4000000000000002')
    await page.fill('#cardExpiry', '12 / 34')
    await page.fill('#cardCvc', '123')
    await page.fill('#billingName', 'Prueba 3.4 rechazado')
    await page.click('button[type=submit]')
    await expect(page.getByText(/rechaz|declined/i).first()).toBeVisible({ timeout: 30_000 })
    await page.locator("a[href*='/pago/error'], a[href*='localhost:5173']").first().click()
    await page.waitForURL('**/pago/error**')
    await expect(page.getByRole('button', { name: /intentar de nuevo/i }).or(page.getByText(/intentar de nuevo/i)).first()).toBeVisible()
  })
})
