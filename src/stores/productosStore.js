import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Store de productos con caché en memoria.
 * Los productos se consultan a Supabase una sola vez por sesión
 * y se sirven desde memoria en navegaciones posteriores.
 * Esto elimina el cold start perceptible del tier gratuito (MJ8).
 */
export const useProductosStore = defineStore('productos', () => {
  const productos = ref([])
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref(false)

  /**
   * Carga productos desde Supabase o devuelve el caché existente.
   * @param {boolean} force - Forzar recarga ignorando caché
   * @returns {Promise<Array>} Lista de productos activos
   */
  async function fetchProductos(force = false) {
    // Si ya están cargados y no se fuerza, devolver caché
    if (loaded.value && !force) return productos.value

    loading.value = true
    error.value = false
    try {
      // supabase-js llega en su propio archivo: el primer pintado del sitio no espera su código
      const { getProductos } = await import('@/lib/supabaseClient')
      productos.value = await getProductos()
      loaded.value = true
      return productos.value
    } catch (err) {
      console.error('Error al cargar productos:', err)
      error.value = true
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Busca un producto por ID en el caché.
   * Si no hay caché, carga primero desde Supabase.
   * @param {string} id - UUID del producto
   * @returns {Promise<Object|null>} Producto encontrado o null
   */
  async function getById(id) {
    if (!loaded.value) {
      await fetchProductos()
    }
    return productos.value.find(p => p.id === id) || null
  }

  return {
    productos,
    loaded,
    loading,
    error,
    fetchProductos,
    getById
  }
})
