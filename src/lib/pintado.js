/**
 * Espera a que el navegador presente el primer pintado con contenido (first-contentful-paint). Lo que no hace falta
 * para ese pintado (una foto de fondo, una imagen más abajo, los datos de un carrusel) se pide después, para no
 * competir con él.
 *
 * Sin la API de tiempos de pintado espera un cuadro. En una pestaña que abrió oculta el navegador no registra ese
 * pintado: a los 3 segundos sigue de todos modos.
 */
export function despuesDelPintado() {
  return new Promise((listo) => {
    // el tope y el aviso del pintado se excluyen: el que llega primero apaga al otro
    const seguir = () => setTimeout(listo, 0)
    if (typeof PerformanceObserver === 'undefined' || !PerformanceObserver.supportedEntryTypes?.includes('paint')) {
      requestAnimationFrame(seguir)
      return
    }
    const observador = new PerformanceObserver((lista) => {
      if (lista.getEntriesByName('first-contentful-paint').length) {
        clearTimeout(tope)
        observador.disconnect()
        seguir()
      }
    })
    const tope = setTimeout(() => {
      observador.disconnect()
      seguir()
    }, 3000)
    observador.observe({ type: 'paint', buffered: true })
  })
}
