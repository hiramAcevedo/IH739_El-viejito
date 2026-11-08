import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { MODO_EJEMPLO } from '@/lib/api'

/**
 * Sesión de ejemplo del panel: sólo existe en el servidor de desarrollo con VITE_API_EJEMPLO=1 (actividad 3.2).
 * La sesión real es la de Supabase Auth, y en cada operación la API valida el token, la cuenta activa y el rol.
 */
const SESION_EJEMPLO = {
  user: { id: 'u-1', email: 'hiram@example.com' },
  nombre: 'Hiram Acevedo',
  rol: 'superadmin'
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const loading = ref(false)
  const isAdmin = ref(false)
  const nombre = ref('')
  const rol = ref('')
  const esSuperadmin = computed(() => rol.value === 'superadmin')

  /**
   * Login with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function login(email, password) {
    try {
      loading.value = true
      isAdmin.value = false

      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Auth error:', error.message)
        return { success: false, error: error.message }
      }

      // Check if user exists in usuarios_admin table
      // La tabla usuarios_admin usa "id" como PK que referencia auth.users(id)
      const { data: adminData, error: adminError } = await supabase
        .from('usuarios_admin')
        .select('id, nombre, rol')
        .eq('id', data.user.id)
        .eq('activo', true)
        .single()

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Admin check error:', adminError.message)
        return { success: false, error: 'Error al verificar permisos' }
      }

      if (!adminData) {
        // Usuario autenticado pero no es admin activo: cerrar sesion
        await supabase.auth.signOut()
        return { success: false, error: 'Acceso restringido a administradores' }
      }

      isAdmin.value = true
      user.value = data.user
      nombre.value = adminData.nombre
      rol.value = adminData.rol
      return { success: true }
    } catch (err) {
      console.error('Login error:', err)
      return { success: false, error: err.message || 'Login failed' }
    } finally {
      loading.value = false
    }
  }

  /**
   * Logout user
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async function logout() {
    if (MODO_EJEMPLO) {
      user.value = null
      isAdmin.value = false
      return { success: true }
    }
    try {
      loading.value = true

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Logout error:', error.message)
        return { success: false, error: error.message }
      }

      user.value = null
      isAdmin.value = false
      return { success: true }
    } catch (err) {
      console.error('Logout error:', err)
      return { success: false, error: err.message || 'Logout failed' }
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if user is authenticated
   * Restores session from localStorage if available
   * @returns {Promise<boolean>}
   */
  async function checkAuth() {
    if (MODO_EJEMPLO) {
      user.value = SESION_EJEMPLO.user
      nombre.value = SESION_EJEMPLO.nombre
      rol.value = SESION_EJEMPLO.rol
      isAdmin.value = true
      return true
    }
    try {
      loading.value = true

      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        user.value = null
        isAdmin.value = false
        return false
      }

      user.value = data.user

      // Check admin status (MJ2: solo admins activos)
      const { data: adminData, error: adminError } = await supabase
        .from('usuarios_admin')
        .select('id, nombre, rol')
        .eq('id', data.user.id)
        .eq('activo', true)
        .single()

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Admin check error:', adminError.message)
        isAdmin.value = false
        return false
      }

      isAdmin.value = !!adminData
      nombre.value = adminData?.nombre || ''
      rol.value = adminData?.rol || ''
      return true
    } catch (err) {
      console.error('CheckAuth error:', err)
      user.value = null
      isAdmin.value = false
      return false
    } finally {
      loading.value = false
    }
  }

  /** El token que el panel manda a la API en cada operación. */
  async function token() {
    if (MODO_EJEMPLO) return 'token-de-ejemplo'
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || null
  }

  return {
    // State
    user,
    loading,
    isAdmin,
    nombre,
    rol,
    esSuperadmin,
    token,
    // Actions
    login,
    logout,
    checkAuth
  }
})
