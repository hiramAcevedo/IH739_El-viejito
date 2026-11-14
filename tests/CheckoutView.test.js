import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import CheckoutView from '@/views/CheckoutView.vue'
import { useCarritoStore } from '@/stores/carritoStore'

const api = vi.hoisted(() => ({
  calcularPedido: vi.fn(),
  crearPedido: vi.fn(),
  abrirSesionPago: vi.fn()
}))
vi.mock('@/lib/api', () => api)

const COTIZACION = {
  lineas: [
    {
      id: 'p-reposado',
      nombre: 'Reposado Suave',
      precio: '450.00',
      cantidad: 2,
      subtotal: '900.00'
    },
    { id: 'p-anejo', nombre: 'Añejo Premium', precio: '680.00', cantidad: 1, subtotal: '680.00' }
  ],
  subtotal: '1580.00',
  iva: '252.80',
  envio: '0.00',
  total: '1832.80',
  moneda: 'mxn'
}
const Vacia = { render: () => null }

async function montar() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const carrito = useCarritoStore()
  carrito.agregarProducto({
    id: 'p-reposado',
    nombre: 'Reposado Suave',
    imagen_url: 'tequila-reposado.webp'
  })
  carrito.agregarProducto({
    id: 'p-reposado',
    nombre: 'Reposado Suave',
    imagen_url: 'tequila-reposado.webp'
  })
  carrito.agregarProducto({
    id: 'p-anejo',
    nombre: 'Añejo Premium',
    imagen_url: 'tequila-anejo.webp'
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/checkout', component: Vacia },
      { path: '/productos', component: Vacia },
      { path: '/pago/confirmado', name: 'pago-confirmado', component: Vacia }
    ]
  })
  router.push('/checkout')
  await router.isReady()

  const wrapper = mount(CheckoutView, { global: { plugins: [pinia, router] } })
  await cotizar()
  return { wrapper, router }
}

// la cotización espera 300 ms a que el carrito deje de cambiar y luego llama a la API
async function cotizar() {
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()
}

async function llenarContacto(wrapper) {
  await wrapper.get('#nombre').setValue('Laura Méndez')
  await wrapper.get('#correo').setValue('laura@example.com')
}

async function llenarDireccion(wrapper, codigoPostal = '44160') {
  await wrapper.get('#calle').setValue('Av. Juárez 1450, int. 3')
  await wrapper.get('#colonia').setValue('Americana')
  await wrapper.get('#cp').setValue(codigoPostal)
  await wrapper.get('#ciudad').setValue('Guadalajara')
}

const botonPagar = (wrapper) => wrapper.get('button[type="submit"]')
const desactivado = (wrapper) => botonPagar(wrapper).attributes('disabled') !== undefined
const loQueFalta = (wrapper) => wrapper.get('.pie-pago').text()

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  sessionStorage.clear()
  api.calcularPedido.mockResolvedValue(COTIZACION)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CheckoutView: validación del formulario', () => {
  it('nombre y correo son obligatorios y el correo necesita un formato válido; mientras falten, «Pagar» está desactivado', async () => {
    const { wrapper } = await montar()
    expect(api.calcularPedido).toHaveBeenCalledWith({
      items: [
        { producto_id: 'p-reposado', cantidad: 2 },
        { producto_id: 'p-anejo', cantidad: 1 }
      ],
      metodo_entrega: 'envio'
    })

    expect(desactivado(wrapper)).toBe(true)
    expect(loQueFalta(wrapper)).toBe('Escribe tu nombre y un correo válido.')

    await wrapper.get('#correo').setValue('laura@example.com') // sin nombre
    expect(desactivado(wrapper)).toBe(true)
    expect(loQueFalta(wrapper)).toBe('Escribe tu nombre y un correo válido.')

    await wrapper.get('#nombre').setValue('Laura Méndez')
    for (const correo of ['laura', 'laura@example', 'laura @example.com', '@example.com']) {
      await wrapper.get('#correo').setValue(correo)
      expect(desactivado(wrapper)).toBe(true)
      expect(loQueFalta(wrapper)).toBe('Escribe tu nombre y un correo válido.')
    }

    await wrapper.get('#correo').setValue('laura@example.com')
    expect(loQueFalta(wrapper)).toBe('Completa la dirección de entrega.')
  })

  it('sin la confirmación de mayoría de edad «Pagar» sigue desactivado y enviar el formulario no llama a la API; al marcarla se activa con el total de la API', async () => {
    const { wrapper } = await montar()
    await llenarContacto(wrapper)
    await llenarDireccion(wrapper)

    expect(loQueFalta(wrapper)).toBe('Confirma que eres mayor de edad para activar el pago.')
    expect(desactivado(wrapper)).toBe(true)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.crearPedido).not.toHaveBeenCalled()

    await wrapper.get('input[type="checkbox"]').setValue(true)
    expect(desactivado(wrapper)).toBe(false)
    expect(botonPagar(wrapper).text()).toBe('Pagar $1,832.80')
  })

  it('con envío a domicilio exige calle, colonia, ciudad y un C.P. de cinco dígitos; al recoger en tienda no pide dirección y vuelve a cotizar', async () => {
    const { wrapper } = await montar()
    await llenarContacto(wrapper)
    await wrapper.get('input[type="checkbox"]').setValue(true)

    for (const codigoPostal of ['4416', '441600', '44A60']) {
      await llenarDireccion(wrapper, codigoPostal)
      expect(desactivado(wrapper)).toBe(true)
      expect(loQueFalta(wrapper)).toBe('Completa la dirección de entrega.')
    }
    await wrapper.get('#cp').setValue('44160')
    expect(desactivado(wrapper)).toBe(false)

    await wrapper.get('#colonia').setValue('')
    expect(desactivado(wrapper)).toBe(true)

    await wrapper.get('input[value="recoger"]').setValue(true)
    expect(wrapper.find('#calle').exists()).toBe(false)
    await cotizar()
    expect(api.calcularPedido).toHaveBeenLastCalledWith({
      items: [
        { producto_id: 'p-reposado', cantidad: 2 },
        { producto_id: 'p-anejo', cantidad: 1 }
      ],
      metodo_entrega: 'recoger'
    })
    expect(desactivado(wrapper)).toBe(false)
  })

  it('al pagar manda a crearPedido producto y cantidad, los datos del comprador y confirma_mayor_de_edad, guarda el pedido en curso y lleva a la página de pago', async () => {
    api.crearPedido.mockResolvedValue({ id: 'p-nuevo-1', folio: 'C41D9A7E', ...COTIZACION })
    api.abrirSesionPago.mockResolvedValue({
      folio: 'C41D9A7E',
      sesion: 'cs_test_9',
      importe: '1832.80',
      url: '/pago/confirmado?session_id=cs_test_9'
    })
    const { wrapper, router } = await montar()
    await llenarContacto(wrapper)
    await llenarDireccion(wrapper)
    await wrapper.get('input[type="checkbox"]').setValue(true)

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(api.crearPedido).toHaveBeenCalledWith({
      items: [
        { producto_id: 'p-reposado', cantidad: 2 },
        { producto_id: 'p-anejo', cantidad: 1 }
      ],
      metodo_entrega: 'envio',
      cliente_nombre: 'Laura Méndez',
      cliente_email: 'laura@example.com',
      telefono: '',
      notas: '',
      direccion: {
        calle: 'Av. Juárez 1450, int. 3',
        colonia: 'Americana',
        codigo_postal: '44160',
        ciudad: 'Guadalajara',
        estado: 'Jalisco'
      },
      confirma_mayor_de_edad: true
    })
    expect(api.abrirSesionPago).toHaveBeenCalledWith('p-nuevo-1')
    expect(JSON.parse(sessionStorage.getItem('pedido-en-curso'))).toEqual({
      id: 'p-nuevo-1',
      folio: 'C41D9A7E'
    })
    expect(router.currentRoute.value.fullPath).toBe('/pago/confirmado?session_id=cs_test_9')
  })
})
