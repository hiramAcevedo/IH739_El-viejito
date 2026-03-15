import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const loading = ref(false)
  const isAdmin = ref(false)

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
        .single()

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Admin check error:', adminError.message)
        return { success: false, error: 'Error al verificar permisos' }
      }

      if (adminData) {
        isAdmin.value = true
      }

      user.value = data.user
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
    try {
      loading.value = true

      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        user.value = null
        isAdmin.value = false
        return false
      }

      user.value = data.user

      // Check admin status
      const { data: adminData, error: adminError } = await supabase
        .from('usuarios_admin')
        .select('id, nombre, rol')
        .eq('id', data.user.id)
        .single()

      if (adminError && adminError.code !== 'PGRST116') {
        console.error('Admin check error:', adminError.message)
        isAdmin.value = false
        return false
      }

      isAdmin.value = !!adminData
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

  return {
    // State
    user,
    loading,
    isAdmin,
    // Actions
    login,
    logout,
    checkAuth
  }
})
