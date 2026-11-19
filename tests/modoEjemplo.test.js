/**
 * El modo de ejemplo del servidor de desarrollo (VITE_API_EJEMPLO=1): la sesión del panel no toca Supabase.
 * Aquí se simula que el modo está encendido; en el build de producción MODO_EJEMPLO siempre es false.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/authStore'

const supabase = vi.hoisted(() => ({ auth: { signOut: vi.fn(), getUser: vi.fn(), getSession: vi.fn() } }))
vi.mock('@/lib/supabaseClient', () => ({ supabase }))
vi.mock('@/lib/api', () => ({ MODO_EJEMPLO: true }))

beforeEach(() => setActivePinia(createPinia()))

describe('authStore en modo de ejemplo', () => {
  it('entra con la sesión de ejemplo, da un token de ejemplo y sale sin llamar a Supabase', async () => {
    const auth = useAuthStore()

    expect(await auth.checkAuth()).toBe(true)
    expect([auth.user.email, auth.nombre, auth.esSuperadmin]).toEqual(['hiram@example.com', 'Hiram Acevedo', true])
    expect(await auth.token()).toBe('token-de-ejemplo')
    expect(await auth.logout()).toEqual({ success: true })
    expect([auth.user, auth.isAdmin]).toEqual([null, false])
    expect(supabase.auth.getUser).not.toHaveBeenCalled()
    expect(supabase.auth.signOut).not.toHaveBeenCalled()
    expect(supabase.auth.getSession).not.toHaveBeenCalled()
  })
})
