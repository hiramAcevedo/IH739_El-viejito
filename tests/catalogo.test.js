/**
 * El catálogo y el carrito: el store de productos con su caché, la vista de productos con sus filtros, el detalle de
 * un producto y el carrito con la cotización. El catálogo y la cotización salen de la API, que va simulada.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useProductosStore } from '@/stores/productosStore'
import { useCarritoStore } from '@/stores/carritoStore'
import ProductosView from '@/views/ProductosView.vue'
import ProductoDetalleView from '@/views/ProductoDetalleView.vue'
import CarritoView from '@/views/CarritoView.vue'

const api = vi.hoisted(() => ({ calcularPedido: vi.fn(), listarProductos: vi.fn() }))
vi.mock('@/lib/api', () => api)

enableAutoUnmount(afterEach)

const PRODUCTOS = [
  { id: 'p-blanco', nombre: 'Blanco Clásico', tipo: 'blanco', precio: '320.00', descripcion: 'Fresco', imagen_url: 'tequila-blanco.webp', activo: true },
  { id: 'p-reposado', nombre: 'Reposado Suave', tipo: 'reposado', precio: '450.00', descripcion: 'Madera', imagen_url: 'tequila-reposado.webp', activo: true },
  { id: 'p-especial', nombre: 'Edición Especial', tipo: 'cristalino', precio: '689.50', descripcion: 'Limitada', imagen_url: null, activo: false }
]
const Vacia = { render: () => null }

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

// productos pide el catálogo después del primer pintado: se espera un cuadro y luego las respuestas
async function esperarCarga() {
  // con temporizadores falsos (detalle y carrito, que no difieren nada) basta con el cuadro
  await new Promise((listo) => requestAnimationFrame(() => (vi.isFakeTimers() ? listo() : setTimeout(listo, 0))))
  await vi.dynamicImportSettled()
  await flushPromises()
}

async function montar(componente, ruta = '/', { esperar = true } = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Vacia },
      { path: '/productos', component: Vacia },
      { path: '/productos/:id', name: 'producto-detalle', component: Vacia },
      { path: '/checkout', component: Vacia }
    ]
  })
  await router.push(ruta)
  await router.isReady()
  const wrapper = mount(componente, { global: { plugins: [router] } })
  if (esperar) await esperarCarga()
  return { wrapper, router }
}

describe('productosStore', () => {
  it('pide los productos una sola vez y los sirve de la caché; con force los vuelve a pedir', async () => {
    api.listarProductos.mockResolvedValue(PRODUCTOS)
    const store = useProductosStore()

    expect(await store.fetchProductos()).toEqual(PRODUCTOS)
    expect(await store.fetchProductos()).toEqual(PRODUCTOS)
    expect(api.listarProductos).toHaveBeenCalledTimes(1)
    await store.fetchProductos(true)
    expect(api.listarProductos).toHaveBeenCalledTimes(2)
    expect([store.loaded, store.loading, store.error]).toEqual([true, false, false])
  })

  it('getById carga la lista si hace falta y regresa null si el producto no existe', async () => {
    api.listarProductos.mockResolvedValue(PRODUCTOS)
    const store = useProductosStore()

    expect((await store.getById('p-reposado')).nombre).toBe('Reposado Suave')
    expect(await store.getById('no-existe')).toBeNull()
    expect(api.listarProductos).toHaveBeenCalledTimes(1)
  })

  it('si la API falla, marca el error y lo deja pasar', async () => {
    api.listarProductos.mockRejectedValue(new Error('sin red'))
    const store = useProductosStore()

    await expect(store.fetchProductos()).rejects.toThrow('sin red')
    expect([store.loaded, store.loading, store.error]).toEqual([false, false, true])
  })
})

describe('ProductosView', () => {
  const nombres = (wrapper) => wrapper.findAll('.product-name').map((n) => n.text())

  it('antes del primer pintado no pide el catálogo y ya dice que carga, no que está vacío', async () => {
    api.listarProductos.mockResolvedValue(PRODUCTOS)
    const { wrapper } = await montar(ProductosView, '/productos', { esperar: false })
    expect(wrapper.text()).toContain('Cargando productos...')
    expect(api.listarProductos).not.toHaveBeenCalled()
    await esperarCarga()
    expect(api.listarProductos).toHaveBeenCalledTimes(1)
  })

  it('mientras carga lo dice; luego muestra cada producto con su tipo y su precio', async () => {
    let entregar
    api.listarProductos.mockReturnValue(new Promise((resolve) => (entregar = resolve)))
    const { wrapper } = await montar(ProductosView, '/productos')
    expect(wrapper.text()).toContain('Cargando productos...')

    entregar(PRODUCTOS)
    await flushPromises()
    expect(nombres(wrapper)).toEqual(['Blanco Clásico', 'Reposado Suave', 'Edición Especial'])
    expect(wrapper.findAll('.type-badge').map((b) => b.text())).toEqual(['Blanco', 'Reposado', 'cristalino'])
    expect(wrapper.find('.product-price').text()).toBe('$320.00')
    expect(wrapper.find('label[for="filtro-precio"]').text()).toBe('Precio max: $690.00')
  })

  it('filtra por tipo y por precio, cuenta los resultados y limpia los filtros', async () => {
    api.listarProductos.mockResolvedValue(PRODUCTOS)
    const { wrapper } = await montar(ProductosView, '/productos')

    await wrapper.find('.filtro-reposado').trigger('click')
    expect(nombres(wrapper)).toEqual(['Reposado Suave'])
    expect(wrapper.find('.resultados-count').text()).toBe('Mostrando 1 de 3 productos')

    await wrapper.find('.filtro-btn').trigger('click')
    await wrapper.find('#filtro-precio').setValue(400)
    expect(nombres(wrapper)).toEqual(['Blanco Clásico'])

    await wrapper.find('.filtro-añejo').trigger('click')
    expect(wrapper.text()).toContain('No hay productos que coincidan con los filtros seleccionados.')
    await wrapper.find('.empty-state .retry-btn').trigger('click')
    expect(nombres(wrapper)).toHaveLength(3)
  })

  it('Agregar suma el producto al carrito sin abrir su detalle', async () => {
    api.listarProductos.mockResolvedValue(PRODUCTOS)
    const { wrapper, router } = await montar(ProductosView, '/productos')

    await wrapper.findAll('.btn-agregar-grid')[1].trigger('click')
    await flushPromises()
    expect(useCarritoStore().items.map((i) => [i.id, i.cantidad])).toEqual([['p-reposado', 1]])
    expect(router.currentRoute.value.path).toBe('/productos')
  })

  it('si la carga falla ofrece reintentar, y el reintento muestra los productos', async () => {
    api.listarProductos.mockRejectedValueOnce(new Error('sin red')).mockResolvedValueOnce(PRODUCTOS)
    const { wrapper } = await montar(ProductosView, '/productos')
    expect(wrapper.text()).toContain('No se pudieron cargar los productos.')

    await wrapper.find('.error-state .retry-btn').trigger('click')
    await flushPromises()
    expect(nombres(wrapper)).toHaveLength(3)
  })

  it('sin productos, el rango de precio usa sus valores por omisión', async () => {
    api.listarProductos.mockResolvedValue([])
    const { wrapper } = await montar(ProductosView, '/productos')
    const rango = wrapper.find('#filtro-precio')
    expect([rango.attributes('min'), rango.attributes('max')]).toEqual(['0', '1000'])
  })
})

describe('ProductoDetalleView', () => {
  it('muestra el producto de la ruta y lo agrega al carrito, con el botón en pausa un momento', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      api.listarProductos.mockResolvedValue(PRODUCTOS)
      const { wrapper } = await montar(ProductoDetalleView, '/productos/p-especial')

      expect(wrapper.find('.producto-nombre').text()).toBe('Edición Especial')
      expect(wrapper.find('.producto-precio').text()).toBe('$689.50')
      expect(wrapper.text()).toContain('No disponible')
      expect(wrapper.find('.producto-imagen').attributes('src')).toBeTruthy()

      await wrapper.find('.btn-agregar').trigger('click')
      expect(useCarritoStore().items[0].id).toBe('p-especial')
      expect(wrapper.find('.btn-agregar').text()).toBe('Agregado al carrito')
      expect(wrapper.find('.btn-agregar').attributes('disabled')).toBeDefined()
      vi.advanceTimersByTime(1500)
      await flushPromises()
      expect(wrapper.find('.btn-agregar').text()).toBe('Agregar al carrito')
    } finally {
      vi.useRealTimers()
    }
  })

  it('un producto que no existe o una falla de la API muestran el aviso con la liga al catálogo', async () => {
    api.listarProductos.mockResolvedValue(PRODUCTOS)
    const noExiste = await montar(ProductoDetalleView, '/productos/no-existe')
    expect(noExiste.wrapper.find('.btn-back').attributes('href')).toBe('/productos')

    setActivePinia(createPinia())
    api.listarProductos.mockRejectedValue(new Error('sin red'))
    const caido = await montar(ProductoDetalleView, '/productos/p-blanco')
    expect(caido.wrapper.find('.btn-back').exists()).toBe(true)
    expect(console.error).toHaveBeenCalledWith('Error al cargar producto:', expect.any(Error))
  })
})

describe('CarritoView', () => {
  const COTIZACION = {
    lineas: [{ id: 'p-blanco', nombre: 'Blanco Clásico', precio: '320.00', cantidad: 2, subtotal: '640.00' }],
    subtotal: '640.00', iva: '102.40', envio: '0.00', total: '742.40', moneda: 'mxn'
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  async function conCarrito() {
    const carrito = useCarritoStore()
    carrito.agregarProducto(PRODUCTOS[0])
    carrito.agregarProducto(PRODUCTOS[0])
    carrito.agregarProducto(PRODUCTOS[1])
    const montado = await montar(CarritoView, '/carrito')
    return { ...montado, carrito }
  }
  const cotizar = async () => {
    vi.advanceTimersByTime(300)
    await flushPromises()
  }

  it('vacío, invita a ver el catálogo', async () => {
    const { wrapper } = await montar(CarritoView, '/carrito')
    expect(wrapper.text()).toContain('Tu carrito está vacío.')
    expect(api.calcularPedido).not.toHaveBeenCalled()
  })

  it('los precios de cada línea salen de la cotización de la API; lo que no cotizó queda en espera', async () => {
    api.calcularPedido.mockResolvedValue(COTIZACION)
    const { wrapper } = await conCarrito()
    expect(wrapper.findAll('tbody tr')[0].findAll('td')[1].text()).toBe('…')

    await cotizar()
    expect(api.calcularPedido).toHaveBeenCalledWith({
      items: [{ producto_id: 'p-blanco', cantidad: 2 }, { producto_id: 'p-reposado', cantidad: 1 }], metodo_entrega: 'envio'
    })
    const [blanco, reposado] = wrapper.findAll('tbody tr')
    expect([blanco.findAll('td')[1].text(), blanco.find('.celda-subtotal').text()]).toEqual(['$320.00', '$640.00'])
    expect(reposado.find('.celda-subtotal').text()).toBe('…')
  })

  it('los botones cambian cantidades, eliminan líneas y la cotización se vuelve a pedir', async () => {
    api.calcularPedido.mockResolvedValue(COTIZACION)
    const { wrapper, carrito } = await conCarrito()
    await cotizar()

    await wrapper.find('[aria-label="Quitar un Blanco Clásico"]').trigger('click')
    await wrapper.find('[aria-label="Agregar un Reposado Suave"]').trigger('click')
    await wrapper.find('[aria-label="Eliminar Blanco Clásico"]').trigger('click')
    await cotizar()
    expect(carrito.items.map((i) => [i.id, i.cantidad])).toEqual([['p-reposado', 2]])
    expect(api.calcularPedido).toHaveBeenLastCalledWith({ items: [{ producto_id: 'p-reposado', cantidad: 2 }], metodo_entrega: 'envio' })
  })

  it('vaciar pide confirmación; al vaciar, la cotización se limpia sin llamar a la API', async () => {
    api.calcularPedido.mockResolvedValue(COTIZACION)
    const { wrapper, carrito } = await conCarrito()
    await cotizar()

    await wrapper.find('.btn-vaciar').trigger('click')
    await wrapper.find('.btn-cancelar').trigger('click')
    expect(wrapper.find('.modal-box').exists()).toBe(false)
    await wrapper.find('.btn-vaciar').trigger('click')
    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.find('.modal-box').exists()).toBe(false)

    await wrapper.find('.btn-vaciar').trigger('click')
    await wrapper.find('.btn-confirmar').trigger('click')
    await cotizar()
    expect(carrito.items).toEqual([])
    expect(wrapper.text()).toContain('Tu carrito está vacío.')
    expect(api.calcularPedido).toHaveBeenCalledTimes(1)
  })

  it('si la API no cotiza, avisa y no deja continuar al pago', async () => {
    api.calcularPedido.mockRejectedValue(new Error('sin red'))
    const { wrapper } = await conCarrito()
    await cotizar()
    expect(wrapper.text()).toContain('No pudimos calcular el total. Intenta de nuevo en un momento.')
    expect(wrapper.find('a[href="/checkout"]').exists()).toBe(false)
  })
})

describe('carritoStore entre pestañas', () => {
  it('toma el carrito que otra pestaña guardó, y lo vacía si la otra lo borró', () => {
    const carrito = useCarritoStore()
    const linea = { id: 'p-blanco', nombre: 'Blanco Clásico', imagen_url: 'tequila-blanco.webp', cantidad: 3 }

    window.dispatchEvent(new StorageEvent('storage', { key: 'carrito-el-viejito', newValue: JSON.stringify([linea]) }))
    expect(carrito.items).toEqual([linea])
    window.dispatchEvent(new StorageEvent('storage', { key: 'otra-clave', newValue: '[]' }))
    expect(carrito.items).toEqual([linea])
    window.dispatchEvent(new StorageEvent('storage', { key: 'carrito-el-viejito', newValue: null }))
    expect(carrito.items).toEqual([])
  })
})
