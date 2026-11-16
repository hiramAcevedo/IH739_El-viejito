/**
 * El estado de la pantalla de regreso a partir de lo que responde la API (GET /pagos/regreso/).
 * Confirmado sólo cuando la base ya tiene el pago: lo escribe el aviso de la pasarela, no el regreso del comprador.
 */
export function estadoDe(respuesta) {
  if (respuesta.estado_pago === 'pagado') return 'confirmado'
  if (respuesta.pago === 'paid') return 'confirmando'
  if (respuesta.estado_sesion === 'expired' || respuesta.estado_pago === 'rechazado') return 'error'
  return 'pendiente' // sesión abierta, o completa con el pago en camino
}
