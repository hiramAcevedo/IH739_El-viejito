/**
 * El panel de administración: AdminView (dashboard y productos) y sus secciones de pedidos, envíos, pagos, legal y
 * usuarios. La API y Supabase van simulados; el token del panel sale de la sesión simulada de Supabase Auth.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'
import AdminView from '@/views/AdminView.vue'
import PanelPedidos from '@/components/panel/PanelPedidos.vue'
import PanelEnvios from '@/components/panel/PanelEnvios.vue'
import PanelPagos from '@/components/panel/PanelPagos.vue'
import PanelLegal from '@/components/panel/PanelLegal.vue'
import PanelUsuarios from '@/components/panel/PanelUsuarios.vue'

const api = vi.hoisted(() => ({
  MODO_EJEMPLO: false,
  resumenPanel: vi.fn(),
  listarPedidos: vi.fn(),
  cambiarEstadoPedido: vi.fn(),
  listarEnvios: vi.fn(),
  registrarGuia: vi.fn(),
  listarPagos: vi.fn(),
  eventosDePago: vi.fn(),
  leerTextoLegal: vi.fn(),
  guardarTextoLegal: vi.fn(),
  listarUsuarios: vi.fn(),
  crearUsuario: vi.fn(),
  cambiarUsuario: vi.fn(),
  borrarUsuario: vi.fn(),
  invitarUsuario: vi.fn()
}))
vi.mock('@/lib/api', () => api)

const db = vi.hoisted(() => ({
  supabase: { auth: { getSession: vi.fn(), signOut: vi.fn() } },
  getProductosAdmin: vi.fn(),
  createProducto: vi.fn(),
  updateProducto: vi.fn(),
  deleteProducto: vi.fn()
}))
vi.mock('@/lib/supabaseClient', () => db)

enableAutoUnmount(afterEach)

const TOKEN = 'token-del-panel'
const Vacia = { render: () => null }

beforeEach(() => {
  db.supabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: TOKEN } } })
  db.supabase.auth.signOut.mockResolvedValue({ error: null })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

async function montar(componente, { superadmin = true, nombre = 'Ana Pérez', stubs = {} } = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const auth = useAuthStore()
  auth.user = { id: 'u-1', email: 'ana@elviejito.mx' }
  auth.nombre = nombre
  auth.rol = superadmin ? 'superadmin' : 'admin'
  auth.isAdmin = true
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ['/', '/login', '/admin', '/terminos', '/privacidad'].map((path) => ({ path, component: Vacia }))
  })
  await router.push('/admin')
  await router.isReady()
  const wrapper = mount(componente, { global: { plugins: [pinia, router], stubs: { teleport: true, ...stubs } } })
  await flushPromises()
  return { wrapper, router, auth }
}

const boton = (wrapper, texto) => wrapper.findAll('button').find((b) => b.text().includes(texto))

describe('AdminView: dashboard y productos', () => {
  const PRODUCTOS = [
    { id: 'p-1', nombre: 'Tequila Blanco', tipo: 'blanco', precio: '349.99', activo: true, descripcion: 'Joven', imagen_url: 'tequila-blanco.webp' },
    { id: 'p-2', nombre: 'Tequila Extra', tipo: 'extra_añejo', precio: '900.00', activo: false, descripcion: null, imagen_url: null },
    { id: 'p-3', nombre: 'Edición especial', tipo: 'cristalino', precio: '1200', activo: true }
  ]
  const SIN_SECCIONES = { PanelPedidos: true, PanelEnvios: true, PanelPagos: true, PanelLegal: true, PanelUsuarios: true }
  const montarAdmin = (opciones = {}) => montar(AdminView, { stubs: SIN_SECCIONES, ...opciones })

  beforeEach(() => {
    db.getProductosAdmin.mockResolvedValue(PRODUCTOS)
    api.resumenPanel.mockResolvedValue({ pedidos: 12, por_cobrar: 3, envios_por_capturar: 2, usuarios: 4 })
  })

  it('el dashboard saluda con el nombre y el rol y muestra las cuentas de la API', async () => {
    const { wrapper } = await montarAdmin()

    expect(api.resumenPanel).toHaveBeenCalledWith(TOKEN)
    const texto = wrapper.text()
    expect(texto).toContain('Bienvenido, Ana Pérez · superadministrador')
    expect(texto).toContain('3 registrados')
    expect(texto).toContain('12 registrados · 3 por cobrar')
    expect(texto).toContain('2 guía por capturar')
    expect(texto).toContain('4 administradores')
  })

  it('un administrador no ve Usuarios; sin nombre saluda con el correo y sin resumen las cuentas esperan', async () => {
    api.resumenPanel.mockRejectedValue(new Error('sin red'))
    const { wrapper } = await montarAdmin({ superadmin: false, nombre: '' })

    expect(wrapper.text()).toContain('Bienvenido, ana@elviejito.mx · administrador')
    expect(wrapper.findAll('.tab-btn').map((b) => b.text())).not.toContain('Usuarios')
    expect(wrapper.findAll('.admin-card').map((c) => c.text())).toEqual([
      'Productos3 registrados', 'Pedidos…', 'Envíos…', 'LegalAviso de privacidad, términos y leyenda'
    ])
  })

  it('las pestañas y las tarjetas abren cada sección', async () => {
    const { wrapper } = await montarAdmin()
    const secciones = { Pedidos: PanelPedidos, Envíos: PanelEnvios, Pagos: PanelPagos, Legal: PanelLegal, Usuarios: PanelUsuarios }

    for (const [pestana, componente] of Object.entries(secciones)) {
      await boton(wrapper, pestana).trigger('click')
      expect(wrapper.findComponent(componente).exists()).toBe(true)
      expect(wrapper.find('.tab-btn.active').text()).toBe(pestana)
    }
    await boton(wrapper, 'Dashboard').trigger('click')
    for (const tarjeta of wrapper.findAll('.admin-card')) {
      await tarjeta.trigger('click')
      await boton(wrapper, 'Dashboard').trigger('click')
    }
    await wrapper.findAll('.admin-card')[0].trigger('click')
    expect(wrapper.find('.tab-btn.active').text()).toBe('Productos')
  })

  it('la tabla de productos muestra tipo, precio y estado', async () => {
    const { wrapper } = await montarAdmin()
    await boton(wrapper, 'Productos').trigger('click')

    const filas = wrapper.findAll('tbody tr').map((f) => f.findAll('td').map((c) => c.text()).slice(0, 4))
    expect(filas).toEqual([
      ['Tequila Blanco', 'Blanco', '$349.99', 'Activo'],
      ['Tequila Extra', 'Extra Añejo', '$900.00', 'Inactivo'],
      ['Edición especial', 'cristalino', '$1,200.00', 'Activo']
    ])
  })

  it('crear un producto lo guarda en Supabase y recarga la tabla', async () => {
    const { wrapper } = await montarAdmin()
    await boton(wrapper, 'Productos').trigger('click')
    await boton(wrapper, 'Nuevo producto').trigger('click')
    expect(wrapper.find('.modal-header h3').text()).toBe('Nuevo producto')

    await wrapper.find('input[placeholder="Nombre del producto"]').setValue('Tequila Cristalino')
    await wrapper.find('textarea').setValue('Filtrado')
    await wrapper.findAll('.modal-form select')[0].setValue('reposado')
    await wrapper.find('input[type="number"]').setValue(520)
    await wrapper.findAll('.modal-form select')[1].setValue('tequila-reposado.webp')
    await wrapper.find('.modal-form input[type="checkbox"]').setValue(false)
    await wrapper.find('.modal-form').trigger('submit')
    await flushPromises()

    expect(db.createProducto).toHaveBeenCalledWith({
      nombre: 'Tequila Cristalino', descripcion: 'Filtrado', tipo: 'reposado', precio: 520,
      imagen_url: 'tequila-reposado.webp', activo: false
    })
    expect(db.getProductosAdmin).toHaveBeenCalledTimes(2)
    expect(wrapper.find('.modal-form').exists()).toBe(false)
  })

  it('editar un producto llena el formulario y un error al guardar se muestra', async () => {
    const { wrapper } = await montarAdmin()
    await boton(wrapper, 'Productos').trigger('click')
    await wrapper.findAll('button[title="Editar"]')[1].trigger('click')

    expect(wrapper.find('.modal-header h3').text()).toBe('Editar producto')
    expect(wrapper.find('input[placeholder="Nombre del producto"]').element.value).toBe('Tequila Extra')
    expect(wrapper.findAll('.modal-form select')[1].element.value).toBe('tequila-blanco.webp')
    await wrapper.find('.modal-form').trigger('submit')
    await flushPromises()
    expect(db.updateProducto).toHaveBeenCalledWith('p-2', {
      nombre: 'Tequila Extra', descripcion: '', tipo: 'extra_añejo', precio: 900, imagen_url: 'tequila-blanco.webp', activo: false
    })

    await wrapper.findAll('button[title="Editar"]')[0].trigger('click')
    db.updateProducto.mockRejectedValueOnce(new Error('El precio no es válido'))
    await wrapper.find('.modal-form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.form-error').text()).toBe('El precio no es válido')

    db.updateProducto.mockRejectedValueOnce({})
    await wrapper.find('.modal-form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.form-error').text()).toBe('Error al guardar el producto')

    await boton(wrapper, 'Cancelar').trigger('click')
    expect(wrapper.find('.modal-form').exists()).toBe(false)
    await boton(wrapper, 'Nuevo producto').trigger('click')
    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.find('.modal-form').exists()).toBe(false)
  })

  it('activar o desactivar un producto y eliminarlo con confirmación', async () => {
    const { wrapper } = await montarAdmin()
    await boton(wrapper, 'Productos').trigger('click')

    await wrapper.find('button[title="Desactivar"]').trigger('click')
    await flushPromises()
    expect(db.updateProducto).toHaveBeenCalledWith('p-1', { activo: false })
    db.updateProducto.mockRejectedValueOnce(new Error('sin red'))
    await wrapper.find('button[title="Activar"]').trigger('click')
    await flushPromises()
    expect(console.error).toHaveBeenCalledWith('Error al cambiar estado:', expect.any(Error))

    await wrapper.findAll('button[title="Eliminar"]')[0].trigger('click')
    expect(wrapper.find('.modal-sm').text()).toContain('¿Eliminar Tequila Blanco?')
    await wrapper.find('.modal-sm .btn-secondary').trigger('click')
    expect(wrapper.find('.modal-sm').exists()).toBe(false)

    await wrapper.findAll('button[title="Eliminar"]')[0].trigger('click')
    await wrapper.find('.modal-sm .modal-overlay, .modal-overlay').trigger('click')
    expect(wrapper.find('.modal-sm').exists()).toBe(false)

    await wrapper.findAll('button[title="Eliminar"]')[0].trigger('click')
    db.deleteProducto.mockRejectedValueOnce(new Error('sin permiso'))
    await wrapper.find('.btn-danger-solid').trigger('click')
    await flushPromises()
    expect(console.error).toHaveBeenCalledWith('Error al eliminar:', expect.any(Error))

    await wrapper.find('.btn-danger-solid').trigger('click')
    await flushPromises()
    expect(db.deleteProducto).toHaveBeenLastCalledWith('p-1')
    expect(wrapper.find('.modal-sm').exists()).toBe(false)
  })

  it('si los productos no cargan, la tabla queda vacía y el error va a la consola', async () => {
    db.getProductosAdmin.mockRejectedValue(new Error('sin red'))
    const { wrapper } = await montarAdmin()
    await boton(wrapper, 'Productos').trigger('click')
    expect(wrapper.findAll('tbody tr')).toHaveLength(0)
    expect(console.error).toHaveBeenCalledWith('Error cargando productos:', expect.any(Error))
  })

  it('Salir cierra la sesión de Supabase y lleva a /login; si falla, se queda', async () => {
    const { wrapper, router } = await montarAdmin()
    db.supabase.auth.signOut.mockResolvedValueOnce({ error: { message: 'sin red' } })
    await boton(wrapper, 'Salir').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/admin')

    await boton(wrapper, 'Salir').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/login')
  })
})

describe('PanelPedidos', () => {
  const PEDIDOS = [
    { id: 'a', folio: 'AAA11111', creado: '2026-11-10T18:00:00Z', cliente_nombre: 'Rosa', cliente_email: 'rosa@ejemplo.com',
      total: '812.00', estado: 'pendiente', estado_pago: 'pagado', metodo_entrega: 'envio',
      lineas: [{ nombre: 'Blanco', cantidad: 2, subtotal: '700.00' }] },
    { id: 'b', folio: 'BBB22222', creado: '2026-11-12T18:00:00Z', cliente_nombre: 'Luis', cliente_email: 'luis@ejemplo.com',
      total: '500.00', estado: 'enviado', estado_pago: 'pendiente', metodo_entrega: 'recoger',
      lineas: [{ nombre: 'Reposado', cantidad: 1, subtotal: '431.03' }] }
  ]
  const folios = (wrapper) => wrapper.findAll('.folio').map((f) => f.text())

  beforeEach(() => {
    api.listarPedidos.mockResolvedValue(structuredClone(PEDIDOS))
  })

  it('la tabla lista los pedidos del más reciente al más antiguo y se puede invertir', async () => {
    const { wrapper } = await montar(PanelPedidos)

    expect(api.listarPedidos).toHaveBeenCalledWith(TOKEN)
    expect(wrapper.emitted('cargados')[0][0]).toHaveLength(2)
    expect(folios(wrapper)).toEqual(['#BBB22222', '#AAA11111'])
    expect(wrapper.text()).toContain('Recoger')
    await wrapper.find('.orden').trigger('click')
    expect(folios(wrapper)).toEqual(['#AAA11111', '#BBB22222'])
  })

  it('el filtro por estado y el aviso cuando no hay pedidos con ese estado', async () => {
    const { wrapper } = await montar(PanelPedidos)

    await boton(wrapper, 'Enviado').trigger('click')
    expect(folios(wrapper)).toEqual(['#BBB22222'])
    await boton(wrapper, 'Cancelado').trigger('click')
    expect(wrapper.text()).toContain('No hay pedidos con ese estado.')
    await boton(wrapper, 'Todos').trigger('click')
    expect(folios(wrapper)).toHaveLength(2)
  })

  it('el selector cambia el estado logístico con la API; si falla, avisa', async () => {
    api.cambiarEstadoPedido.mockResolvedValue({ estado: 'confirmado' })
    const { wrapper } = await montar(PanelPedidos)

    await wrapper.findAll('select')[1].setValue('confirmado')
    await flushPromises()
    expect(api.cambiarEstadoPedido).toHaveBeenCalledWith(TOKEN, 'a', 'confirmado')
    expect(wrapper.findAll('select')[1].element.value).toBe('confirmado')

    api.cambiarEstadoPedido.mockRejectedValueOnce(new Error('Ese cambio no está permitido.'))
    await wrapper.findAll('select')[0].setValue('entregado')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toBe('Ese cambio no está permitido.')
  })

  it('la vista de tarjetas muestra cliente, entrega y líneas, y cambia el estado igual', async () => {
    api.cambiarEstadoPedido.mockRejectedValueOnce({})
    const { wrapper } = await montar(PanelPedidos)
    await boton(wrapper, 'Tarjetas').trigger('click')
    expect(wrapper.find('table').exists()).toBe(false)

    const tarjetas = wrapper.findAll('.tarjeta')
    expect(tarjetas[0].text()).toContain('Luis · luis@ejemplo.com')
    expect(tarjetas[0].text()).toContain('Recoger en tienda')
    expect(tarjetas[1].text()).toContain('Envío a domicilio')
    expect(tarjetas[1].text()).toContain('Blanco ×2')
    await tarjetas[1].find('select').setValue('cancelado')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toBe('No pudimos cambiar el estado.')

    await boton(wrapper, 'Tabla').trigger('click')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('si la API no responde, muestra el error', async () => {
    api.listarPedidos.mockRejectedValueOnce(new Error('La API no respondió.')).mockRejectedValueOnce({})
    expect((await montar(PanelPedidos)).wrapper.find('[role="alert"]').text()).toBe('La API no respondió.')
    expect((await montar(PanelPedidos)).wrapper.find('[role="alert"]').text()).toBe('No pudimos cargar los pedidos.')
  })
})

describe('PanelEnvios', () => {
  const DIRECCION = { calle: 'Hidalgo 12', colonia: 'Centro', codigo_postal: '47730', ciudad: 'Tototlán', estado: 'Jalisco' }
  const ENVIOS = [
    { pedido_id: 'e1', folio: 'E1', estado: 'enviado', estado_pago: 'pagado', cliente_nombre: 'Rosa', direccion: DIRECCION,
      paqueteria: 'DHL', guia: '123', fecha_estimada: '2026-11-20', aviso: 'enviado' },
    { pedido_id: 'e2', folio: 'E2', estado: 'confirmado', estado_pago: 'pagado', cliente_nombre: 'Luis', direccion: DIRECCION,
      paqueteria: null, guia: null, fecha_estimada: null, aviso: null },
    { pedido_id: 'e3', folio: 'E3', estado: 'pendiente', estado_pago: 'pendiente', cliente_nombre: 'Eva', direccion: DIRECCION,
      paqueteria: null, guia: null, fecha_estimada: null, aviso: null }
  ]

  beforeEach(() => {
    api.listarEnvios.mockResolvedValue(structuredClone(ENVIOS))
  })

  it('cada envío con su dirección, su guía y el estado real del aviso por correo', async () => {
    const { wrapper } = await montar(PanelEnvios)
    const [conGuia, porCapturar, sinPago] = wrapper.findAll('.envio')

    expect(api.listarEnvios).toHaveBeenCalledWith(TOKEN)
    expect(conGuia.text()).toContain('Hidalgo 12, col. Centro, C. P. 47730')
    expect(conGuia.text()).toContain('20 de noviembre')
    expect(conGuia.find('.aviso-enviado').text()).toBe('enviado al cliente')
    expect(porCapturar.find('form').exists()).toBe(true)
    expect(sinPago.text()).toContain('La guía se captura cuando el pago esté confirmado.')
  })

  it('registrar la guía la manda a la API y el envío muestra el aviso en la cola', async () => {
    api.registrarGuia.mockImplementation(async (token, id, datos) => ({
      ...ENVIOS[1], ...datos, estado: 'enviado', aviso: 'en_cola'
    }))
    const { wrapper } = await montar(PanelEnvios)
    const forma = wrapper.find('.envio__form')

    await forma.find('select').setValue('Estafeta')
    await forma.find('input[inputmode="numeric"]').setValue(' 7701 ')
    await forma.find('input[type="date"]').setValue('2026-11-25')
    await forma.trigger('submit')
    await flushPromises()

    expect(api.registrarGuia).toHaveBeenCalledWith(TOKEN, 'e2', { paqueteria: 'Estafeta', guia: '7701', fecha_estimada: '2026-11-25' })
    expect(wrapper.findAll('.envio')[1].find('.aviso-en_cola').text()).toBe('en la cola de correos')
  })

  it('un aviso fallido lo dice, un estado desconocido se muestra tal cual y los errores se avisan', async () => {
    api.listarEnvios.mockResolvedValueOnce([{ ...ENVIOS[0], aviso: 'fallido' }, { ...ENVIOS[0], pedido_id: 'e9', aviso: 'raro' }])
    const { wrapper } = await montar(PanelEnvios)
    expect(wrapper.find('.aviso-fallido').text()).toBe('no salió; queda para reintentar')
    expect(wrapper.find('.aviso-raro').text()).toBe('raro')

    api.registrarGuia.mockRejectedValueOnce(new Error('La guía ya existe.'))
    const otro = await montar(PanelEnvios)
    await otro.wrapper.find('.envio__form').trigger('submit')
    await flushPromises()
    expect(otro.wrapper.find('[role="alert"]').text()).toBe('La guía ya existe.')

    api.listarEnvios.mockRejectedValueOnce(new Error('Sin conexión.')).mockRejectedValueOnce({})
    expect((await montar(PanelEnvios)).wrapper.find('[role="alert"]').text()).toBe('Sin conexión.')
    expect((await montar(PanelEnvios)).wrapper.find('[role="alert"]').text()).toBe('No pudimos cargar los envíos.')
  })
})

describe('PanelPagos', () => {
  const PAGOS = [
    { id: 'pg1', folio: 'AAA11111', creado: '2026-11-12T18:00:00Z', proveedor: 'stripe', referencia: 'cs_test_1', importe: '812.00', estado: 'pagado' },
    { id: 'pg2', folio: 'BBB22222', creado: '2026-11-11T18:00:00Z', proveedor: 'otra', referencia: 'ref_2', importe: '500.00', estado: 'expirado' }
  ]
  const EVENTOS = [
    { tipo: 'checkout.session.completed', recibido: '2026-11-12T18:01:00Z', clave: 'evt_1', repeticiones: 0 },
    { tipo: 'charge.succeeded', recibido: '2026-11-12T18:01:01Z', clave: 'evt_2', repeticiones: 1 },
    { tipo: 'payment_intent.succeeded', recibido: '2026-11-12T18:01:02Z', clave: 'evt_3', repeticiones: 3 }
  ]

  it('lista los intentos y abre el primero con sus avisos, marcando los repetidos', async () => {
    api.listarPagos.mockResolvedValue(PAGOS)
    api.eventosDePago.mockResolvedValue(EVENTOS)
    const { wrapper } = await montar(PanelPagos)

    expect(api.eventosDePago).toHaveBeenCalledWith(TOKEN, 'pg1')
    const filas = wrapper.findAll('tbody tr')
    expect(filas[0].text()).toContain('Stripe')
    expect(filas[1].text()).toContain('otra')
    expect(filas[1].text()).toContain('Expirado')
    expect(wrapper.find('.eventos h3').text()).toBe('Avisos de la pasarela · #AAA11111')
    const avisos = wrapper.findAll('.eventos__lista li')
    expect(avisos[0].classes()).not.toContain('duplicado')
    expect(avisos[1].text()).toContain('Llegó una vez más: no se aplicó otra vez')
    expect(avisos[2].text()).toContain('Llegó 3 veces más')
  })

  it('al elegir otro intento, con clic o con Enter, carga sus avisos', async () => {
    api.listarPagos.mockResolvedValue(PAGOS)
    api.eventosDePago.mockResolvedValueOnce(EVENTOS).mockResolvedValue([])
    const { wrapper } = await montar(PanelPagos)

    await wrapper.findAll('tbody tr')[1].trigger('click')
    await flushPromises()
    expect(api.eventosDePago).toHaveBeenLastCalledWith(TOKEN, 'pg2')
    expect(wrapper.find('.eventos').text()).toContain('Este intento todavía no recibe avisos.')
    expect(wrapper.findAll('tbody tr')[1].classes()).toContain('elegido')

    await wrapper.findAll('tbody tr')[0].trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(api.eventosDePago).toHaveBeenLastCalledWith(TOKEN, 'pg1')
  })

  it('sin intentos no abre nada; si la API falla, avisa', async () => {
    api.listarPagos.mockResolvedValueOnce([])
    const vacio = await montar(PanelPagos)
    expect(vacio.wrapper.find('.eventos').exists()).toBe(false)
    expect(api.eventosDePago).not.toHaveBeenCalled()

    api.listarPagos.mockRejectedValueOnce(new Error('Sin conexión.')).mockRejectedValueOnce({})
    expect((await montar(PanelPagos)).wrapper.find('[role="alert"]').text()).toBe('Sin conexión.')
    expect((await montar(PanelPagos)).wrapper.find('[role="alert"]').text()).toBe('No pudimos cargar los pagos.')
  })
})

describe('PanelLegal', () => {
  const TEXTOS = {
    terminos: { titulo: 'Términos de venta', contenido: 'Uno.\n\nDos.', actualizado: '2026-11-01T18:00:00Z' },
    leyenda: { titulo: 'Leyenda', contenido: 'Prohibida la venta a menores.', actualizado: '2026-11-02T18:00:00Z' }
  }

  beforeEach(() => {
    api.leerTextoLegal.mockImplementation(async (clave) => ({ ...TEXTOS[clave] }))
  })

  it('abre los términos con la liga a su página y la leyenda sin liga', async () => {
    const { wrapper } = await montar(PanelLegal)

    expect(api.leerTextoLegal).toHaveBeenCalledWith('terminos')
    expect(wrapper.find('input').element.value).toBe('Términos de venta')
    expect(wrapper.find('.editor__ver').attributes('href')).toBe('/terminos')
    expect(wrapper.find('textarea').attributes('rows')).toBe('12')

    await wrapper.findAll('[role="tab"]')[2].trigger('click')
    await flushPromises()
    expect(wrapper.find('textarea').element.value).toBe('Prohibida la venta a menores.')
    expect(wrapper.find('textarea').attributes('rows')).toBe('3')
    expect(wrapper.find('.editor__ver').exists()).toBe(false)
  })

  it('guardar manda el título y el texto con el token y avisa; un error se muestra', async () => {
    api.guardarTextoLegal.mockImplementation(async (token, clave, datos) => ({ ...datos, actualizado: '2026-11-18T18:00:00Z' }))
    const { wrapper } = await montar(PanelLegal)

    await wrapper.find('input').setValue('Términos y condiciones')
    await wrapper.find('textarea').setValue('Uno.\n\nDos.\n\nTres.')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(api.guardarTextoLegal).toHaveBeenCalledWith(TOKEN, 'terminos', { titulo: 'Términos y condiciones', contenido: 'Uno.\n\nDos.\n\nTres.' })
    expect(wrapper.find('.editor__ok').text()).toBe('Guardado. El sitio ya muestra el texto nuevo.')

    api.guardarTextoLegal.mockRejectedValueOnce(new Error('Falta el título.'))
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.panel-error').text()).toBe('Falta el título.')
  })
})

describe('PanelUsuarios', () => {
  const USUARIOS = [
    { id: 's', nombre: 'Dueño', email: 'dueno@elviejito.mx', rol: 'superadmin', estado: 'activo' },
    { id: 'a1', nombre: 'Ana', email: 'ana@elviejito.mx', rol: 'admin', estado: 'activo' },
    { id: 'a2', nombre: 'Beto', email: 'beto@elviejito.mx', rol: 'admin', estado: 'apagado' },
    { id: 'inv-1', nombre: 'Caro', email: 'caro@elviejito.mx', rol: 'admin', estado: 'invitado', vence: '2026-11-23T18:00:00Z',
      liga: '/admin/registro?invitacion=abc' }
  ]
  let portapapeles

  beforeEach(() => {
    api.listarUsuarios.mockResolvedValue(USUARIOS)
    portapapeles = { writeText: vi.fn(async () => {}) }
    Object.defineProperty(window.navigator, 'clipboard', { value: portapapeles, configurable: true })
  })
  afterEach(() => {
    delete window.navigator.clipboard
  })

  it('la lista distingue al superadministrador, las cuentas activas o apagadas y las invitaciones', async () => {
    const { wrapper } = await montar(PanelUsuarios)
    const filas = wrapper.findAll('tbody tr')

    expect(api.listarUsuarios).toHaveBeenCalledWith(TOKEN)
    expect(filas[0].text()).toContain('Tu cuenta')
    expect(filas[1].find('input[type="checkbox"]').element.checked).toBe(true)
    expect(filas[2].text()).toContain('Apagado')
    expect(filas[3].text()).toContain('Invitado')
    expect(filas[3].text()).toContain('vence el')
  })

  it('apagar, encender y borrar una cuenta pasan por la API y recargan la lista', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const { wrapper } = await montar(PanelUsuarios)

    await wrapper.findAll('tbody tr')[1].find('input[type="checkbox"]').trigger('change')
    await flushPromises()
    expect(api.cambiarUsuario).toHaveBeenCalledWith(TOKEN, 'a1', { estado: 'apagado' })
    await wrapper.findAll('tbody tr')[2].find('input[type="checkbox"]').trigger('change')
    await flushPromises()
    expect(api.cambiarUsuario).toHaveBeenLastCalledWith(TOKEN, 'a2', { estado: 'activo' })

    await boton(wrapper, 'Borrar').trigger('click')
    expect(api.borrarUsuario).not.toHaveBeenCalled()
    await boton(wrapper, 'Borrar').trigger('click')
    await flushPromises()
    expect(confirmar).toHaveBeenCalledWith('¿Borrar la cuenta de Ana?')
    expect(api.borrarUsuario).toHaveBeenCalledWith(TOKEN, 'a1')
    expect(api.listarUsuarios).toHaveBeenCalledTimes(4)
  })

  it('el alta directa crea la cuenta, limpia el formulario y lo cierra; un rechazo se muestra', async () => {
    const { wrapper } = await montar(PanelUsuarios)
    await boton(wrapper, 'Alta directa').trigger('click')
    const alta = wrapper.find('form.alta')

    await alta.find('input').setValue('Dora')
    await alta.find('input[type="email"]').setValue('dora@elviejito.mx')
    await alta.find('input[type="password"]').setValue('una-clave-larga')
    await alta.trigger('submit')
    await flushPromises()
    expect(api.crearUsuario).toHaveBeenCalledWith(TOKEN, { nombre: 'Dora', email: 'dora@elviejito.mx', contrasena: 'una-clave-larga' })
    expect(wrapper.find('form.alta').exists()).toBe(false)

    api.crearUsuario.mockRejectedValueOnce(new Error('Ya existe una cuenta con ese correo.'))
    await boton(wrapper, 'Alta directa').trigger('click')
    expect(wrapper.find('form.alta input').element.value).toBe('')
    await wrapper.find('form.alta').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toBe('Ya existe una cuenta con ese correo.')
  })

  it('la invitación genera la liga, que se copia completa; sin portapapeles queda a la vista', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      api.invitarUsuario.mockResolvedValue({ liga: '/admin/registro?invitacion=xyz', vence: '2026-11-23T18:00:00Z' })
      const { wrapper } = await montar(PanelUsuarios)
      const forma = wrapper.find('.invitar form')

      await forma.find('input').setValue('Eli')
      await forma.find('input[type="email"]').setValue('eli@elviejito.mx')
      await forma.trigger('submit')
      await flushPromises()
      expect(api.invitarUsuario).toHaveBeenCalledWith(TOKEN, { nombre: 'Eli', email: 'eli@elviejito.mx' })
      expect(wrapper.find('.liga code').text()).toBe('/admin/registro?invitacion=xyz')

      await wrapper.find('.liga button').trigger('click')
      await flushPromises()
      expect(portapapeles.writeText).toHaveBeenCalledWith(`${window.location.origin}/admin/registro?invitacion=xyz`)
      expect(wrapper.text()).toContain('Liga copiada.')
      vi.advanceTimersByTime(2000)
      await flushPromises()
      expect(wrapper.text()).not.toContain('Liga copiada.')

      portapapeles.writeText.mockRejectedValueOnce(new Error('sin permiso'))
      await boton(wrapper, 'Copiar liga').trigger('click')
      await flushPromises()
      expect(wrapper.text()).not.toContain('Liga copiada.')
    } finally {
      vi.useRealTimers()
    }
  })

  it('si la lista no carga, avisa', async () => {
    api.listarUsuarios.mockRejectedValueOnce(new Error('Sólo el superadministrador administra las cuentas del panel.'))
    const { wrapper } = await montar(PanelUsuarios)
    expect(wrapper.find('[role="alert"]').text()).toBe('Sólo el superadministrador administra las cuentas del panel.')
  })
})
