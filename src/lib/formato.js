/** Formatos que comparten las vistas: dinero en pesos y fechas en español de México. */

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
