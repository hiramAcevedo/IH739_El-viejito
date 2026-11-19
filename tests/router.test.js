import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'
import { useAuthStore } from '@/stores/authStore'

// Supabase simulado: la sesión (auth.getUser) y la consulta a usuarios_admin (from().select().eq().eq().single())
const supabase = vi.hoisted(() => {
  const consulta = {}
  consulta.select = vi.fn(() => consulta)
  consulta.eq = vi.fn(() => consulta)
  consulta.single = vi.fn()
  const cliente = {
    auth: { getUser: vi.fn(), getSession: vi.fn(), signOut: vi.fn() },
    from: vi.fn(() => consulta)
  }
  return { consulta, cliente }
})
vi.mock('@/lib/supabaseClient', () => ({
  supabase: supabase.cliente,
  getProductosAdmin: vi.fn(async () => []),
  createProducto: vi.fn(),
  updateProducto: vi.fn(),
  deleteProducto: vi.fn()
}))

const SIN_SESION = {
  data: { user: null },
  error: { name: 'AuthSessionMissingError', message: 'Auth session missing!' }
}
const SESION = (id, email) => ({ data: { user: { id, email } }, error: null })

beforeEach(async () => {
  setActivePinia(createPinia())
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {}) // jsdom no implementa el desplazamiento
  await router.push('/')
})

describe('guarda del router para el panel (/admin)', () => {
  it('sin sesión, /admin redirige a /login', async () => {
    supabase.cliente.auth.getUser.mockResolvedValue(SIN_SESION)

    await router.push('/admin')

    expect(router.currentRoute.value.fullPath).toBe('/login')
    expect(supabase.cliente.from).not.toHaveBeenCalled()
  })

  it('con la sesión de un administrador activo, /admin pasa', async () => {
    supabase.cliente.auth.getUser.mockResolvedValue(SESION('u-2', 'marcela@example.com'))
    supabase.consulta.single.mockResolvedValue({
      data: { id: 'u-2', nombre: 'Marcela López', rol: 'admin' },
      error: null
    })

    await router.push('/admin')

    expect(router.currentRoute.value.name).toBe('admin')
    expect(supabase.cliente.from).toHaveBeenCalledWith('usuarios_admin')
    expect(supabase.consulta.eq).toHaveBeenCalledWith('id', 'u-2')
    expect(supabase.consulta.eq).toHaveBeenCalledWith('activo', true)
    expect(useAuthStore().isAdmin).toBe(true)
  })

  it('con la sesión ya abierta, entrar a /login lleva al panel', async () => {
    supabase.cliente.auth.getUser.mockResolvedValue(SESION('u-2', 'marcela@example.com'))
    supabase.consulta.single.mockResolvedValue({
      data: { id: 'u-2', nombre: 'Marcela López', rol: 'admin' },
      error: null
    })
    useAuthStore().user = { id: 'u-2', email: 'marcela@example.com' }

    await router.push('/login')

    expect(router.currentRoute.value.fullPath).toBe('/admin')
  })

  it('una sesión de Supabase sin cuenta de administrador activa (apagada o que no es administrador) no entra a /admin', async () => {
    supabase.cliente.auth.getUser.mockResolvedValue(SESION('u-3', 'ventas@example.com'))
    // PostgREST responde PGRST116 cuando .single() no encuentra la fila: no hay administrador activo con ese id
    supabase.consulta.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' }
    })

    await router.push('/admin')

    expect(useAuthStore().isAdmin).toBe(false)
    expect(router.currentRoute.value.fullPath).toBe('/login')
  })
})

describe('las rutas del sitio', () => {
  it('cada ruta carga su vista y pone el título de la pestaña; una ruta desconocida lleva al inicio', async () => {
    supabase.cliente.auth.getUser.mockResolvedValue(SIN_SESION)
    const rutas = ['/nosotros', '/productos', '/productos/p-1', '/contacto', '/carrito', '/checkout', '/pago/confirmado',
      '/pago/pendiente', '/pago/error', '/seguimiento', '/seguimiento/ABC12345', '/privacidad', '/terminos', '/login',
      '/admin/registro', '/componentes', '/correos']
    for (const ruta of rutas) {
      await router.push(ruta)
      const actual = router.currentRoute.value
      expect(actual.path).toBe(ruta)
      expect(actual.matched[0].components.default).toBeTruthy()
      expect(document.title).toBe(actual.meta.title)
    }
    await router.push('/no-existe')
    expect(router.currentRoute.value.path).toBe('/')
    expect(document.title).toBe('Inicio | Tequila El Viejito')
  })

  it('al navegar sube al inicio de la página; con atrás o adelante regresa a donde estaba', () => {
    const subir = router.options.scrollBehavior
    expect(subir({}, {}, null)).toEqual({ top: 0, behavior: 'smooth' })
    expect(subir({}, {}, { left: 0, top: 420 })).toEqual({ left: 0, top: 420 })
  })
})
