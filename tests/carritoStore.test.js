import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useCarritoStore } from '@/stores/carritoStore'

const CLAVE = 'carrito-el-viejito'
const BLANCO = {
  id: 'p-blanco',
  nombre: 'Blanco Clásico',
  imagen_url: 'tequila-blanco.webp',
  precio: 320
}
const REPOSADO = {
  id: 'p-reposado',
  nombre: 'Reposado Suave',
  imagen_url: 'tequila-reposado.webp',
  precio: 450
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('carritoStore', () => {
  it('agregarProducto crea la línea con cantidad 1 y sin precio; el mismo producto otra vez suma la cantidad en vez de duplicar la línea', () => {
    const carrito = useCarritoStore()
    carrito.agregarProducto(BLANCO)
    expect(carrito.items).toEqual([
      { id: 'p-blanco', nombre: 'Blanco Clásico', imagen_url: 'tequila-blanco.webp', cantidad: 1 }
    ])

    carrito.agregarProducto(BLANCO)
    carrito.agregarProducto(REPOSADO)
    expect(carrito.items).toHaveLength(2)
    expect(carrito.items.map((i) => [i.id, i.cantidad])).toEqual([
      ['p-blanco', 2],
      ['p-reposado', 1]
    ])
  })

  it('quitarProducto baja una unidad y con la última quita la línea (nunca queda cantidad 0); un id que no está no cambia nada', () => {
    const carrito = useCarritoStore()
    carrito.agregarProducto(BLANCO)
    carrito.agregarProducto(BLANCO)

    carrito.quitarProducto('p-blanco')
    expect(carrito.items[0].cantidad).toBe(1)

    carrito.quitarProducto('p-blanco')
    expect(carrito.items).toEqual([])

    carrito.agregarProducto(REPOSADO)
    carrito.quitarProducto('no-existe')
    expect(carrito.items).toEqual([
      {
        id: 'p-reposado',
        nombre: 'Reposado Suave',
        imagen_url: 'tequila-reposado.webp',
        cantidad: 1
      }
    ])
  })

  it('eliminarProducto quita la línea completa sin importar la cantidad y vaciarCarrito deja el carrito vacío', () => {
    const carrito = useCarritoStore()
    for (let i = 0; i < 3; i++) carrito.agregarProducto(BLANCO)
    carrito.agregarProducto(REPOSADO)

    carrito.eliminarProducto('p-blanco')
    expect(carrito.items.map((i) => i.id)).toEqual(['p-reposado'])

    carrito.vaciarCarrito()
    expect(carrito.items).toEqual([])
    expect(carrito.totalItems).toBe(0)
  })

  it('totalItems suma las unidades y paraLaApi manda sólo producto_id y cantidad, sin precio', () => {
    const carrito = useCarritoStore()
    for (let i = 0; i < 3; i++) carrito.agregarProducto(BLANCO)
    carrito.agregarProducto(REPOSADO)

    expect(carrito.totalItems).toBe(4)
    expect(carrito.paraLaApi).toEqual([
      { producto_id: 'p-blanco', cantidad: 3 },
      { producto_id: 'p-reposado', cantidad: 1 }
    ])
  })

  it('guarda el carrito en localStorage con cada cambio', async () => {
    const carrito = useCarritoStore()
    carrito.agregarProducto(BLANCO)
    await nextTick()
    expect(JSON.parse(localStorage.getItem(CLAVE))).toEqual([
      { id: 'p-blanco', nombre: 'Blanco Clásico', imagen_url: 'tequila-blanco.webp', cantidad: 1 }
    ])

    carrito.agregarProducto(BLANCO)
    await nextTick()
    expect(JSON.parse(localStorage.getItem(CLAVE))[0].cantidad).toBe(2)

    carrito.vaciarCarrito()
    await nextTick()
    expect(localStorage.getItem(CLAVE)).toBe('[]')
  })

  it('al abrir recupera el carrito guardado sin el precio de los carritos anteriores al sprint 4, y con datos dañados empieza vacío', () => {
    localStorage.setItem(
      CLAVE,
      JSON.stringify([
        {
          id: 'p-blanco',
          nombre: 'Blanco Clásico',
          imagen_url: 'tequila-blanco.webp',
          precio: 320,
          cantidad: 2
        }
      ])
    )
    expect(useCarritoStore().items).toEqual([
      { id: 'p-blanco', nombre: 'Blanco Clásico', imagen_url: 'tequila-blanco.webp', cantidad: 2 }
    ])

    localStorage.setItem(CLAVE, '{no es json')
    setActivePinia(createPinia())
    expect(useCarritoStore().items).toEqual([])
  })
})
