/**
 * El contrato del sitio con la API de pedidos y pagos (Django REST Framework, repositorio IH740_api_El-viejito).
 *
 * Cada función es una ruta de la API y documenta la forma de su respuesta. El sitio nunca manda precios ni
 * totales: manda producto y cantidad, y muestra lo que la API calcula y lo que la pasarela confirma.
 *
 * VITE_API_URL es la dirección de la API en cada entorno. Mientras la API no está conectada, con VITE_API_EJEMPLO=1
 * y sólo en el servidor de desarrollo, las funciones responden desde api-ejemplo.js, que imita al servidor con datos
 * de ejemplo. El build de producción no incluye ese módulo.
 */

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export const MODO_EJEMPLO = import.meta.env.DEV && import.meta.env.VITE_API_EJEMPLO === '1'

/** Un error de la API: el código HTTP y el cuerpo que lo explica. */
export class ErrorApi extends Error {
  constructor(estado, datos = {}) {
    super(mensajeDe(datos) || `La API respondió ${estado}`)
    this.estado = estado
    this.datos = datos
  }
}

function mensajeDe(datos) {
  if (!datos || typeof datos !== 'object') return ''
  if (datos.detail) return datos.detail
  const primero = Object.values(datos)[0]
  return Array.isArray(primero) ? primero[0] : typeof primero === 'string' ? primero : ''
}

async function pedir(metodo, ruta, { cuerpo, token } = {}) {
  if (MODO_EJEMPLO) {
    const { responder } = await import('./api-ejemplo.js')
    return responder(metodo, ruta, cuerpo, token)
  }
  const cabeceras = { Accept: 'application/json' }
  if (cuerpo) cabeceras['Content-Type'] = 'application/json'
  if (token) cabeceras.Authorization = `Bearer ${token}`
  const respuesta = await fetch(`${BASE}${ruta}`, {
    method: metodo,
    headers: cabeceras,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  })
  const datos = respuesta.status === 204 ? {} : await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, datos)
  return datos
}

/* ── Compra ─────────────────────────────────────────────────────────────── */

/**
 * POST /pedidos/calcular/ · la cotización del carrito con los precios vigentes de la base.
 * @param {{items: {producto_id: string, cantidad: number}[], metodo_entrega: 'envio'|'recoger'}} carrito
 * @returns {{lineas: {id, nombre, precio, cantidad, subtotal}[], subtotal, iva, envio, total, moneda}} importes en texto con dos decimales
 */
export const calcularPedido = (carrito) => pedir('POST', '/pedidos/calcular/', { cuerpo: carrito })

/**
 * POST /pedidos/crear/ · registra el pedido como pendiente con el importe calculado en el servidor.
 * @param {{items, metodo_entrega, cliente_nombre, cliente_email, telefono, notas,
 *          direccion: {calle, colonia, codigo_postal, ciudad, estado} | null, confirma_mayor_de_edad: boolean}} pedido
 * @returns {{id, folio, lineas, subtotal, iva, envio, total, moneda}}
 */
export const crearPedido = (pedido) => pedir('POST', '/pedidos/crear/', { cuerpo: pedido })

/**
 * POST /pagos/sesion/ · abre la sesión de cobro con la pasarela para un pedido pendiente.
 * @returns {{folio, sesion, importe, url}} url: la página de pago a la que se lleva al comprador
 */
export const abrirSesionPago = (pedido_id) => pedir('POST', '/pagos/sesion/', { cuerpo: { pedido_id } })

/**
 * GET /pagos/regreso/?session_id= · el estado de la sesión al volver de la pasarela.
 * @returns {{folio, sesion, estado_sesion: 'open'|'complete'|'expired', pago: 'paid'|'unpaid', importe,
 *            lineas, subtotal, iva, envio, total, url, vence}} el resumen del pedido; url y vence, para completar
 *            un pago pendiente
 */
export const consultarRegreso = (sessionId) =>
  pedir('GET', `/pagos/regreso/?session_id=${encodeURIComponent(sessionId)}`)

/* ── Seguimiento sin cuenta ─────────────────────────────────────────────── */

/**
 * POST /pedidos/seguimiento/ · el pedido, sólo si correo y folio coinciden; si no, 404 sin decir cuál falló.
 * @returns {{folio, creado, estado, estado_pago, metodo_entrega, lineas, subtotal, iva, envio, total,
 *            historial: {estado, fecha}[], envio_info: {paqueteria, guia, fecha_estimada} | null}}
 */
export const consultarSeguimiento = ({ correo, folio }) =>
  pedir('POST', '/pedidos/seguimiento/', { cuerpo: { correo, folio } })

/** GET /pedidos/seguimiento/{folio}/?firma= · lo mismo, desde la liga firmada del correo de confirmación. */
export const consultarSeguimientoFirmado = (folio, firma) =>
  pedir('GET', `/pedidos/seguimiento/${encodeURIComponent(folio)}/?firma=${encodeURIComponent(firma)}`)

/** GET /legal/{clave}/ · un texto legal de lectura pública: 'privacidad', 'terminos' o 'leyenda'. */
export const leerTextoLegal = (clave) => pedir('GET', `/legal/${clave}/`)

/* ── Panel: cada operación lleva el token de la sesión de Supabase Auth ──── */

/** GET /admin/resumen/ · las cuentas del dashboard. */
export const resumenPanel = (token) => pedir('GET', '/admin/resumen/', { token })

/**
 * GET /admin/pedidos/ · los pedidos con sus dos estados: el logístico y el del pago, que sólo se lee.
 * @returns {{id, folio, creado, cliente_nombre, cliente_email, telefono, total, estado, estado_pago,
 *            metodo_entrega, lineas, notas}[]}
 */
export const listarPedidos = (token) => pedir('GET', '/admin/pedidos/', { token })

/** PATCH /admin/pedidos/{id}/ · cambia sólo el estado logístico; el del pago lo escribe el aviso de la pasarela. */
export const cambiarEstadoPedido = (token, id, estado) =>
  pedir('PATCH', `/admin/pedidos/${id}/`, { cuerpo: { estado }, token })

/** GET /admin/envios/ · los pedidos con envío a domicilio, con su dirección y su guía. */
export const listarEnvios = (token) => pedir('GET', '/admin/envios/', { token })

/**
 * POST /admin/envios/{pedido_id}/guia/ · registra paquetería, guía y fecha estimada; el pedido pasa a enviado y
 * el aviso de envío queda en la cola de correos.
 */
export const registrarGuia = (token, pedidoId, datos) =>
  pedir('POST', `/admin/envios/${pedidoId}/guia/`, { cuerpo: datos, token })

/** GET /admin/pagos/ · los intentos de cobro, de sólo lectura. */
export const listarPagos = (token) => pedir('GET', '/admin/pagos/', { token })

/** GET /admin/pagos/{id}/eventos/ · los avisos de la pasarela de un intento, con su clave de idempotencia. */
export const eventosDePago = (token, pagoId) => pedir('GET', `/admin/pagos/${pagoId}/eventos/`, { token })

/** PUT /admin/legal/{clave}/ · guarda un texto legal sin tocar el código. */
export const guardarTextoLegal = (token, clave, datos) =>
  pedir('PUT', `/admin/legal/${clave}/`, { cuerpo: datos, token })

/** GET /admin/usuarios/ · sólo el superadministrador: los administradores y las invitaciones abiertas. */
export const listarUsuarios = (token) => pedir('GET', '/admin/usuarios/', { token })

/** POST /admin/usuarios/ · alta directa de un administrador. */
export const crearUsuario = (token, datos) => pedir('POST', '/admin/usuarios/', { cuerpo: datos, token })

/** PATCH /admin/usuarios/{id}/ · apagar, encender o cambiar el rol. */
export const cambiarUsuario = (token, id, datos) =>
  pedir('PATCH', `/admin/usuarios/${id}/`, { cuerpo: datos, token })

/** DELETE /admin/usuarios/{id}/ · la baja. */
export const borrarUsuario = (token, id) => pedir('DELETE', `/admin/usuarios/${id}/`, { token })

/** POST /admin/invitaciones/ · crea la invitación y devuelve la liga, que vence y sirve una sola vez. */
export const invitarUsuario = (token, datos) => pedir('POST', '/admin/invitaciones/', { cuerpo: datos, token })

/** GET /invitaciones/{clave}/ · los datos de una invitación vigente; 410 si ya se usó o venció. */
export const leerInvitacion = (clave) => pedir('GET', `/invitaciones/${encodeURIComponent(clave)}/`)

/** POST /invitaciones/{clave}/ · crea la cuenta con la contraseña que elige quien fue invitado. */
export const aceptarInvitacion = (clave, datos) =>
  pedir('POST', `/invitaciones/${encodeURIComponent(clave)}/`, { cuerpo: datos })
