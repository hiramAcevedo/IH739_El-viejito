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

/**
 * Cuánto espera la pantalla de regreso el aviso de la pasarela cuando el cargo ya está aprobado. Pregunta cada 2 s el
 * primer medio minuto y después cada 10 s, hasta 2 minutos: 25 consultas en total. Cada consulta le pregunta también a
 * Stripe por la sesión, así que no pregunta sin fin; al agotarse, la pantalla se detiene y lo dice.
 */
export const ESPERA_DEL_AVISO = { cada: 2000, luegoCada: 10000, desde: 30000, hasta: 120000 }

/** La pausa antes de la siguiente consulta, o null si ya se esperó todo lo previsto. */
export function siguientePausa(esperado, { cada, luegoCada, desde, hasta } = ESPERA_DEL_AVISO) {
  const pausa = esperado < desde ? cada : luegoCada
  return esperado + pausa <= hasta ? pausa : null
}

/**
 * Lo que dice la insignia mientras se pregunta: rota cada 3 s entre textos que no afirman que el pago pasó. Los
 * lectores de pantalla oyen una etiqueta fija («Confirmando el pago»), no un cambio cada 3 s.
 */
export const INSIGNIA_DE_ESPERA = { textos: ['Revisando tu pago', 'Espera un momento', 'Seguimos revisando'], cada: 3000 }
