/**
 * Módulo de ejemplo: responde como la API mientras no está conectada (actividad 3.2 del sprint 4).
 *
 * Imita al servidor con sus mismas reglas (el precio vigente del catálogo, el IVA del 16 % sumado al subtotal y el
 * envío sin costo, como config/settings.py de la API) y con una pausa de red, para que se vean los estados de carga.
 * Los pedidos, pagos, envíos, textos y cuentas son de ejemplo; los cambios viven en memoria y se pierden al recargar.
 * Sólo se carga en el servidor de desarrollo con VITE_API_EJEMPLO=1. La 3.3 lo apaga y el sitio habla con la API.
 */
import { ErrorApi } from './api'
import { useProductosStore } from '@/stores/productosStore'

const PAUSA = 650
const IVA = 0.16
const COSTO_ENVIO = 0
const espera = (ms = PAUSA) => new Promise((r) => setTimeout(r, ms))
const dinero = (n) => (Math.round(n * 100) / 100).toFixed(2)
const copia = (x) => JSON.parse(JSON.stringify(x))

/* ── Los datos de ejemplo ───────────────────────────────────────────────── */

const linea = (nombre, precio, cantidad) => ({
  nombre, precio: dinero(precio), cantidad, subtotal: dinero(precio * cantidad)
})
const totales = (lineas, envio = 0) => {
  const subtotal = lineas.reduce((s, l) => s + Number(l.subtotal), 0)
  const iva = Math.round(subtotal * IVA * 100) / 100
  return { subtotal: dinero(subtotal), iva: dinero(iva), envio: dinero(envio), total: dinero(subtotal + iva + envio) }
}
const pedido = (id, folio, creado, cliente, lineas, estado, estado_pago, metodo_entrega, direccion = null) => ({
  id, folio, creado, ...cliente, lineas, ...totales(lineas), estado, estado_pago, metodo_entrega, direccion, notas: null
})

const DIR_LAURA = { calle: 'Av. Juárez 1450, int. 3', colonia: 'Americana', codigo_postal: '44160', ciudad: 'Guadalajara', estado: 'Jalisco' }
const DIR_ANA = { calle: 'Calle Morelos 87', colonia: 'Centro', codigo_postal: '47730', ciudad: 'Tototlán', estado: 'Jalisco' }
const DIR_ROSA = { calle: 'Av. Patria 2210', colonia: 'Jardines Universidad', codigo_postal: '45110', ciudad: 'Zapopan', estado: 'Jalisco' }
const DIR_LUIS = { calle: 'Calle Hidalgo 15', colonia: 'Centro', codigo_postal: '47750', ciudad: 'Atotonilco el Alto', estado: 'Jalisco' }

const datos = {
  pedidos: [
    pedido('p-9c61', '9C61F2A4', '2026-11-07T18:12:00-06:00',
      { cliente_nombre: 'Rosa Ibarra', cliente_email: 'rosa@example.com', telefono: '33 1234 0006' },
      [linea('Blanco Clásico', 320, 3)], 'confirmado', 'pagado', 'envio', DIR_ROSA),
    pedido('p-a41c', 'A41C0E93', '2026-11-06T12:40:00-06:00',
      { cliente_nombre: 'Jorge Ruiz', cliente_email: 'jorge@example.com', telefono: '33 1234 0002' },
      [linea('Blanco Clásico', 320, 1), linea('Reposado Suave', 450, 1)], 'pendiente', 'pendiente', 'recoger'),
    pedido('p-3f9a', '3F9A1C27', '2026-11-05T10:24:00-06:00',
      { cliente_nombre: 'Laura Méndez', cliente_email: 'laura@example.com', telefono: '33 1234 0001' },
      [linea('Reposado Suave', 450, 2), linea('Añejo Premium', 680, 1)], 'enviado', 'pagado', 'envio', DIR_LAURA),
    pedido('p-7d22', '7D22B5C1', '2026-11-04T17:05:00-06:00',
      { cliente_nombre: 'Ana Torres', cliente_email: 'ana@example.com', telefono: '33 1234 0003' },
      [linea('Extra Añejo', 980, 1), linea('Blanco Clásico', 320, 1)], 'entregado', 'pagado', 'envio', DIR_ANA),
    pedido('p-e09f', 'E09F4A6B', '2026-11-04T09:31:00-06:00',
      { cliente_nombre: 'Luis Pérez', cliente_email: 'luis@example.com', telefono: '33 1234 0004' },
      [linea('Reposado Suave', 450, 1)], 'cancelado', 'rechazado', 'envio', DIR_LUIS),
    pedido('p-5b3c', '5B3C8D10', '2026-11-03T19:48:00-06:00',
      { cliente_nombre: 'Carmen Díaz', cliente_email: 'carmen@example.com', telefono: '33 1234 0005' },
      [linea('Extra Añejo', 980, 1)], 'cancelado', 'reembolsado', 'recoger')
  ],
  historial: {
    '3F9A1C27': [
      { estado: 'pagado', fecha: '2026-11-05T10:26:00-06:00' },
      { estado: 'confirmado', fecha: '2026-11-05T13:10:00-06:00' },
      { estado: 'enviado', fecha: '2026-11-06T11:45:00-06:00' }
    ]
  },
  envios: {
    'p-3f9a': { paqueteria: 'Estafeta', guia: '7781 2290 4410', fecha_estimada: '2026-11-09', aviso: 'en_cola' },
    'p-7d22': { paqueteria: 'DHL', guia: '5520 1847 9302', fecha_estimada: '2026-11-06', aviso: 'en_cola' }
  },
  pagos: [
    { id: 'pg-6', pedido: 'p-9c61', folio: '9C61F2A4', creado: '2026-11-07T18:13:00-06:00', proveedor: 'stripe', referencia: 'cs_ejemplo_9C61F2A4', importe: '1113.60', estado: 'pagado' },
    { id: 'pg-5', pedido: 'p-a41c', folio: 'A41C0E93', creado: '2026-11-06T12:41:00-06:00', proveedor: 'stripe', referencia: 'cs_ejemplo_A41C0E93', importe: '893.20', estado: 'creado' },
    { id: 'pg-4', pedido: 'p-3f9a', folio: '3F9A1C27', creado: '2026-11-05T10:25:00-06:00', proveedor: 'stripe', referencia: 'cs_ejemplo_3F9A1C27', importe: '1832.80', estado: 'pagado' },
    { id: 'pg-3', pedido: 'p-7d22', folio: '7D22B5C1', creado: '2026-11-04T17:06:00-06:00', proveedor: 'stripe', referencia: 'cs_ejemplo_7D22B5C1', importe: '1508.00', estado: 'pagado' },
    { id: 'pg-2b', pedido: 'p-e09f', folio: 'E09F4A6B', creado: '2026-11-04T09:40:00-06:00', proveedor: 'stripe', referencia: 'cs_ejemplo_E09F4A6B_2', importe: '522.00', estado: 'expirado' },
    { id: 'pg-2a', pedido: 'p-e09f', folio: 'E09F4A6B', creado: '2026-11-04T09:32:00-06:00', proveedor: 'stripe', referencia: 'cs_ejemplo_E09F4A6B_1', importe: '522.00', estado: 'fallido' },
    { id: 'pg-1', pedido: 'p-5b3c', folio: '5B3C8D10', creado: '2026-11-03T19:49:00-06:00', proveedor: 'stripe', referencia: 'cs_ejemplo_5B3C8D10', importe: '1136.80', estado: 'reembolsado' }
  ],
  eventos: {
    'pg-4': [
      { recibido: '2026-11-05T10:26:02-06:00', tipo: 'checkout.session.completed', clave: 'evt_ejemplo_4a', aplicado: true },
      { recibido: '2026-11-05T10:26:03-06:00', tipo: 'payment_intent.succeeded', clave: 'evt_ejemplo_4b', aplicado: true },
      { recibido: '2026-11-05T10:31:40-06:00', tipo: 'checkout.session.completed', clave: 'evt_ejemplo_4a', aplicado: false }
    ],
    'pg-6': [{ recibido: '2026-11-07T18:14:10-06:00', tipo: 'checkout.session.completed', clave: 'evt_ejemplo_6a', aplicado: true }],
    'pg-3': [{ recibido: '2026-11-04T17:07:21-06:00', tipo: 'checkout.session.completed', clave: 'evt_ejemplo_3a', aplicado: true }],
    'pg-2a': [
      { recibido: '2026-11-04T09:33:05-06:00', tipo: 'payment_intent.payment_failed', clave: 'evt_ejemplo_2a', aplicado: true },
      { recibido: '2026-11-04T09:33:05-06:00', tipo: 'charge.failed', clave: 'evt_ejemplo_2b', aplicado: true }
    ],
    'pg-2b': [{ recibido: '2026-11-05T09:40:00-06:00', tipo: 'checkout.session.expired', clave: 'evt_ejemplo_2c', aplicado: true }],
    'pg-1': [
      { recibido: '2026-11-03T19:50:11-06:00', tipo: 'checkout.session.completed', clave: 'evt_ejemplo_1a', aplicado: true },
      { recibido: '2026-11-04T10:02:47-06:00', tipo: 'charge.refunded', clave: 'evt_ejemplo_1b', aplicado: true }
    ]
  },
  textos: {
    privacidad: {
      clave: 'privacidad', titulo: 'Aviso de privacidad', actualizado: '2026-11-08T12:00:00-06:00',
      contenido: 'Tequila El Viejito, con domicilio en Tototlán, Jalisco, es responsable de los datos personales que nos compartes al comprar en este sitio.\n\nPara procesar y entregar tu pedido usamos tu nombre, correo, teléfono y, si eliges envío a domicilio, la dirección de entrega. Los usamos también para avisarte del estado de tu pedido. No guardamos los datos de tu tarjeta: el pago lo procesa la pasarela de pago.\n\nSólo compartimos la dirección de entrega con la paquetería que lleva tu pedido. Para acceder a tus datos, corregirlos, cancelarlos u oponerte a su uso, escríbenos a contacto@elviejito.com.'
    },
    terminos: {
      clave: 'terminos', titulo: 'Términos de venta', actualizado: '2026-11-08T12:00:00-06:00',
      contenido: 'La venta de bebidas alcohólicas en este sitio es sólo para mayores de 18 años. Al pagar confirmas que tienes la edad legal para comprar.\n\nLos precios están en pesos mexicanos e incluyen el IVA del 16 %. El importe que se cobra es el que calcula el sistema con los precios vigentes al momento de pagar.\n\nPuedes recibir tu pedido en tu domicilio, con entrega de 3 a 5 días hábiles, o recogerlo en la tienda de Tototlán, Jalisco. Si tu pedido llega dañado o no corresponde a lo que compraste, escríbenos a contacto@elviejito.com con tu folio.'
    },
    leyenda: {
      clave: 'leyenda', titulo: 'Leyenda de venta a mayores', actualizado: '2026-11-08T12:00:00-06:00',
      contenido: 'Prohibida la venta a menores de edad. El abuso en el consumo de este producto es nocivo para la salud.'
    }
  },
  usuarios: [
    { id: 'u-1', nombre: 'Hiram Acevedo', email: 'hiram@example.com', rol: 'superadmin', estado: 'activo' },
    { id: 'u-2', nombre: 'Marcela López', email: 'marcela@example.com', rol: 'admin', estado: 'activo' },
    { id: 'u-3', nombre: 'Ventas Tototlán', email: 'ventas@example.com', rol: 'admin', estado: 'apagado' }
  ],
  invitaciones: {
    'inv-ejemplo-7Q2F': { nombre: 'Arturo Aguilar', email: 'arturo@example.com', rol: 'admin', vence: '2026-11-13T23:59:00-06:00', usada: false },
    'inv-ejemplo-usada': { nombre: 'Ventas Tototlán', email: 'ventas@example.com', rol: 'admin', vence: '2026-11-01T23:59:00-06:00', usada: true }
  },
  nuevos: 0
}

/* Las tres sesiones de ejemplo del regreso: pagada, abierta sin pagar (pendiente) y caducada. */
function sesionDeEjemplo(id) {
  const p = datos.pedidos.find((x) => x.folio === 'C41D9A7E') || {
    folio: 'C41D9A7E', lineas: [linea('Reposado Suave', 450, 2), linea('Añejo Premium', 680, 1)],
    ...totales([linea('Reposado Suave', 450, 2), linea('Añejo Premium', 680, 1)])
  }
  const base = { folio: p.folio, sesion: id, importe: p.total, lineas: p.lineas, subtotal: p.subtotal, iva: p.iva, envio: p.envio, total: p.total }
  if (id === 'cs_ejemplo_pagada') return { ...base, estado_sesion: 'complete', pago: 'paid' }
  if (id === 'cs_ejemplo_abierta') {
    return { ...base, estado_sesion: 'open', pago: 'unpaid', url: '/pago/confirmado?session_id=cs_ejemplo_pagada', vence: '2026-11-09T18:30:00-06:00' }
  }
  if (id === 'cs_ejemplo_caducada') return { ...base, estado_sesion: 'expired', pago: 'unpaid' }
  return null
}

/* ── Las reglas del servidor ────────────────────────────────────────────── */

async function cotizar(items, metodo_entrega) {
  if (!Array.isArray(items) || items.length === 0) throw new ErrorApi(400, { items: ['El carrito está vacío.'] })
  const productos = useProductosStore()
  await productos.fetchProductos()
  const lineas = items.map((i) => {
    const p = productos.productos.find((x) => x.id === i.producto_id)
    if (!p) throw new ErrorApi(400, { items: [`Producto inexistente o inactivo: ${i.producto_id}`] })
    return { id: p.id, ...linea(p.nombre, Number(p.precio), i.cantidad) }
  })
  return { lineas, ...totales(lineas, metodo_entrega === 'envio' ? COSTO_ENVIO : 0), moneda: 'mxn' }
}

function exigirSesion(token) {
  if (!token) throw new ErrorApi(401, { detail: 'Hace falta la sesión del panel.' })
}

function validarPedido(c) {
  const errores = {}
  if (!c.cliente_nombre?.trim()) errores.cliente_nombre = ['Escribe tu nombre.']
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.cliente_email || '')) errores.cliente_email = ['Escribe un correo válido.']
  if (c.confirma_mayor_de_edad !== true) errores.confirma_mayor_de_edad = ['Confirma que eres mayor de edad.']
  if (c.metodo_entrega === 'envio') {
    const d = c.direccion || {}
    if (!d.calle || !d.colonia || !/^\d{5}$/.test(d.codigo_postal || '') || !d.ciudad) {
      errores.direccion = ['Completa la dirección de entrega.']
    }
  }
  if (Object.keys(errores).length) throw new ErrorApi(400, errores)
}

/* ── El enrutador: misma ruta y mismo método que la API ─────────────────── */

export async function responder(metodo, ruta, cuerpo = {}, token) {
  await espera()
  const [camino, consulta = ''] = ruta.split('?')
  const params = new URLSearchParams(consulta)
  const partes = camino.split('/').filter(Boolean)
  const es = (m, patron) => m === metodo && new RegExp(`^${patron}$`).test(camino)

  if (es('POST', '/pedidos/calcular/')) return cotizar(cuerpo.items, cuerpo.metodo_entrega)

  if (es('POST', '/pedidos/crear/')) {
    validarPedido(cuerpo)
    const cotizacion = await cotizar(cuerpo.items, cuerpo.metodo_entrega)
    datos.nuevos += 1
    return { id: `p-nuevo-${datos.nuevos}`, folio: 'C41D9A7E', ...cotizacion }
  }

  if (es('POST', '/pagos/sesion/')) {
    // en el ejemplo no hay pasarela: la "página de pago" es directamente la pantalla de regreso aprobada
    return { folio: 'C41D9A7E', sesion: 'cs_ejemplo_pagada', importe: null, url: '/pago/confirmado?session_id=cs_ejemplo_pagada' }
  }

  if (es('GET', '/pagos/regreso/')) {
    const sesion = sesionDeEjemplo(params.get('session_id'))
    if (!sesion) throw new ErrorApi(404, { detail: 'No encontramos esa sesión de pago.' })
    return sesion
  }

  if (es('POST', '/pedidos/seguimiento/')) {
    const p = datos.pedidos.find((x) => x.folio === (cuerpo.folio || '').trim().toUpperCase())
    if (!p || p.cliente_email !== (cuerpo.correo || '').trim().toLowerCase()) {
      throw new ErrorApi(404, { detail: 'No encontramos un pedido con esos datos. Revisa el correo y el folio.' })
    }
    return seguimiento(p)
  }
  if (es('GET', '/pedidos/seguimiento/[A-Z0-9]{8}/')) {
    const p = datos.pedidos.find((x) => x.folio === partes[2])
    if (!p || params.get('firma') !== 'firma-de-ejemplo') throw new ErrorApi(404, { detail: 'La liga no es válida.' })
    return seguimiento(p)
  }

  if (es('GET', '/legal/(privacidad|terminos|leyenda)/')) return copia(datos.textos[partes[1]])

  // del aquí en adelante, el panel: piden la sesión
  if (camino.startsWith('/admin/')) exigirSesion(token)

  if (es('GET', '/admin/resumen/')) {
    return {
      pedidos: datos.pedidos.length,
      por_cobrar: datos.pedidos.filter((p) => p.estado_pago === 'pendiente').length,
      envios_por_capturar: datos.pedidos.filter((p) => p.metodo_entrega === 'envio' && !datos.envios[p.id] && ['confirmado', 'pendiente'].includes(p.estado) && p.estado_pago === 'pagado').length,
      usuarios: datos.usuarios.filter((u) => u.estado !== 'invitado').length
    }
  }
  if (es('GET', '/admin/pedidos/')) return copia(datos.pedidos)
  if (es('PATCH', '/admin/pedidos/[\\w-]+/')) {
    const p = datos.pedidos.find((x) => x.id === partes[2])
    if (!p) throw new ErrorApi(404, { detail: 'Ese pedido no existe.' })
    p.estado = cuerpo.estado
    return copia(p)
  }
  if (es('GET', '/admin/envios/')) {
    return datos.pedidos.filter((p) => p.metodo_entrega === 'envio' && p.estado !== 'cancelado')
      .map((p) => ({ pedido_id: p.id, folio: p.folio, cliente_nombre: p.cliente_nombre, estado: p.estado, estado_pago: p.estado_pago, direccion: p.direccion, ...(datos.envios[p.id] || { paqueteria: null, guia: null, fecha_estimada: null, aviso: null }) }))
  }
  if (es('POST', '/admin/envios/[\\w-]+/guia/')) {
    const p = datos.pedidos.find((x) => x.id === partes[2])
    if (!p) throw new ErrorApi(404, { detail: 'Ese pedido no existe.' })
    if (!cuerpo.paqueteria || !cuerpo.guia || !cuerpo.fecha_estimada) throw new ErrorApi(400, { guia: ['Completa paquetería, guía y fecha estimada.'] })
    datos.envios[p.id] = { paqueteria: cuerpo.paqueteria, guia: cuerpo.guia, fecha_estimada: cuerpo.fecha_estimada, aviso: 'en_cola' }
    p.estado = 'enviado'
    return { pedido_id: p.id, folio: p.folio, estado: p.estado, ...datos.envios[p.id] }
  }
  if (es('GET', '/admin/pagos/')) return copia(datos.pagos)
  if (es('GET', '/admin/pagos/[\\w-]+/eventos/')) return copia(datos.eventos[partes[2]] || [])
  if (es('PUT', '/admin/legal/(privacidad|terminos|leyenda)/')) {
    const t = datos.textos[partes[2]]
    if (!cuerpo.contenido?.trim()) throw new ErrorApi(400, { contenido: ['El texto no puede quedar vacío.'] })
    Object.assign(t, { titulo: cuerpo.titulo || t.titulo, contenido: cuerpo.contenido, actualizado: new Date().toISOString() })
    return copia(t)
  }
  if (es('GET', '/admin/usuarios/')) return copia(datos.usuarios)
  if (es('POST', '/admin/usuarios/')) {
    const u = { id: `u-${datos.usuarios.length + 1}`, nombre: cuerpo.nombre, email: cuerpo.email, rol: 'admin', estado: 'activo' }
    datos.usuarios.push(u)
    return copia(u)
  }
  if (es('PATCH', '/admin/usuarios/[\\w-]+/')) {
    const u = datos.usuarios.find((x) => x.id === partes[2])
    if (u.rol === 'superadmin') throw new ErrorApi(403, { detail: 'La cuenta del superadministrador no se apaga ni cambia de rol.' })
    Object.assign(u, cuerpo)
    return copia(u)
  }
  if (es('DELETE', '/admin/usuarios/[\\w-]+/')) {
    const u = datos.usuarios.find((x) => x.id === partes[2])
    if (u.rol === 'superadmin') throw new ErrorApi(403, { detail: 'La cuenta del superadministrador no se puede borrar.' })
    datos.usuarios = datos.usuarios.filter((x) => x.id !== partes[2])
    return {}
  }
  if (es('POST', '/admin/invitaciones/')) {
    // la primera invitación de la sesión es la de los bocetos de la 2.3; las siguientes llevan otra clave
    const clave = datos.usuarios.some((u) => u.liga?.includes('7Q2F')) ? `inv-ejemplo-${datos.usuarios.length + 1}K8M` : 'inv-ejemplo-7Q2F'
    const vence = '2026-11-13T23:59:00-06:00'
    datos.invitaciones[clave] = { nombre: cuerpo.nombre, email: cuerpo.email, rol: 'admin', vence, usada: false }
    datos.usuarios.push({ id: `u-${datos.usuarios.length + 1}`, nombre: cuerpo.nombre, email: cuerpo.email, rol: 'admin', estado: 'invitado', vence, liga: `/admin/registro?invitacion=${clave}` })
    return { liga: `/admin/registro?invitacion=${clave}`, vence }
  }
  if (es('GET', '/invitaciones/[\\w-]+/')) {
    const inv = datos.invitaciones[partes[1]]
    if (!inv || inv.usada) throw new ErrorApi(410, { detail: 'La invitación ya se usó o venció. Pide una nueva a quien te invitó.' })
    return { nombre: inv.nombre, email: inv.email, rol: inv.rol, vence: inv.vence }
  }
  if (es('POST', '/invitaciones/[\\w-]+/')) {
    const inv = datos.invitaciones[partes[1]]
    if (!inv || inv.usada) throw new ErrorApi(410, { detail: 'La invitación ya se usó o venció. Pide una nueva a quien te invitó.' })
    if ((cuerpo.contrasena || '').length < 10) throw new ErrorApi(400, { contrasena: ['Usa al menos 10 caracteres.'] })
    inv.usada = true
    const u = datos.usuarios.find((x) => x.email === inv.email)
    if (u) Object.assign(u, { estado: 'activo', nombre: cuerpo.nombre || u.nombre, liga: null, vence: null })
    return { ok: true }
  }

  throw new ErrorApi(404, { detail: `Ruta sin ejemplo: ${metodo} ${camino}` })
}

function seguimiento(p) {
  return {
    folio: p.folio, creado: p.creado, estado: p.estado, estado_pago: p.estado_pago, metodo_entrega: p.metodo_entrega,
    lineas: p.lineas, subtotal: p.subtotal, iva: p.iva, envio: p.envio, total: p.total,
    historial: datos.historial[p.folio] || [],
    envio_info: datos.envios[p.id] ? { paqueteria: datos.envios[p.id].paqueteria, guia: datos.envios[p.id].guia, fecha_estimada: datos.envios[p.id].fecha_estimada } : null
  }
}
