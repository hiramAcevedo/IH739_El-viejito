/**
 * La sesión del panel (authStore) contra Supabase Auth simulado: entrar, salir, restaurar la sesión y el token que va
 * a la API. Una cuenta que no está activa en usuarios_admin no entra, aunque Supabase la autentique.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

const supabase = vi.hoisted(() => {
  const consulta = {}
  consulta.select = vi.fn(() => consulta)
  consulta.eq = vi.fn(() => consulta)
  consulta.single = vi.fn()
  const cliente = {
    auth: { signInWithPassword: vi.fn(), signOut: vi.fn(), getUser: vi.fn(), getSession: vi.fn() },
    from: vi.fn(() => consulta)
  }
  return { consulta, cliente }
})
vi.mock('@/lib/supabaseClient', () => ({ supabase: supabase.cliente }))

const USUARIO = { id: 'u-1', email: 'ana@elviejito.mx' }
const ADMIN = { data: { id: 'u-1', nombre: 'Ana Pérez', rol: 'superadmin' }, error: null }
const SIN_FILA = { data: null, error: { code: 'PGRST116', message: 'no rows' } }

let auth
beforeEach(() => {
  setActivePinia(createPinia())
  auth = useAuthStore()
  supabase.cliente.auth.signOut.mockResolvedValue({ error: null })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('login', () => {
  it('con una cuenta activa en usuarios_admin entra con su nombre y su rol', async () => {
    supabase.cliente.auth.signInWithPassword.mockResolvedValue({ data: { user: USUARIO }, error: null })
    supabase.consulta.single.mockResolvedValue(ADMIN)

    expect(await auth.login('ana@elviejito.mx', 'clave')).toEqual({ success: true })

    expect(supabase.cliente.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'ana@elviejito.mx', password: 'clave' })
    expect(supabase.consulta.eq).toHaveBeenCalledWith('activo', true)
    expect([auth.user, auth.nombre, auth.rol, auth.isAdmin, auth.esSuperadmin, auth.loading]).toEqual([USUARIO, 'Ana Pérez', 'superadmin', true, true, false])
  })

  it('una contraseña equivocada regresa el mensaje de Supabase', async () => {
    supabase.cliente.auth.signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials' } })
    expect(await auth.login('ana@elviejito.mx', 'mala')).toEqual({ success: false, error: 'Invalid login credentials' })
    expect(auth.isAdmin).toBe(false)
  })

  it('una cuenta sin fila activa en usuarios_admin se cierra y no entra', async () => {
    supabase.cliente.auth.signInWithPassword.mockResolvedValue({ data: { user: USUARIO }, error: null })
    supabase.consulta.single.mockResolvedValue(SIN_FILA)

    expect(await auth.login('ana@elviejito.mx', 'clave')).toEqual({ success: false, error: 'Acceso restringido a administradores' })
    expect(supabase.cliente.auth.signOut).toHaveBeenCalled()
    expect(auth.user).toBeNull()
  })

  it('un error al revisar los permisos o una excepción no dejan entrar', async () => {
    supabase.cliente.auth.signInWithPassword.mockResolvedValue({ data: { user: USUARIO }, error: null })
    supabase.consulta.single.mockResolvedValueOnce({ data: null, error: { code: '42501', message: 'permission denied' } })
    expect(await auth.login('a', 'b')).toEqual({ success: false, error: 'Error al verificar permisos' })

    supabase.cliente.auth.signInWithPassword.mockRejectedValueOnce(new Error('Failed to fetch')).mockRejectedValueOnce({})
    expect(await auth.login('a', 'b')).toEqual({ success: false, error: 'Failed to fetch' })
    expect(await auth.login('a', 'b')).toEqual({ success: false, error: 'Login failed' })
    expect(auth.loading).toBe(false)
  })
})

describe('logout', () => {
  it('cierra la sesión y limpia el estado', async () => {
    auth.user = USUARIO
    auth.isAdmin = true
    expect(await auth.logout()).toEqual({ success: true })
    expect([auth.user, auth.isAdmin, auth.loading]).toEqual([null, false, false])
  })

  it('si Supabase falla o lanza, lo dice y conserva la sesión', async () => {
    auth.user = USUARIO
    supabase.cliente.auth.signOut.mockResolvedValueOnce({ error: { message: 'sin red' } })
      .mockRejectedValueOnce(new Error('Failed to fetch')).mockRejectedValueOnce({})
    expect(await auth.logout()).toEqual({ success: false, error: 'sin red' })
    expect(await auth.logout()).toEqual({ success: false, error: 'Failed to fetch' })
    expect(await auth.logout()).toEqual({ success: false, error: 'Logout failed' })
    expect(auth.user).toEqual(USUARIO)
  })
})

describe('checkAuth', () => {
  it('restaura la sesión de un administrador activo con su nombre y su rol', async () => {
    supabase.cliente.auth.getUser.mockResolvedValue({ data: { user: USUARIO }, error: null })
    supabase.consulta.single.mockResolvedValue({ data: { id: 'u-1', nombre: null, rol: null }, error: null })

    expect(await auth.checkAuth()).toBe(true)
    expect([auth.user, auth.isAdmin, auth.nombre, auth.rol]).toEqual([USUARIO, true, '', ''])
  })

  it('un error al revisar permisos o una excepción dejan la sesión cerrada', async () => {
    supabase.cliente.auth.getUser.mockResolvedValue({ data: { user: USUARIO }, error: null })
    supabase.consulta.single.mockResolvedValueOnce({ data: null, error: { code: '42501', message: 'permission denied' } })
    expect(await auth.checkAuth()).toBe(false)
    expect(auth.isAdmin).toBe(false)

    supabase.cliente.auth.getUser.mockRejectedValueOnce(new Error('Failed to fetch'))
    expect(await auth.checkAuth()).toBe(false)
    expect([auth.user, auth.isAdmin, auth.loading]).toEqual([null, false, false])
  })
})

describe('token', () => {
  it('es el access_token de la sesión de Supabase, o null sin sesión', async () => {
    supabase.cliente.auth.getSession.mockResolvedValueOnce({ data: { session: { access_token: 'jwt' } } })
      .mockResolvedValueOnce({ data: { session: null } })
    expect(await auth.token()).toBe('jwt')
    expect(await auth.token()).toBeNull()
  })
})
