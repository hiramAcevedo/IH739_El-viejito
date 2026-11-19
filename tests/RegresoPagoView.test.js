import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import RegresoPagoView from '@/views/RegresoPagoView.vue'
import { useCarritoStore } from '@/stores/carritoStore'
import { ESPERA_DEL_AVISO, siguientePausa } from '@/lib/regreso.js'

const api = vi.hoisted(() => ({ consultarRegreso: vi.fn(), abrirSesionPago: vi.fn() }))
vi.mock('@/lib/api', () => api)

const RESUMEN = {
  folio: 'C41D9A7E',
  sesion: 'cs_test_1',
  importe: '1832.80',
  lineas: [
    { nombre: 'Reposado Suave', precio: '450.00', cantidad: 2, subtotal: '900.00' },
    { nombre: 'Añejo Premium', precio: '680.00', cantidad: 1, subtotal: '680.00' }
  ],
  subtotal: '1580.00',
  iva: '252.80',
  envio: '0.00',
  total: '1832.80'
}
// la pasarela ya cobró, pero el aviso (webhook) todavía no llega a la base
const CONFIRMANDO = {
  ...RESUMEN,
  estado_sesion: 'complete',
  pago: 'paid',
  estado_pago: 'pendiente'
}
const PAGADO = { ...RESUMEN, estado_sesion: 'complete', pago: 'paid', estado_pago: 'pagado' }
const ABIERTA = {
  ...RESUMEN,
  estado_sesion: 'open',
  pago: 'unpaid',
  estado_pago: 'pendiente',
  url: 'https://pago.prueba.local/c/cs_test_1',
  vence: '2026-11-09T18:30:00-06:00'
}
const VENCIDA = { ...RESUMEN, estado_sesion: 'expired', pago: 'unpaid', estado_pago: 'pendiente' }
const RECHAZADA = {
  ...RESUMEN,
  estado_sesion: 'complete',
  pago: 'unpaid',
  estado_pago: 'rechazado'
}

const Vacia = { render: () => null }
const titulo = (wrapper) => wrapper.get('h1').text()
const insigniaVisible = (wrapper) => wrapper.get('.pago > span[aria-hidden="true"]').text()
const insigniaAccesible = (wrapper) => wrapper.get('.pago .sr-only').text()

/**
 * La espera agotada se lee neutra: no afirma que el pago pasó ni suena a error. La insignia es la gris de correo, con
 * su sobre, y en la pantalla no hay alertas ni iconos de alerta.
 */
function sinTonoDeError(wrapper) {
  expect(wrapper.text()).not.toMatch(/aprob|error|problema|fall[oó]/i)
  expect(wrapper.get('.pago').classes()).toEqual(expect.arrayContaining(['pago', 'pago--correo']))
  expect(wrapper.get('.pago svg').classes().join(' ')).toMatch(/mail/)
  expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  expect(wrapper.html()).not.toMatch(/lucide-(x|circle-alert|triangle-alert|alert)/)
}

let pinia
async function montar(ruta) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/pago/confirmado', name: 'pago-confirmado', component: Vacia },
      { path: '/pago/pendiente', name: 'pago-pendiente', component: Vacia },
      { path: '/pago/error', name: 'pago-error', component: Vacia },
      { path: '/carrito', component: Vacia },
      { path: '/checkout', component: Vacia },
      { path: '/seguimiento', component: Vacia },
      { path: '/productos', component: Vacia }
    ]
  })
  router.push(ruta)
  await router.isReady()
  const wrapper = mount(RegresoPagoView, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { wrapper, router }
}

enableAutoUnmount(afterEach)

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  sessionStorage.clear()
  pinia = createPinia()
  setActivePinia(pinia)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('RegresoPagoView: pantallas de regreso de la pasarela', () => {
  it('mientras corre la primera consulta ya se ve «Confirmando tu pago», sin folio; con el cargo aprobado y sin el aviso en la base (pago = paid, estado_pago = pendiente) aparecen el folio y el resumen, y el carrito no se vacía', async () => {
    let responder
    api.consultarRegreso.mockReturnValueOnce(
      new Promise((resolve) => {
        responder = resolve
      })
    )
    const carrito = useCarritoStore()
    carrito.agregarProducto({
      id: 'p-reposado',
      nombre: 'Reposado Suave',
      imagen_url: 'tequila-reposado.webp'
    })

    const { wrapper, router } = await montar('/pago/confirmado?session_id=cs_test_1')
    expect(api.consultarRegreso).toHaveBeenCalledWith('cs_test_1')
    expect(titulo(wrapper)).toBe('Confirmando tu pago')
    expect(wrapper.find('.regreso__folio').exists()).toBe(false)
    expect(insigniaVisible(wrapper)).toBe('Revisando tu pago')
    expect(wrapper.text()).toContain('Esta pantalla se actualiza sola.')

    responder(CONFIRMANDO)
    await flushPromises()

    expect(titulo(wrapper)).toBe('Confirmando tu pago')
    expect(wrapper.get('.regreso__folio').text()).toBe('#C41D9A7E')
    expect(wrapper.text()).toContain('Esta pantalla se actualiza sola.')
    expect(wrapper.text()).toContain('$1,832.80')
    // la página sólo afirma lo que ya está en la base: nada de «aprobó» mientras el pedido sigue pendiente
    expect(wrapper.text()).not.toMatch(/aprob/i)
    expect(router.currentRoute.value.name).toBe('pago-confirmado')
    expect(carrito.items).toHaveLength(1)
  })

  it('la insignia rota cada 3 s entre textos neutros; los lectores de pantalla oyen siempre la misma etiqueta', async () => {
    api.consultarRegreso.mockResolvedValue(CONFIRMANDO)
    const { wrapper } = await montar('/pago/confirmado?session_id=cs_test_1')

    const vistos = [insigniaVisible(wrapper)]
    for (let i = 0; i < 3; i++) {
      await vi.advanceTimersByTimeAsync(3000)
      vistos.push(insigniaVisible(wrapper))
    }
    expect(vistos).toEqual(['Revisando tu pago', 'Espera un momento', 'Seguimos revisando', 'Revisando tu pago'])
    expect(insigniaAccesible(wrapper)).toBe('Confirmando el pago')
    expect(wrapper.get('.pago > span[aria-hidden="true"]').attributes('aria-hidden')).toBe('true')
  })

  it('vuelve a preguntar cada 2 s, no antes; cuando la API responde estado_pago = pagado muestra «Gracias por tu compra», vacía el carrito, borra el pedido en curso y deja de preguntar', async () => {
    api.consultarRegreso
      .mockResolvedValueOnce(CONFIRMANDO) // al llegar
      .mockResolvedValueOnce(CONFIRMANDO) // a los 2 s
      .mockResolvedValue(PAGADO) // a los 4 s
    sessionStorage.setItem(
      'pedido-en-curso',
      JSON.stringify({ id: 'p-nuevo-1', folio: 'C41D9A7E' })
    )
    const carrito = useCarritoStore()
    carrito.agregarProducto({
      id: 'p-reposado',
      nombre: 'Reposado Suave',
      imagen_url: 'tequila-reposado.webp'
    })

    const { wrapper } = await montar('/pago/confirmado?session_id=cs_test_1')
    expect(api.consultarRegreso).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1999)
    expect(api.consultarRegreso).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(api.consultarRegreso).toHaveBeenCalledTimes(2)
    expect(titulo(wrapper)).toBe('Confirmando tu pago')

    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()
    expect(api.consultarRegreso).toHaveBeenCalledTimes(3)
    expect(titulo(wrapper)).toBe('Gracias por tu compra')
    expect(wrapper.get('.pago').text()).toBe('Pago confirmado')
    expect(carrito.items).toEqual([])
    expect(sessionStorage.getItem('pedido-en-curso')).toBeNull()

    await vi.advanceTimersByTimeAsync(10000)
    expect(api.consultarRegreso).toHaveBeenCalledTimes(3)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('si el aviso no llega pregunta cada 2 s el primer medio minuto y luego cada 10 s; a los 2 minutos se rinde: la misma pantalla manda a esperar el correo', async () => {
    api.consultarRegreso.mockResolvedValue(CONFIRMANDO)

    const { wrapper } = await montar('/pago/confirmado?session_id=cs_test_1')
    await vi.advanceTimersByTimeAsync(29999)
    expect(api.consultarRegreso).toHaveBeenCalledTimes(15) // al llegar y a los 2, 4… 28 s
    await vi.advanceTimersByTimeAsync(1)
    expect(api.consultarRegreso).toHaveBeenCalledTimes(16) // a los 30 s
    await vi.advanceTimersByTimeAsync(9999)
    expect(api.consultarRegreso).toHaveBeenCalledTimes(16)
    await vi.advanceTimersByTimeAsync(1)
    expect(api.consultarRegreso).toHaveBeenCalledTimes(17) // a los 40 s
    expect(titulo(wrapper)).toBe('Confirmando tu pago')

    await vi.advanceTimersByTimeAsync(80000)
    await flushPromises()
    expect(api.consultarRegreso).toHaveBeenCalledTimes(25) // la última, a los 120 s
    expect(titulo(wrapper)).toBe('Confirmando tu pago')
    expect(wrapper.get('.pago').text()).toBe('Te avisaremos por correo')
    expect(wrapper.get('.pago').classes()).toContain('pago--correo')
    expect(wrapper.get('.regreso__folio').text()).toBe('#C41D9A7E')
    expect(wrapper.get('.regreso__texto').text()).toBe('La confirmación está tomando un poco más de tiempo. No tienes que ' +
      'hacer nada: te enviaremos un correo de confirmación cuando acreditemos tu pago. Mientras, puedes rastrear tu pedido ' +
      'con tu folio.')
    expect(wrapper.text()).not.toContain('Esta pantalla se actualiza sola.')
    sinTonoDeError(wrapper)
    expect(wrapper.get('a.regreso__liga').attributes('href')).toBe('/seguimiento')
    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)

    await vi.advanceTimersByTimeAsync(600000)
    expect(api.consultarRegreso).toHaveBeenCalledTimes(25)
    expect(wrapper.get('.pago').text()).toBe('Te avisaremos por correo')
  })

  it('una red caída durante la espera larga no corta el ciclo: sigue al mismo ritmo y a los 2 minutos muestra el aviso', async () => {
    api.consultarRegreso
      .mockResolvedValueOnce(CONFIRMANDO) // al llegar
      .mockRejectedValue(new TypeError('Failed to fetch')) // después, la red no responde

    const { wrapper } = await montar('/pago/confirmado?session_id=cs_test_1')
    await vi.advanceTimersByTimeAsync(40000)
    expect(api.consultarRegreso).toHaveBeenCalledTimes(17)
    expect(titulo(wrapper)).toBe('Confirmando tu pago')

    await vi.advanceTimersByTimeAsync(80000)
    await flushPromises()
    expect(api.consultarRegreso).toHaveBeenCalledTimes(25)
    expect(titulo(wrapper)).toBe('Confirmando tu pago')
    expect(wrapper.get('.pago').text()).toBe('Te avisaremos por correo')
    expect(wrapper.text()).not.toContain('No encontramos ese pago')
    sinTonoDeError(wrapper)
  })

  it('el ritmo de la espera: 15 pausas de 2 s, 9 de 10 s y ninguna más después de 2 minutos', () => {
    const pausas = []
    for (let esperado = 0, pausa; (pausa = siguientePausa(esperado)) !== null; esperado += pausa) pausas.push(pausa)
    expect(pausas).toEqual([...Array(15).fill(2000), ...Array(9).fill(10000)])
    expect(pausas.reduce((a, b) => a + b)).toBe(ESPERA_DEL_AVISO.hasta)
    expect(siguientePausa(0, { cada: 1, luegoCada: 5, desde: 2, hasta: 3 })).toBe(1)
  })

  it('sesión abierta sin pagar: «Completa tu pago» con la fecha límite y la liga de pago; la ruta pasa a /pago/pendiente y no vuelve a preguntar', async () => {
    api.consultarRegreso.mockResolvedValue(ABIERTA)

    const { wrapper, router } = await montar('/pago/confirmado?session_id=cs_test_1')

    expect(titulo(wrapper)).toBe('Completa tu pago')
    expect(wrapper.text()).toContain('La sesión de pago sigue abierta hasta el 9 nov, 06:30 p.m.')
    expect(wrapper.get('a.boton').attributes('href')).toBe('https://pago.prueba.local/c/cs_test_1')
    expect(router.currentRoute.value.name).toBe('pago-pendiente')
    expect(router.currentRoute.value.query.session_id).toBe('cs_test_1')

    await vi.advanceTimersByTimeAsync(10000)
    expect(api.consultarRegreso).toHaveBeenCalledTimes(1)
  })

  it('sesión vencida o pago rechazado: «El cobro no se completó» con «Intentar de nuevo», la ruta pasa a /pago/error y el carrito sigue igual', async () => {
    const carrito = useCarritoStore()
    carrito.agregarProducto({
      id: 'p-reposado',
      nombre: 'Reposado Suave',
      imagen_url: 'tequila-reposado.webp'
    })

    for (const respuesta of [VENCIDA, RECHAZADA]) {
      api.consultarRegreso.mockResolvedValue(respuesta)
      const { wrapper, router } = await montar('/pago/confirmado?session_id=cs_test_1')

      expect(titulo(wrapper)).toBe('El cobro no se completó')
      expect(wrapper.get('.pago').text()).toBe('No se pudo cobrar')
      expect(wrapper.findAll('button').map((b) => b.text())).toContain('Intentar de nuevo')
      expect(router.currentRoute.value.name).toBe('pago-error')
      expect(carrito.items).toHaveLength(1)
      wrapper.unmount()
    }
  })

  it('si la API no encuentra la sesión muestra «No encontramos ese pago» con su mensaje; sin session_id en la dirección no consulta', async () => {
    api.consultarRegreso.mockRejectedValue(
      Object.assign(new Error('No encontramos esa sesión de pago.'), { estado: 404 })
    )
    const { wrapper } = await montar('/pago/confirmado?session_id=cs_inexistente')
    expect(titulo(wrapper)).toBe('No encontramos ese pago')
    expect(wrapper.text()).toContain('No encontramos esa sesión de pago.')
    wrapper.unmount()

    api.consultarRegreso.mockClear()
    const { wrapper: sinSesion } = await montar('/pago/error')
    expect(api.consultarRegreso).not.toHaveBeenCalled()
    expect(titulo(sinSesion)).toBe('No encontramos ese pago')
    expect(sinSesion.text()).toContain('La dirección no trae la sesión de pago.')
  })

  it('si una consulta falla por la red mientras confirma, vuelve a preguntar a los 2 s, como promete la pantalla («se actualiza sola»)', async () => {
    api.consultarRegreso
      .mockResolvedValueOnce(CONFIRMANDO) // al llegar
      .mockRejectedValueOnce(new TypeError('Failed to fetch')) // a los 2 s se cae la red
      .mockResolvedValue(PAGADO) // lo que respondería la API después

    const { wrapper } = await montar('/pago/confirmado?session_id=cs_test_1')
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()
    expect(api.consultarRegreso).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Esta pantalla se actualiza sola.')

    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()
    expect(api.consultarRegreso).toHaveBeenCalledTimes(3)
    expect(titulo(wrapper)).toBe('Gracias por tu compra')
  })
})

describe('RegresoPagoView: intentar de nuevo', () => {
  const botonReintento = (wrapper) => wrapper.findAll('button').find((b) => b.text().includes('Intentar de nuevo'))

  it('sin el pedido en curso, vuelve al checkout', async () => {
    api.consultarRegreso.mockResolvedValue(RECHAZADA)
    const { wrapper, router } = await montar('/pago/error?session_id=cs_test_1')

    await botonReintento(wrapper).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/checkout')
    expect(api.abrirSesionPago).not.toHaveBeenCalled()
  })

  it('con el pedido en curso abre otra sesión del mismo pedido: interna con el router, externa con la pasarela', async () => {
    sessionStorage.setItem('pedido-en-curso', JSON.stringify({ id: 'ped-7', folio: 'C41D9A7E' }))
    // la sesión nueva queda abierta; el segundo regreso vuelve a ser uno rechazado
    api.consultarRegreso.mockResolvedValueOnce(RECHAZADA).mockResolvedValueOnce(ABIERTA).mockResolvedValueOnce(RECHAZADA)
    api.abrirSesionPago.mockResolvedValueOnce({ url: '/pago/pendiente?session_id=cs_test_2' })
      .mockResolvedValueOnce({ url: 'https://checkout.stripe.com/c/pay/cs_test_3' })
    const consola = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { wrapper, router } = await montar('/pago/error?session_id=cs_test_1')

    await botonReintento(wrapper).trigger('click')
    await flushPromises()
    expect(api.abrirSesionPago).toHaveBeenCalledWith('ped-7')
    expect(router.currentRoute.value.fullPath).toBe('/pago/pendiente?session_id=cs_test_2')

    const otra = await montar('/pago/error?session_id=cs_test_1')
    await botonReintento(otra.wrapper).trigger('click')
    await flushPromises()
    expect(consola).toHaveBeenCalledWith(expect.stringContaining('Not implemented: navigation'), undefined)
  })

  it('si no se puede abrir otra sesión, lo dice', async () => {
    sessionStorage.setItem('pedido-en-curso', JSON.stringify({ id: 'ped-7', folio: 'C41D9A7E' }))
    api.consultarRegreso.mockResolvedValue(RECHAZADA)
    api.abrirSesionPago.mockRejectedValueOnce(new Error('El pedido ya está pagado.')).mockRejectedValueOnce({})
    const { wrapper } = await montar('/pago/error?session_id=cs_test_1')

    await botonReintento(wrapper).trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('El pedido ya está pagado.')
    await botonReintento(wrapper).trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('No pudimos abrir otra sesión de pago.')
  })
})
