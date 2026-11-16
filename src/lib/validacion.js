/**
 * Validaciones de formato que comparten los formularios del sitio. La API repite las mismas reglas: aquí sólo sirven
 * para avisar antes de enviar.
 */

/** Un correo con algo antes y después de la arroba y un punto en el dominio. */
export const esCorreoValido = (correo) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(correo ?? '').trim())

/** El folio: los primeros ocho caracteres del id del pedido, en hexadecimal, como lo valida la API. */
export const esFolioValido = (folio) => /^[0-9A-F]{8}$/i.test(String(folio ?? '').trim())
