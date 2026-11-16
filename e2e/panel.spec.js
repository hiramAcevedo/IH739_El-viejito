import { test, expect } from '@playwright/test'
import { PAGADO, sesionPanel } from './ayuda.js'

test.describe('Panel de administración', () => {
  test('sin sesión, /admin manda al inicio de sesión', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('con la sesión del superadministrador muestra el dashboard y los pedidos', async ({ page }) => {
    const sesion = sesionPanel()
    test.skip(!sesion, 'sin E2E_SESION')
    await page.addInitScript((datos) => {
      for (const [k, v] of Object.entries(datos)) localStorage.setItem(k, v)
    }, sesion)
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Panel de administración' })).toBeVisible()
    await expect(page.getByText(/registrados ·/)).toBeVisible()
    await page.getByRole('button', { name: 'Pedidos', exact: true }).click()
    await expect(page.getByText(`#${PAGADO}`)).toBeVisible()
  })
})
