# Plantillas de los correos

Los tres correos del pedido, maquetados en el sitio y pensados para que la API los use tal cual: HTML con estilos en
línea y tablas, que es lo que respetan los clientes de correo, y los datos entre llaves dobles (`{{ folio }}`), la
sintaxis de las plantillas de Django.

| Archivo | Cuándo sale | Datos |
|---|---|---|
| `confirmacion.html` | Al confirmarse el pago | `nombre`, `folio`, `lineas`, `subtotal`, `iva`, `envio`, `total`, `liga_seguimiento` |
| `pago-pendiente.html` | Cuando el pago queda pendiente | `nombre`, `folio`, `total`, `liga_pago`, `vence` |
| `aviso-envio.html` | Al registrar la guía en Envíos | `nombre`, `folio`, `paqueteria`, `guia`, `fecha_estimada`, `liga_seguimiento` |

En el servidor de desarrollo se ven con datos de ejemplo en `/correos`. La API dejará cada aviso en la cola
`notificaciones_pedido`; el envío real necesita un servicio de correo y no forma parte de este sprint.
