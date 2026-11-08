import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'carrito-el-viejito'

function cargarDesdeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // un carrito guardado antes del sprint 4 trae el precio de cada línea: se descarta, ya no lo decide el navegador
    return raw ? JSON.parse(raw).map(({ precio, ...item }) => item) : []
  } catch {
    return []
  }
}

export const useCarritoStore = defineStore('carrito', () => {
  // ── Estado ──
  const items = ref(cargarDesdeStorage())

  // ── Getters ──
  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.cantidad, 0)
  )

  // ── Acciones ──
  function agregarProducto(producto) {
    const existente = items.value.find(i => i.id === producto.id)
    if (existente) {
      existente.cantidad++
    } else {
      // sin precio: el importe del carrito lo calcula la API con los precios vigentes de la base
      items.value.push({
        id: producto.id,
        nombre: producto.nombre,
        imagen_url: producto.imagen_url,
        cantidad: 1
      })
    }
  }

  function quitarProducto(id) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx === -1) return
    if (items.value[idx].cantidad > 1) {
      items.value[idx].cantidad--
    } else {
      items.value.splice(idx, 1)
    }
  }

  function eliminarProducto(id) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function vaciarCarrito() {
    items.value = []
  }

  /** Lo único que el sitio manda a la API: producto y cantidad. */
  const paraLaApi = computed(() =>
    items.value.map(item => ({ producto_id: item.id, cantidad: item.cantidad }))
  )

  // ── Persistencia ──
  watch(items, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  // Sincronización entre pestañas
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        items.value = e.newValue ? JSON.parse(e.newValue) : []
      }
    })
  }

  return {
    items,
    totalItems,
    paraLaApi,
    agregarProducto,
    quitarProducto,
    eliminarProducto,
    vaciarCarrito
  }
})
