// Lo que comparten las pruebas: un carrito sembrado en localStorage, los datos del comprador y la sesión del panel.
import { readFileSync } from 'node:fs'

export const CORREO = 'prueba.sprint4@example.com'
export const PAGADO = '5BCD1264'

export async function sembrarCarrito(page, request, lineas) {
  const productos = await (await request.get(`${process.env.E2E_API || 'http://127.0.0.1:8000/api'}/productos/`)).json()
  const carrito = lineas.map(([nombre, cantidad]) => {
    const p = productos.find((x) => x.nombre === nombre) || productos[0]
    return { id: p.id, nombre: p.nombre, imagen_url: p.imagen_url, cantidad }
  })
  await page.addInitScript((valor) => {
    if (!sessionStorage.getItem('sembrado')) {
      localStorage.setItem('carrito-el-viejito', valor)
      sessionStorage.setItem('sembrado', '1')
    }
  }, JSON.stringify(carrito))
}

export async function llenarCheckout(page, nombre) {
  await page.fill('#nombre', nombre)
  await page.fill('#correo', CORREO)
  await page.fill('#telefono', '33 0000 0034')
  await page.fill('#calle', 'Calle de prueba 4')
  await page.fill('#cp', '44100')
  await page.fill('#colonia', 'Centro')
  await page.fill('#ciudad', 'Guadalajara')
}

// La sesión del superadministrador, guardada fuera del repositorio (E2E_SESION); sin ella, las pruebas del panel con
// sesión se saltan.
export function sesionPanel() {
  const ruta = process.env.E2E_SESION
  if (!ruta) return null
  return JSON.parse(readFileSync(ruta, 'utf8'))
}
