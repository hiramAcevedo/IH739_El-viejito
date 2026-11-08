<template>
  <main class="detalle">
    <div class="detalle__caja">
      <p v-if="cargando" class="detalle__texto" aria-live="polite">Buscando tu pedido…</p>

      <template v-else-if="error">
        <h1>No pudimos abrir el pedido</h1>
        <p class="detalle__texto">{{ error }}</p>
        <BotonPrimario to="/seguimiento" bloque>Buscar con correo y folio</BotonPrimario>
      </template>

      <template v-else-if="pedido">
        <h1 class="detalle__titulo">Pedido <span>#{{ pedido.folio }}</span></h1>
        <EstadoPago :estado="pedido.estado_pago" />
        <LineaSeguimiento :pasos="pasos" />
        <div v-if="pedido.envio_info" class="detalle__envio">
          <p class="detalle__etiqueta">Paquetería</p>
          <p class="detalle__paqueteria">{{ pedido.envio_info.paqueteria }}</p>
          <p class="detalle__guia">Guía {{ pedido.envio_info.guia }}</p>
        </div>
        <p v-else-if="pedido.metodo_entrega === 'recoger'" class="detalle__texto">Lo recoges en la tienda de Tototlán, Jalisco.</p>
        <ResumenPedido :cotizacion="pedido" titulo="Tu pedido" />
      </template>
    </div>
  </main>
</template>

<script setup>
/**
 * Detalle del seguimiento · se abre desde Rastrear pedido o desde la liga del correo de confirmación, que lleva una
 * firma que la API comprueba. Muestra la línea de estados, el pago, la paquetería con la guía y el resumen.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { consultarSeguimientoFirmado } from '@/lib/api'
import BotonPrimario from '@/components/compartidos/BotonPrimario.vue'
import ResumenPedido from '@/components/compartidos/ResumenPedido.vue'
import EstadoPago from '@/components/compartidos/EstadoPago.vue'
import LineaSeguimiento from '@/components/compartidos/LineaSeguimiento.vue'

const route = useRoute()
const pedido = ref(null)
const cargando = ref(true)
const error = ref('')

const ETAPAS = [
  { estado: 'pagado', etiqueta: 'Pagado' },
  { estado: 'confirmado', etiqueta: 'Confirmado' },
  { estado: 'enviado', etiqueta: 'Enviado' },
  { estado: 'entregado', etiqueta: 'Entregado' }
]

const pasos = computed(() => {
  const historial = pedido.value?.historial || []
  const lista = ETAPAS.map((e) => {
    const hecho = historial.find((h) => h.estado === e.estado)
    return { etiqueta: e.etiqueta, fecha: hecho?.fecha, hecho: Boolean(hecho) }
  })
  const estimada = pedido.value?.envio_info?.fecha_estimada
  if (estimada && !historial.some((h) => h.estado === 'entregado')) {
    lista[3] = { etiqueta: 'Entrega estimada', fecha: `${estimada}T12:00:00-06:00`, hecho: false }
  }
  return lista
})

onMounted(async () => {
  const folio = String(route.params.folio).toUpperCase()
  const guardado = sessionStorage.getItem(`seguimiento-${folio}`)
  try {
    if (guardado) pedido.value = JSON.parse(guardado)
    else if (route.query.firma) pedido.value = await consultarSeguimientoFirmado(folio, route.query.firma)
    else error.value = 'Para ver un pedido escribe el correo de tu compra y el folio.'
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.detalle { min-height: 100vh; background: var(--color-crema); padding: 6.5rem var(--espacio-4) var(--espacio-8); }
.detalle__caja { max-width: 520px; margin: 0 auto; background: var(--color-blanco); border-radius: var(--radio-grande); box-shadow: var(--sombra); padding: var(--espacio-6) var(--espacio-5); display: flex; flex-direction: column; gap: var(--espacio-4); }
.detalle__caja > .pago { align-self: flex-start; }
.detalle h1 { font-family: var(--fuente-titulos); font-size: 1.9rem; color: var(--color-texto); }
.detalle__titulo span { font-family: var(--fuente-mono); letter-spacing: 0.03em; }
.detalle__texto { color: var(--color-texto-2); }
.detalle__envio { background: var(--color-crema-oscuro); border: 1px solid var(--color-borde); border-radius: var(--radio-grande); padding: var(--espacio-4); }
.detalle__etiqueta { color: var(--color-texto-2); font-size: 0.9rem; }
.detalle__paqueteria { color: var(--color-texto); font-weight: 600; }
.detalle__guia { font-family: var(--fuente-mono); font-size: 1.2rem; font-weight: 700; color: var(--color-texto); margin-top: var(--espacio-1); }
</style>
