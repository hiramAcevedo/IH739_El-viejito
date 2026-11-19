<template>
  <main class="correos">
    <header class="correos__cabeza">
      <h1>Correos del pedido</h1>
      <p>Las plantillas de <code>correos/</code> con datos de ejemplo. Sólo existe en el servidor de desarrollo; el envío real
        necesita un servicio de correo y no forma parte de este sprint.</p>
    </header>
    <div class="correos__rejilla">
      <figure v-for="c in correos" :key="c.archivo" class="correo">
        <figcaption>{{ c.titulo }} <code>{{ c.archivo }}</code></figcaption>
        <iframe :srcdoc="c.html" :title="c.titulo" loading="lazy"></iframe>
      </figure>
    </div>
  </main>
</template>

<script setup>
/** Vista previa de los tres correos con datos de ejemplo, para revisar su maquetado en el sitio. */
import confirmacion from '../../correos/confirmacion.html?raw'
import pendiente from '../../correos/pago-pendiente.html?raw'
import envio from '../../correos/aviso-envio.html?raw'

const LEYENDA = 'Prohibida la venta a menores de edad. El abuso en el consumo de este producto es nocivo para la salud.'
const LINEAS = [
  { nombre: 'Reposado Suave', cantidad: 2, subtotal: '900.00' },
  { nombre: 'Añejo Premium', cantidad: 1, subtotal: '680.00' }
]
const comun = { nombre: 'Laura', folio: 'C41D9A7E', leyenda: LEYENDA, liga_seguimiento: '#' }

/** Reemplaza {{ dato }} y el bucle de las líneas, como lo hará la plantilla en la API. */
function llenar(html, datos) {
  const conLineas = html.replace(/\{% for linea in lineas %\}([\s\S]*?)\{% endfor %\}/, (_, fila) =>
    (datos.lineas || []).map((l) => fila.replace(/\{\{ linea\.(\w+) \}\}/g, (_, k) => l[k])).join(''))
  return conLineas.replace(/\{\{ (\w+) \}\}/g, (_, k) => datos[k] ?? '')
}

const correos = [
  { titulo: 'Confirmación del pedido', archivo: 'confirmacion.html',
    html: llenar(confirmacion, { ...comun, lineas: LINEAS, subtotal: '1,580.00', iva: '252.80', envio: 'Sin costo', total: '1,832.80' }) },
  { titulo: 'Pago pendiente', archivo: 'pago-pendiente.html',
    html: llenar(pendiente, { ...comun, total: '1,832.80', liga_pago: '#', vence: '9 de noviembre a las 18:30' }) },
  { titulo: 'Aviso de envío', archivo: 'aviso-envio.html',
    html: llenar(envio, { ...comun, nombre: 'Rosa', folio: '9C61F2A4', paqueteria: 'Estafeta', guia: '9302 1847 5520', fecha_estimada: '12 de noviembre' }) }
]
</script>

<style scoped>
.correos { max-width: 1400px; margin: 0 auto; padding: 6rem var(--espacio-4) var(--espacio-8); }
.correos__cabeza h1 { font-family: var(--fuente-titulos); font-size: 2.1rem; color: var(--color-texto); }
.correos__cabeza p { color: var(--color-texto-2); margin: var(--espacio-2) 0 var(--espacio-5); }
.correos__rejilla { display: grid; grid-template-columns: repeat(auto-fit, minmax(660px, 1fr)); gap: var(--espacio-5); }
.correo { margin: 0; }
.correo figcaption { font-weight: 700; color: var(--color-texto); margin-bottom: var(--espacio-2); }
.correo figcaption code { font-weight: 400; color: var(--color-texto-2); font-size: 0.85rem; }
.correo iframe { width: 100%; height: 790px; border: 1px solid var(--color-borde); border-radius: var(--radio-grande); background: var(--color-crema-oscuro); }
</style>
