/**
 * Los helpers de supabaseClient.js contra un cliente de Supabase simulado: cada uno arma su consulta, regresa los
 * datos y, si Supabase responde con error, lo lanza. Sin las variables de entorno, el módulo avisa en la consola.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const sb = vi.hoisted(() => {
  const consulta = { respuesta: { data: null, error: null } }
  for (const metodo of ['select', 'eq', 'order', 'insert', 'update', 'delete', 'single']) {
    consulta[metodo] = vi.fn(() => consulta)
  }
  // la consulta se resuelve al esperarla, como el constructor de consultas de supabase-js
  consulta.then = (resolver, rechazar) => Promise.resolve(consulta.respuesta).then(resolver, rechazar)
  return { consulta, createClient: vi.fn(() => ({ from: vi.fn(() => consulta) })) }
})
vi.mock('@supabase/supabase-js', () => ({ createClient: sb.createClient }))

const responde = (data, error = null) => (sb.consulta.respuesta = { data, error })

beforeEach(() => {
  responde(null)
})

describe('supabaseClient.js', () => {
  it('crea el cliente con la URL y la llave públicas del entorno', async () => {
    await import('@/lib/supabaseClient')
    expect(sb.createClient).toHaveBeenCalledWith('https://supabase.prueba.local', 'llave-de-prueba')
  })

  it('getProductos trae sólo los activos, por nombre', async () => {
    const { getProductos } = await import('@/lib/supabaseClient')
    responde([{ id: 'p-1' }])
    expect(await getProductos()).toEqual([{ id: 'p-1' }])
    expect(sb.consulta.eq).toHaveBeenCalledWith('activo', true)
    expect(sb.consulta.order).toHaveBeenCalledWith('nombre')
  })

  it('el panel lee, crea, cambia y borra productos', async () => {
    const { getProductosAdmin, createProducto, updateProducto, deleteProducto } = await import('@/lib/supabaseClient')
    responde([{ id: 'p-1' }, { id: 'p-2' }])
    expect(await getProductosAdmin()).toHaveLength(2)

    responde({ id: 'p-3', nombre: 'Nuevo' })
    expect(await createProducto({ nombre: 'Nuevo' })).toEqual({ id: 'p-3', nombre: 'Nuevo' })
    expect(sb.consulta.insert).toHaveBeenCalledWith({ nombre: 'Nuevo' })

    responde({ id: 'p-3', activo: false })
    expect(await updateProducto('p-3', { activo: false })).toEqual({ id: 'p-3', activo: false })
    expect(sb.consulta.update).toHaveBeenCalledWith({ activo: false })
    expect(sb.consulta.eq).toHaveBeenCalledWith('id', 'p-3')

    responde(null)
    await expect(deleteProducto('p-3')).resolves.toBeUndefined()
    expect(sb.consulta.delete).toHaveBeenCalled()
  })

  it('cada helper lanza el error que da Supabase', async () => {
    const helpers = await import('@/lib/supabaseClient')
    const error = { message: 'new row violates row-level security policy', code: '42501' }
    responde(null, error)
    for (const llamada of [
      () => helpers.getProductos(), () => helpers.getProductosAdmin(), () => helpers.createProducto({}),
      () => helpers.updateProducto('p-1', {}), () => helpers.deleteProducto('p-1')
    ]) {
      await expect(llamada()).rejects.toBe(error)
    }
  })

  it('sin URL ni llave en el entorno, avisa cómo configurarlas', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.resetModules()
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await import('@/lib/supabaseClient')
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('Variables de entorno no configuradas'))
  })
})
