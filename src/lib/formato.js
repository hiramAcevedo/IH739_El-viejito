/** Formatos que comparten las vistas: dinero en pesos, fechas en español de México y cifras con su sustantivo. */

export function formatoMoneda(valor) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(valor))
}

export function formatoFecha(iso, opciones = { day: 'numeric', month: 'short' }) {
  return new Date(iso).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City', ...opciones })
}

export function formatoFechaHora(iso) {
  return new Date(iso).toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

/** Una cifra con su sustantivo en singular sólo cuando es 1: «1 guía por capturar», «0 guías…», «9 guías…». */
export function cuenta(cifra, singular, plural) {
  return `${cifra} ${Number(cifra) === 1 ? singular : plural}`
}
