/**
 * Las páginas públicas y el marco del sitio: App con la barra y el pie, inicio, nosotros, contacto, los avisos
 * legales, el inicio de sesión, el registro por invitación y el detalle del seguimiento. La API, Supabase y Swiper
 * van simulados.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import { useCarritoStore } from '@/stores/carritoStore'
import App from '@/App.vue'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'
import HomeView from '@/views/HomeView.vue'
import NosotrosView from '@/views/NosotrosView.vue'
import ContactoView from '@/views/ContactoView.vue'
import LegalView from '@/views/LegalView.vue'
import LoginView from '@/views/LoginView.vue'
import RegistroInvitacionView from '@/views/RegistroInvitacionView.vue'
import SeguimientoDetalleView from '@/views/SeguimientoDetalleView.vue'

const api = vi.hoisted(() => ({
  MODO_EJEMPLO: false,
  leerTextoLegal: vi.fn(),
  leerInvitacion: vi.fn(),
  aceptarInvitacion: vi.fn(),
  consultarSeguimientoFirmado: vi.fn(),
  listarProductos: vi.fn()
}))
vi.mock('@/lib/api', () => api)
const db = vi.hoisted(() => ({ supabase: { auth: { signOut: vi.fn() } } }))
vi.mock('@/lib/supabaseClient', () => db)

// Swiper toca el DOM real; aquí basta con saber con qué opciones se arma
const swiper = vi.hoisted(() => ({ instancias: [] }))
vi.mock('swiper', () => ({
  default: vi.fn(function (selector, opciones) {
    this.selector = selector
    this.opciones = opciones
    this.destroy = vi.fn()
    swiper.instancias.push(this)
  })
}))
vi.mock('swiper/modules', () => ({ Navigation: {}, Pagination: {}, Autoplay: {} }))
vi.mock('swiper/vue', async () => {
  const { h } = await import('vue')
  const conRanura = (clase) => ({ setup: (_, { slots }) => () => h('div', { class: clase }, slots.default?.()) })
  return { Swiper: conRanura('carrusel'), SwiperSlide: conRanura('carrusel__slide') }
})

enableAutoUnmount(afterEach)
// si una prueba con temporizadores falsos se corta, las siguientes no los heredan
afterEach(() => vi.useRealTimers())

const Vacia = { render: () => null }
const RUTAS = [
  { path: '/', component: Vacia },
  { path: '/admin', component: Vacia },
  { path: '/login', component: Vacia },
  { path: '/admin/registro', component: Vacia },
  { path: '/productos', component: Vacia },
  { path: '/productos/:id', name: 'producto-detalle', component: Vacia },
  { path: '/privacidad', component: Vacia, meta: { clave: 'privacidad' } },
  { path: '/terminos', component: Vacia, meta: { clave: 'terminos' } },
  { path: '/seguimiento', component: Vacia },
  { path: '/seguimiento/:folio', component: Vacia },
  { path: '/:resto(.*)*', component: Vacia }
]

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  swiper.instancias.length = 0
  setActivePinia(createPinia())
  api.leerTextoLegal.mockResolvedValue({ titulo: 'Leyenda', contenido: 'Leyenda desde el panel.' })
})

// inicio pide la foto del hero, la de historia y el carrusel después del primer pintado, y Swiper y supabase-js llegan
// con import(): se espera un cuadro y luego a que terminen esas cargas
async function esperarCarga() {
  await new Promise((listo) => requestAnimationFrame(() => setTimeout(listo, 0)))
  for (let i = 0; i < 2; i++) {
    await vi.dynamicImportSettled()
    await flushPromises()
  }
}

async function montar(componente, ruta = '/', opciones = {}) {
  const router = createRouter({ history: createMemoryHistory(), routes: RUTAS })
  await router.push(ruta)
  await router.isReady()
  const wrapper = mount(componente, { global: { plugins: [router] }, ...opciones })
  await esperarCarga()
  return { wrapper, router }
}

describe('App, NavBar y AppFooter', () => {
  it('el marco lleva la barra, la vista, el pie con la leyenda del panel y el botón de WhatsApp', async () => {
    const { wrapper } = await montar(App)
    expect(wrapper.findComponent(NavBar).exists()).toBe(true)
    expect(wrapper.find('.footer-leyenda').text()).toBe('Leyenda desde el panel.')
    expect(api.leerTextoLegal).toHaveBeenCalledWith('leyenda')
    expect(wrapper.find('a.whatsapp-float').attributes('href')).toBe('https://wa.me/5213312345678')
    expect(wrapper.text()).toContain('Email: contacto@tequilaelviejito.shop')
    expect(wrapper.text()).not.toContain('elviejito.com')
  })

  it('en el servidor de desarrollo con datos de ejemplo, el marco lleva la marca de ejemplo', async () => {
    vi.stubEnv('VITE_API_EJEMPLO', '1')
    vi.resetModules()
    const { default: AppDeEjemplo } = await import('@/App.vue')
    const { wrapper } = await montar(AppDeEjemplo)
    await vi.dynamicImportSettled()
    await flushPromises()
    expect(wrapper.find('.aviso-ejemplo').text()).toBe('Datos de ejemplo')
  })

  it('el botón de WhatsApp sale en las páginas del comprador y no en el panel ni en su inicio de sesión', async () => {
    for (const [ruta, sale] of [['/productos', true], ['/login', false], ['/admin', false], ['/admin/registro', false]]) {
      const { wrapper } = await montar(App, ruta)
      expect(wrapper.find('a.whatsapp-float').exists(), ruta).toBe(sale)
      wrapper.unmount()
    }
  })

  it('la barra marca su enlace también en las rutas que cuelgan de él', async () => {
    const activos = async (ruta) => {
      const { wrapper } = await montar(NavBar, ruta)
      const nombres = wrapper.findAll('.navbar__link--active').map((l) => l.text())
      wrapper.unmount()
      return nombres
    }
    expect(await activos('/seguimiento')).toEqual(['Rastrear pedido'])
    expect(await activos('/seguimiento/ABC12345')).toEqual(['Rastrear pedido'])
    expect(await activos('/productos/p-1')).toEqual(['Productos'])
    expect(await activos('/')).toEqual(['Inicio'])
  })

  it('si la API no da la leyenda, el pie conserva la que exige la venta a mayores', async () => {
    api.leerTextoLegal.mockRejectedValue(new Error('sin red'))
    const { wrapper } = await montar(AppFooter)
    expect(wrapper.find('.footer-leyenda').text()).toBe('Prohibida la venta a menores de edad.')
  })

  it('la barra abre y cierra el menú, cuenta el carrito y se marca al desplazarse', async () => {
    const { wrapper } = await montar(NavBar)
    const nav = wrapper.find('nav')
    expect(wrapper.find('.navbar__cart-badge').exists()).toBe(false)
    expect(wrapper.findAll('.navbar__link').map((l) => l.text())).toEqual(['Inicio', 'Nosotros', 'Productos', 'Contacto', 'Rastrear pedido'])

    await wrapper.find('.navbar__burger').trigger('click')
    expect(nav.classes()).toContain('navbar--open')
    await wrapper.findAll('.navbar__link')[2].trigger('click')
    expect(nav.classes()).not.toContain('navbar--open')
    await wrapper.find('.navbar__burger').trigger('click')
    await wrapper.find('.navbar__logo').trigger('click')
    expect(nav.classes()).not.toContain('navbar--open')

    useCarritoStore().agregarProducto({ id: 'p-1', nombre: 'Blanco', imagen_url: null })
    await flushPromises()
    expect(wrapper.find('.navbar__cart-badge').text()).toBe('1')

    window.scrollY = 120
    window.dispatchEvent(new Event('scroll'))
    await flushPromises()
    expect(nav.classes()).toContain('navbar--scrolled')
    window.scrollY = 0
    window.dispatchEvent(new Event('scroll'))
    await flushPromises()
    expect(nav.classes()).not.toContain('navbar--scrolled')
  })
})

describe('HomeView', () => {
  const PRODUCTOS = [
    { id: 'p-1', nombre: 'Blanco', precio: '320.00', imagen_url: 'tequila-blanco.webp' },
    { id: 'p-2', nombre: 'Reposado', precio: '450.00', imagen_url: 'tequila-reposado.webp' },
    { id: 'p-3', nombre: 'Añejo', precio: '560.00', imagen_url: 'tequila-anejo.webp' },
    { id: 'p-4', nombre: 'Extra', precio: '900.00', imagen_url: null }
  ]

  it('el carrusel muestra los productos con su precio y su liga, y se arma con Swiper', async () => {
    api.listarProductos.mockResolvedValue(PRODUCTOS)
    const { wrapper } = await montar(HomeView)

    expect(wrapper.text()).toContain('$320.00')
    expect(wrapper.find('a[href="/productos/p-4"]').exists()).toBe(true)
    expect(swiper.instancias).toHaveLength(1)
    expect(swiper.instancias[0].selector).toBe('.product-swiper')
    expect(swiper.instancias[0].opciones.loop).toBe(true)
    expect(swiper.instancias[0].opciones.breakpoints[1024].slidesPerView).toBe(3)
  })

  it('sin productos no arma el carrusel; con pocos, no da la vuelta', async () => {
    api.listarProductos.mockResolvedValue([])
    const vacio = await montar(HomeView)
    expect(swiper.instancias).toHaveLength(0)
    vacio.wrapper.unmount()

    setActivePinia(createPinia())
    api.listarProductos.mockResolvedValue(PRODUCTOS.slice(0, 2))
    await montar(HomeView)
    expect(swiper.instancias[0].opciones.loop).toBe(false)
    expect(swiper.instancias[0].opciones.breakpoints[1024].slidesPerView).toBe(2)
  })

  it('si se sale de la página antes de que llegue Swiper, el carrusel ya no se arma', async () => {
    api.listarProductos.mockResolvedValue(PRODUCTOS)
    const router = createRouter({ history: createMemoryHistory(), routes: RUTAS })
    await router.push('/')
    await router.isReady()
    mount(HomeView, { global: { plugins: [router] } }).unmount()
    await esperarCarga()
    expect(swiper.instancias).toHaveLength(0)
  })

  it('el título se pinta primero: la foto del hero, la de historia y el carrusel llegan después', async () => {
    api.listarProductos.mockResolvedValue(PRODUCTOS)
    const router = createRouter({ history: createMemoryHistory(), routes: RUTAS })
    await router.push('/')
    await router.isReady()
    const wrapper = mount(HomeView, { global: { plugins: [router] } })

    expect(wrapper.find('.hero__title').exists()).toBe(true)
    expect(wrapper.find('.hero').classes()).not.toContain('hero--foto')
    expect(wrapper.find('.welcome__real-img').attributes('src')).toBeUndefined()
    expect(api.listarProductos).not.toHaveBeenCalled()

    await esperarCarga()
    expect(wrapper.find('.hero').classes()).toContain('hero--foto')
    expect(wrapper.find('.welcome__real-img').attributes('src')).toBeTruthy()
    expect(swiper.instancias).toHaveLength(1)
  })

  it('al salir de la página, el carrusel se destruye', async () => {
    api.listarProductos.mockResolvedValue(PRODUCTOS)
    const { wrapper } = await montar(HomeView)
    wrapper.unmount()
    expect(swiper.instancias[0].destroy).toHaveBeenCalledWith(true, true)
  })
})

describe('NosotrosView', () => {
  it('cuenta el proceso en cinco pasos y la galería en cuatro imágenes', async () => {
    const { wrapper } = await montar(NosotrosView)
    expect(wrapper.findAll('.proceso-step')).toHaveLength(5)
    expect(wrapper.text()).toContain('Destilación')
    expect(wrapper.findAll('.carrusel__slide')).toHaveLength(4)
  })
})

describe('ContactoView', () => {
  it('sin datos marca los tres campos; con datos válidos simula el envío y limpia el formulario', async () => {
    const { wrapper } = await montar(ContactoView)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(wrapper.findAll('.error-msg').map((e) => e.text())).toEqual([
        'El nombre es obligatorio', 'Ingresa un correo válido', 'El mensaje no puede estar vacío'
      ])

      await wrapper.find('input[type="text"], input:not([type="email"])').setValue('Rosa')
      await wrapper.find('input[type="email"]').setValue('rosa@ejemplo.com')
      await wrapper.find('textarea').setValue('¿Hacen envíos a Guadalajara?')
      await wrapper.find('form').trigger('submit')
      await flushPromises()
      expect(wrapper.find('.submit-btn').attributes('disabled')).toBeDefined()

      vi.advanceTimersByTime(1500)
      await flushPromises()
      expect(wrapper.find('.success-msg').exists()).toBe(true)
      expect(wrapper.find('textarea').element.value).toBe('')
      expect(wrapper.findAll('.error-msg')).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('LegalView', () => {
  it('lee el aviso de la ruta, lo parte en párrafos y pone el título de la pestaña', async () => {
    api.leerTextoLegal.mockResolvedValue({ titulo: 'Aviso de privacidad', contenido: 'Primero.\n\nSegundo.\n  \nTercero.', actualizado: '2026-11-01T18:00:00Z' })
    const { wrapper } = await montar(LegalView, '/privacidad')

    expect(api.leerTextoLegal).toHaveBeenCalledWith('privacidad')
    expect(wrapper.findAll('p.legal__texto').map((p) => p.text())).toEqual(expect.arrayContaining(['Primero.', 'Segundo.', 'Tercero.']))
    expect(document.title).toBe('Aviso de privacidad | Tequila El Viejito')
  })

  it('si la API no responde, lo dice; en una ruta sin aviso no pide nada', async () => {
    api.leerTextoLegal.mockRejectedValue(new Error('sin red'))
    const { wrapper } = await montar(LegalView, '/terminos')
    expect(wrapper.text()).toContain('No pudimos cargar este aviso. Intenta de nuevo en un momento.')

    api.leerTextoLegal.mockClear()
    const sinClave = await montar(LegalView, '/otra')
    expect(sinClave.wrapper.text()).toContain('Cargando…')
    expect(api.leerTextoLegal).not.toHaveBeenCalled()
  })
})

describe('LoginView', () => {
  async function montarLogin() {
    const montado = await montar(LoginView, '/login')
    const auth = useAuthStore()
    const llenar = async (correo, clave) => {
      await montado.wrapper.find('input[type="email"]').setValue(correo)
      await montado.wrapper.find('input[type="password"]').setValue(clave)
      await montado.wrapper.find('form').trigger('submit')
      await flushPromises()
    }
    return { ...montado, auth, llenar }
  }

  it('sin correo o contraseña pide completar los campos', async () => {
    const { wrapper, llenar } = await montarLogin()
    await llenar('', '')
    expect(wrapper.find('.error-message').text()).toBe('Por favor completa todos los campos')
  })

  it('con una cuenta de administrador entra al panel', async () => {
    const { auth, router, llenar } = await montarLogin()
    vi.spyOn(auth, 'login').mockImplementation(async () => {
      auth.isAdmin = true
      return { success: true }
    })
    await llenar('ana@elviejito.mx', 'clave')
    expect(auth.login).toHaveBeenCalledWith('ana@elviejito.mx', 'clave')
    expect(router.currentRoute.value.path).toBe('/admin')
  })

  it('una cuenta sin permisos se cierra; un rechazo muestra su razón o una genérica', async () => {
    const { wrapper, auth, router, llenar } = await montarLogin()
    vi.spyOn(auth, 'logout').mockResolvedValue({ success: true })
    vi.spyOn(auth, 'login').mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: 'Invalid login credentials' })
      .mockResolvedValueOnce({ success: false })

    await llenar('ventas@elviejito.mx', 'clave')
    expect(wrapper.find('.error-message').text()).toBe('No tienes permisos de administrador')
    expect(auth.logout).toHaveBeenCalled()
    await llenar('ana@elviejito.mx', 'mala')
    expect(wrapper.find('.error-message').text()).toBe('Invalid login credentials')
    await llenar('ana@elviejito.mx', 'mala')
    expect(wrapper.find('.error-message').text()).toBe('Error al iniciar sesión. Intenta nuevamente.')
    expect(router.currentRoute.value.path).toBe('/login')
  })
})

describe('RegistroInvitacionView', () => {
  const INVITACION = { nombre: 'Caro Ruiz', email: 'caro@elviejito.mx', vence: '2026-11-23T18:00:00Z' }

  async function llenar(wrapper, clave, repetida) {
    const claves = wrapper.findAll('input[type="password"]')
    await claves[0].setValue(clave)
    await claves[1].setValue(repetida)
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }

  it('con una liga válida muestra el formulario con el nombre y el correo de la invitación', async () => {
    api.leerInvitacion.mockResolvedValue(INVITACION)
    const { wrapper } = await montar(RegistroInvitacionView, '/admin/registro?invitacion=abc')
    expect(api.leerInvitacion).toHaveBeenCalledWith('abc')
    expect(wrapper.find('input[autocomplete="name"]').element.value).toBe('Caro Ruiz')
    expect(wrapper.find('input[readonly]').element.value).toBe('caro@elviejito.mx')
  })

  it('revisa la contraseña antes de mandarla y crea la cuenta; un rechazo de la API se muestra', async () => {
    api.leerInvitacion.mockResolvedValue(INVITACION)
    api.aceptarInvitacion.mockRejectedValueOnce(new Error('La invitación ya se usó o venció.')).mockResolvedValueOnce({})
    const { wrapper } = await montar(RegistroInvitacionView, '/admin/registro?invitacion=abc')

    await llenar(wrapper, 'corta', 'corta')
    expect(wrapper.find('[role="alert"]').text()).toBe('Usa al menos 10 caracteres.')
    await llenar(wrapper, 'una-clave-larga', 'otra-clave-larga')
    expect(wrapper.find('[role="alert"]').text()).toBe('Las contraseñas no coinciden.')
    await llenar(wrapper, 'una-clave-larga', 'una-clave-larga')
    expect(wrapper.find('[role="alert"]').text()).toBe('La invitación ya se usó o venció.')
    await wrapper.find('input[autocomplete="name"]').setValue('  Carolina Ruiz ')
    await llenar(wrapper, 'una-clave-larga', 'una-clave-larga')
    expect(api.aceptarInvitacion).toHaveBeenLastCalledWith('abc', { nombre: 'Carolina Ruiz', contrasena: 'una-clave-larga' })
    expect(wrapper.text()).toContain('Tu cuenta quedó lista')
  })

  it('sin invitación en la liga, o con una vencida, lo dice', async () => {
    api.leerInvitacion.mockRejectedValue(new Error('La invitación ya se usó o venció. Pide una nueva a quien te invitó.'))
    const { wrapper } = await montar(RegistroInvitacionView, '/admin/registro')
    expect(api.leerInvitacion).toHaveBeenCalledWith('')
    expect(wrapper.find('h1').text()).toBe('Invitación no válida')
  })
})

describe('SeguimientoDetalleView', () => {
  const PEDIDO = {
    folio: 'ABC12345', estado_pago: 'pagado', metodo_entrega: 'envio',
    historial: [{ estado: 'pagado', fecha: '2026-11-10T18:00:00Z' }, { estado: 'enviado', fecha: '2026-11-11T18:00:00Z' }],
    envio_info: { paqueteria: 'Estafeta', guia: 'EST123', fecha_estimada: '2026-11-14' },
    lineas: [{ nombre: 'Blanco', cantidad: 1, subtotal: '320.00' }], subtotal: '320.00', iva: '51.20', envio: '0.00', total: '371.20'
  }
  const pasos = (wrapper) => wrapper.findAll('.linea__etiqueta').map((e) => e.text())

  it('con la liga firmada del correo pide el pedido a la API y muestra la línea, la guía y la entrega estimada', async () => {
    api.consultarSeguimientoFirmado.mockResolvedValue(PEDIDO)
    const { wrapper } = await montar(SeguimientoDetalleView, '/seguimiento/abc12345?firma=f1rm4')

    expect(api.consultarSeguimientoFirmado).toHaveBeenCalledWith('ABC12345', 'f1rm4')
    expect(wrapper.find('.detalle__titulo').text()).toBe('Pedido #ABC12345')
    expect(wrapper.find('.detalle__guia').text()).toBe('Guía EST123')
    expect(pasos(wrapper)).toEqual(['Pagado', 'Confirmado', 'Enviado', 'Entrega estimada'])
    // el panel registró la guía desde pagado: Confirmado no queda hueco entre dos etapas hechas, y no lleva fecha
    const hechos = wrapper.findAll('.linea__paso').map((p) => [p.classes().includes('hecho'), p.find('time').exists()])
    expect(hechos).toEqual([[true, true], [true, false], [true, true], [false, true]])
  })

  it('el pedido que ya se buscó sale de la sesión del navegador, sin otra consulta', async () => {
    const recoger = { ...PEDIDO, metodo_entrega: 'recoger', envio_info: null,
      historial: [...PEDIDO.historial, { estado: 'entregado', fecha: '2026-11-12T18:00:00Z' }] }
    sessionStorage.setItem('seguimiento-ABC12345', JSON.stringify(recoger))
    const { wrapper } = await montar(SeguimientoDetalleView, '/seguimiento/ABC12345')

    expect(api.consultarSeguimientoFirmado).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Lo recoges en la tienda de Tototlán, Jalisco.')
    expect(pasos(wrapper)).toEqual(['Pagado', 'Confirmado', 'Enviado', 'Entregado'])
  })

  it('sin firma ni búsqueda previa pide el correo y el folio; una firma inválida muestra la razón', async () => {
    const sinFirma = await montar(SeguimientoDetalleView, '/seguimiento/ABC12345')
    expect(sinFirma.wrapper.text()).toContain('Para ver un pedido escribe el correo de tu compra y el folio.')

    api.consultarSeguimientoFirmado.mockRejectedValue(new Error('La liga no es válida.'))
    const mala = await montar(SeguimientoDetalleView, '/seguimiento/ABC12345?firma=mala')
    expect(mala.wrapper.find('.detalle__texto').text()).toBe('La liga no es válida.')
  })
})
