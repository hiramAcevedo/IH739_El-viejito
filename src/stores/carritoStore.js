import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'carrito-el-viejito'

function cargarDesdeStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
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

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + Number(item.precio) * item.cantidad, 0)
  )

  // ── Acciones ──
  function agregarProducto(producto) {
    const existente = items.value.find(i => i.id === producto.id)
    if (existente) {
      existente.cantidad++
    } else {
      items.value.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
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
    subtotal,
    agregarProducto,
    quitarProducto,
    eliminarProducto,
    vaciarCarrito
  }
})
