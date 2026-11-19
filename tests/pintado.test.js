/** despuesDelPintado: espera el first-contentful-paint, o un cuadro sin la API de pintado, o 3 s si nunca llega. */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { despuesDelPintado } from '@/lib/pintado'

afterEach(() => {
  vi.useRealTimers()
})

function observadorDePrueba() {
  const observadores = []
  class Observador {
    static supportedEntryTypes = ['paint', 'largest-contentful-paint']
    constructor(avisar) {
      this.avisar = avisar
      this.desconectado = false
      observadores.push(this)
    }
    observe(opciones) { this.opciones = opciones }
    disconnect() { this.desconectado = true }
    pintar(nombre) { this.avisar({ getEntriesByName: (n) => (n === nombre ? [{ name: nombre }] : []) }) }
  }
  vi.stubGlobal('PerformanceObserver', Observador)
  return observadores
}

describe('despuesDelPintado', () => {
  it('sigue cuando el navegador presenta el first-contentful-paint, no antes', async () => {
    const observadores = observadorDePrueba()
    let listo = false
    const espera = despuesDelPintado().then(() => (listo = true))

    expect(observadores[0].opciones).toEqual({ type: 'paint', buffered: true })
    observadores[0].pintar('first-paint')
    await new Promise((r) => setTimeout(r, 5))
    expect(listo).toBe(false)

    observadores[0].pintar('first-contentful-paint')
    await espera
    expect(listo).toBe(true)
    expect(observadores[0].desconectado).toBe(true)
  })

  it('si el pintado nunca se registra (pestaña oculta), sigue a los 3 segundos', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] })
    const observadores = observadorDePrueba()
    const espera = despuesDelPintado()
    vi.advanceTimersByTime(3000)
    vi.advanceTimersByTime(1)
    await espera
    expect(observadores[0].desconectado).toBe(true)
  })

  it('sin la API de tiempos de pintado espera un cuadro', async () => {
    vi.stubGlobal('PerformanceObserver', undefined)
    const cuadro = vi.spyOn(window, 'requestAnimationFrame')
    await despuesDelPintado()
    expect(cuadro).toHaveBeenCalled()
  })
})
