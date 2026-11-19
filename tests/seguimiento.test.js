import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import FormularioSeguimiento from '@/components/compartidos/FormularioSeguimiento.vue'
import SeguimientoView from '@/views/SeguimientoView.vue'

// SeguimientoView usa el api.js real; sólo fetch está simulado
const URL_SEGUIMIENTO = 'https://api.prueba.local/api/pedidos/seguimiento/'
const PEDIDO = {
  folio: '9C61F2A4',
  creado: '2026-11-07T18:12:00-06:00',
  estado: 'confirmado',
  estado_pago: 'pagado',
  metodo_entrega: 'envio',
  lineas: [{ nombre: 'Blanco Clásico', precio: '320.00', cantidad: 3, subtotal: '960.00' }],
  subtotal: '960.00',
  iva: '153.60',
  envio: '0.00',
  total: '1113.60',
  historial: [],
  envio_info: null
}
const json = (status, cuerpo) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } })
const Vacia = { render: () => null }

const ERROR_CORREO = 'Escribe el correo con el que compraste.'
const ERROR_FOLIO = 'El folio tiene ocho caracteres, letras de la A a la F y números.'

async function buscar(wrapper, correo, folio) {
  await wrapper.get('#seg-correo').setValue(correo)
  await wrapper.get('#seg-folio').setValue(folio)
  await wrapper.get('form').trigger('submit')
}

async function montarVista() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/seguimiento', name: 'seguimiento', component: Vacia },
      { path: '/seguimiento/:folio', name: 'seguimiento-detalle', component: Vacia }
    ]
  })
  router.push('/seguimiento')
  await router.isReady()
  return { wrapper: mount(SeguimientoView, { global: { plugins: [router] } }), router }
}

enableAutoUnmount(afterEach)

let fetchSimulado
beforeEach(() => {
  sessionStorage.clear()
  fetchSimulado = vi.fn()
  vi.stubGlobal('fetch', fetchSimulado)
})

describe('Rastrear pedido: correo y folio', () => {
  it('FormularioSeguimiento: con el correo o el folio mal escritos muestra el mensaje de cada campo y no busca', async () => {
    const wrapper = mount(FormularioSeguimiento)

    await wrapper.get('form').trigger('submit')
    expect(wrapper.text()).toContain(ERROR_CORREO)
    expect(wrapper.text()).toContain(ERROR_FOLIO)

    await buscar(wrapper, 'rosa@example.com', '9C61F2A') // siete caracteres
    expect(wrapper.text()).not.toContain(ERROR_CORREO)
    expect(wrapper.text()).toContain(ERROR_FOLIO)
    expect(wrapper.get('#seg-correo').attributes('aria-invalid')).toBe('false')
    expect(wrapper.get('#seg-folio').attributes('aria-invalid')).toBe('true')

    await buscar(wrapper, 'rosa@example', 'GHIJKLMN') // correo sin dominio; ocho letras fuera de A-F
    expect(wrapper.text()).toContain(ERROR_CORREO)
    expect(wrapper.text()).toContain(ERROR_FOLIO)

    expect(wrapper.emitted('buscar')).toBeUndefined()
  })

  it('FormularioSeguimiento: pasa el folio a mayúsculas y el correo a minúsculas sin espacios antes de buscar', async () => {
    const wrapper = mount(FormularioSeguimiento)

    await buscar(wrapper, '  Rosa@Example.com ', '9c61f2a4')

    expect(wrapper.get('#seg-folio').element.value).toBe('9C61F2A4')
    expect(wrapper.emitted('buscar')).toEqual([[{ correo: 'rosa@example.com', folio: '9C61F2A4' }]])
  })

  it('SeguimientoView: hace POST /pedidos/seguimiento/ con {correo, folio} en JSON, guarda el pedido para el detalle y abre /seguimiento/{folio}', async () => {
    fetchSimulado.mockResolvedValue(json(200, PEDIDO))
    const { wrapper, router } = await montarVista()

    await buscar(wrapper, 'Rosa@example.com', '9c61f2a4')
    await flushPromises()

    expect(fetchSimulado).toHaveBeenCalledTimes(1)
    const [url, opciones] = fetchSimulado.mock.calls[0]
    expect(url).toBe(URL_SEGUIMIENTO)
    expect(opciones.method).toBe('POST')
    expect(opciones.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(opciones.body)).toEqual({ correo: 'rosa@example.com', folio: '9C61F2A4' })
    expect(JSON.parse(sessionStorage.getItem('seguimiento-9C61F2A4'))).toEqual(PEDIDO)
    expect(router.currentRoute.value.fullPath).toBe('/seguimiento/9C61F2A4')
  })

  it('SeguimientoView: un 404 muestra el mensaje de la API, que no dice qué dato falló; un error del servidor o de la red, el mensaje genérico', async () => {
    const { wrapper, router } = await montarVista()
    const alerta = () => wrapper.get('[role="alert"]').text()

    fetchSimulado.mockResolvedValueOnce(
      json(404, { detail: 'No encontramos un pedido con esos datos. Revisa el correo y el folio.' })
    )
    await buscar(wrapper, 'rosa@example.com', '9C61F2A4')
    await flushPromises()
    expect(alerta()).toBe('No encontramos un pedido con esos datos. Revisa el correo y el folio.')

    fetchSimulado.mockResolvedValueOnce(json(500, { detail: 'Internal Server Error' }))
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(alerta()).toBe('No pudimos consultar el pedido. Intenta de nuevo en un momento.')

    fetchSimulado.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(alerta()).toBe('No pudimos consultar el pedido. Intenta de nuevo en un momento.')

    expect(fetchSimulado).toHaveBeenCalledTimes(3)
    expect(router.currentRoute.value.fullPath).toBe('/seguimiento')
    expect(sessionStorage.length).toBe(0)
  })
})
