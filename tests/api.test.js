import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as api from '@/lib/api'

// la base de prueba de vitest.config.js lleva barra final a propósito: api.js debe quitarla
const BASE = 'https://api.prueba.local/api'

const json = (status, cuerpo) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } })

let fetchSimulado
beforeEach(() => {
  fetchSimulado = vi.fn()
  vi.stubGlobal('fetch', fetchSimulado)
})

describe('api.js (fetch simulado)', () => {
  it('POST: arma la URL con la base configurada, sin la barra final, y manda el carrito en JSON', async () => {
    const cotizacion = {
      lineas: [],
      subtotal: '640.00',
      iva: '102.40',
      envio: '0.00',
      total: '742.40',
      moneda: 'mxn'
    }
    fetchSimulado.mockResolvedValue(json(200, cotizacion))
    const carrito = { items: [{ producto_id: 'p-blanco', cantidad: 2 }], metodo_entrega: 'envio' }

    await expect(api.calcularPedido(carrito)).resolves.toEqual(cotizacion)

    expect(fetchSimulado).toHaveBeenCalledTimes(1)
    const [url, opciones] = fetchSimulado.mock.calls[0]
    expect(url).toBe(`${BASE}/pedidos/calcular/`)
    expect(opciones.method).toBe('POST')
    expect(opciones.headers).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    })
    expect(JSON.parse(opciones.body)).toEqual(carrito)
  })

  it('GET: codifica el session_id en la consulta y, en el panel, manda el token como Bearer sin cuerpo', async () => {
    fetchSimulado.mockImplementation(async () => json(200, {}))

    await api.consultarRegreso('cs_test a/b?c')
    expect(fetchSimulado.mock.calls[0][0]).toBe(
      `${BASE}/pagos/regreso/?session_id=cs_test%20a%2Fb%3Fc`
    )

    await api.listarPedidos('token-de-prueba')
    expect(fetchSimulado.mock.calls[1]).toEqual([
      `${BASE}/admin/pedidos/`,
      {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: 'Bearer token-de-prueba' },
        body: undefined
      }
    ])
  })

  it('4xx: lanza ErrorApi con el código y el mensaje de la API (detail, o el primer error del primer campo)', async () => {
    fetchSimulado.mockResolvedValueOnce(
      json(404, { detail: 'No encontramos un pedido con esos datos. Revisa el correo y el folio.' })
    )
    const e404 = await api
      .consultarSeguimiento({ correo: 'rosa@example.com', folio: '9C61F2A4' })
      .catch((e) => e)
    expect(e404).toBeInstanceOf(api.ErrorApi)
    expect(e404.estado).toBe(404)
    expect(e404.message).toBe(
      'No encontramos un pedido con esos datos. Revisa el correo y el folio.'
    )

    fetchSimulado.mockResolvedValueOnce(
      json(400, {
        cliente_email: ['Escribe un correo válido.'],
        confirma_mayor_de_edad: ['Confirma que eres mayor de edad.']
      })
    )
    const e400 = await api.crearPedido({ items: [] }).catch((e) => e)
    expect(e400).toBeInstanceOf(api.ErrorApi)
    expect(e400.estado).toBe(400)
    expect(e400.message).toBe('Escribe un correo válido.')
    expect(e400.datos.confirma_mayor_de_edad).toEqual(['Confirma que eres mayor de edad.'])
  })

  it('5xx con un cuerpo que no es JSON: lanza ErrorApi con «La API respondió 502» y datos vacíos', async () => {
    fetchSimulado.mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }))

    const error = await api.calcularPedido({ items: [] }).catch((e) => e)

    expect(error).toBeInstanceOf(api.ErrorApi)
    expect(error.estado).toBe(502)
    expect(error.message).toBe('La API respondió 502')
    expect(error.datos).toEqual({})
  })

  it('204 sin contenido: responde un objeto vacío sin leer el cuerpo', async () => {
    const respuesta = new Response(null, { status: 204 })
    const leer = vi.spyOn(respuesta, 'json')
    fetchSimulado.mockResolvedValue(respuesta)

    await expect(api.borrarUsuario('token-de-prueba', 'u-3')).resolves.toEqual({})

    expect(leer).not.toHaveBeenCalled()
    expect(fetchSimulado.mock.calls[0][0]).toBe(`${BASE}/admin/usuarios/u-3/`)
    expect(fetchSimulado.mock.calls[0][1].method).toBe('DELETE')
  })

  it('error de red: el rechazo de fetch llega tal cual a quien llama, sin convertirse en ErrorApi', async () => {
    const caida = new TypeError('Failed to fetch')
    fetchSimulado.mockRejectedValue(caida)

    await expect(api.calcularPedido({ items: [] })).rejects.toBe(caida)
  })

  it('VITE_API_EJEMPLO=1 en desarrollo responde desde api-ejemplo.js sin llamar a fetch; fuera de desarrollo llama a la API', async () => {
    const responder = vi.fn(async () => ({ clave: 'leyenda' }))
    vi.doMock('@/lib/api-ejemplo.js', () => ({ responder }))

    vi.stubEnv('VITE_API_EJEMPLO', '1')
    vi.resetModules()
    const enDesarrollo = await import('@/lib/api')
    expect(enDesarrollo.MODO_EJEMPLO).toBe(true)
    await expect(enDesarrollo.leerTextoLegal('leyenda')).resolves.toEqual({ clave: 'leyenda' })
    expect(responder).toHaveBeenCalledWith('GET', '/legal/leyenda/', undefined, undefined)
    expect(fetchSimulado).not.toHaveBeenCalled()

    vi.stubEnv('DEV', false) // como en el build de producción
    vi.resetModules()
    const enProduccion = await import('@/lib/api')
    fetchSimulado.mockResolvedValue(json(200, { clave: 'leyenda' }))
    expect(enProduccion.MODO_EJEMPLO).toBe(false)
    await enProduccion.leerTextoLegal('leyenda')
    expect(fetchSimulado).toHaveBeenCalledWith(
      `${BASE}/legal/leyenda/`,
      expect.objectContaining({ method: 'GET' })
    )
    expect(responder).toHaveBeenCalledTimes(1)

    vi.doUnmock('@/lib/api-ejemplo.js')
  })
})
