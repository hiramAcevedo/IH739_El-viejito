<template>
  <section class="panel-seccion">
    <div class="panel-cabeza">
      <h2 class="panel-titulo">Envíos</h2>
      <p class="panel-nota">Al registrar la guía, el pedido pasa a enviado y el aviso de envío queda en la cola de correos.</p>
    </div>

    <p v-if="cargando" class="panel-nota">Cargando envíos…</p>
    <p v-else-if="error" class="panel-error" role="alert">{{ error }}</p>

    <div v-else class="envios">
      <article v-for="e in envios" :key="e.pedido_id" :class="['envio', { 'envio--pendiente': !e.guia }]">
        <header class="envio__cabeza">
          <span class="folio">#{{ e.folio }}</span>
          <span :class="['estado-tag', `estado-${e.estado}`]">{{ e.estado }}</span>
          <EstadoPago :estado="e.estado_pago" pequeno />
        </header>
        <p class="envio__cliente"><strong>{{ e.cliente_nombre }}</strong></p>
        <p class="envio__direccion">
          {{ e.direccion.calle }}, col. {{ e.direccion.colonia }}, C. P. {{ e.direccion.codigo_postal }},
          {{ e.direccion.ciudad }}, {{ e.direccion.estado }}
        </p>

        <dl v-if="e.guia" class="envio__guia">
          <div><dt>Paquetería</dt><dd>{{ e.paqueteria }}</dd></div>
          <div><dt>Guía</dt><dd class="mono">{{ e.guia }}</dd></div>
          <div><dt>Entrega estimada</dt><dd>{{ formatoFecha(`${e.fecha_estimada}T12:00:00-06:00`, { day: 'numeric', month: 'long' }) }}</dd></div>
          <div v-if="e.aviso"><dt>Aviso de envío</dt><dd>en la cola de correos</dd></div>
        </dl>

        <form v-else-if="e.estado_pago === 'pagado'" class="envio__form" @submit.prevent="registrar(e)">
          <label>Paquetería
            <select v-model="formas[e.pedido_id].paqueteria" required>
              <option value="" disabled>Elige</option>
              <option v-for="p in PAQUETERIAS" :key="p">{{ p }}</option>
            </select>
          </label>
          <label>Número de guía
            <input v-model.trim="formas[e.pedido_id].guia" required inputmode="numeric" />
          </label>
          <label>Entrega estimada
            <input v-model="formas[e.pedido_id].fecha_estimada" type="date" required />
          </label>
          <BotonPrimario type="submit" :cargando="guardando === e.pedido_id">Registrar guía y avisar</BotonPrimario>
        </form>
        <p v-else class="panel-nota">La guía se captura cuando el pago esté confirmado.</p>
      </article>
    </div>
  </section>
</template>

<script setup>
/**
 * Envíos del panel: los pedidos con envío a domicilio, con su dirección en campos propios. Capturar paquetería,
 * guía y fecha estimada mueve el pedido a enviado y deja el aviso de envío en la cola de correos.
 */
import { ref, reactive, onMounted } from 'vue'
import { listarEnvios, registrarGuia } from '@/lib/api'
import { formatoFecha } from '@/lib/formato'
import { useAuthStore } from '@/stores/authStore'
import EstadoPago from '@/components/compartidos/EstadoPago.vue'
import BotonPrimario from '@/components/compartidos/BotonPrimario.vue'

const PAQUETERIAS = ['Estafeta', 'DHL', 'FedEx', 'Paquetexpress']
const auth = useAuthStore()
const envios = ref([])
const formas = reactive({})
const cargando = ref(true)
const guardando = ref(null)
const error = ref('')

async function cargar() {
  cargando.value = true
  try {
    envios.value = await listarEnvios(await auth.token())
    for (const e of envios.value) formas[e.pedido_id] ??= { paqueteria: '', guia: '', fecha_estimada: '' }
  } catch (e) {
    error.value = e.message || 'No pudimos cargar los envíos.'
  } finally {
    cargando.value = false
  }
}

async function registrar(envio) {
  guardando.value = envio.pedido_id
  error.value = ''
  try {
    const r = await registrarGuia(await auth.token(), envio.pedido_id, formas[envio.pedido_id])
    Object.assign(envio, r)
  } catch (e) {
    error.value = e.message
  } finally {
    guardando.value = null
  }
}

onMounted(cargar)
</script>

<style scoped>
.panel-seccion { background: var(--color-blanco); padding: var(--espacio-6); border-radius: var(--radio-grande); box-shadow: var(--sombra); }
.panel-cabeza { margin-bottom: var(--espacio-4); }
.panel-titulo { font-family: var(--fuente-titulos); font-size: 1.5rem; color: var(--color-texto); }
.panel-nota { color: var(--color-texto-2); font-size: 0.9rem; margin-top: var(--espacio-2); }
.panel-error { color: var(--color-error); }
.envios { display: grid; gap: var(--espacio-4); }
.envio { border: 1px solid var(--color-borde); border-radius: var(--radio-grande); padding: var(--espacio-4); }
.envio--pendiente { border: 2px solid var(--color-dorado); }
.envio__cabeza { display: flex; flex-wrap: wrap; align-items: center; gap: var(--espacio-2); margin-bottom: var(--espacio-2); }
.folio, .mono { font-family: var(--fuente-mono); font-weight: 700; }
.envio__cliente { color: var(--color-texto); }
.envio__direccion { color: var(--color-texto-2); font-size: 0.92rem; margin-bottom: var(--espacio-3); }
.envio__guia { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--espacio-3); background: var(--color-crema); border-radius: var(--radio); padding: var(--espacio-3); margin: 0; }
.envio__guia dt { color: var(--color-texto-2); font-size: 0.8rem; }
.envio__guia dd { margin: 0; color: var(--color-texto); font-weight: 600; }
.envio__form { display: grid; grid-template-columns: 1fr; gap: var(--espacio-3); align-items: end; }
.envio__form label { display: flex; flex-direction: column; gap: var(--espacio-1); font-size: 0.85rem; font-weight: 600; color: var(--color-texto-2); }
.envio__form input, .envio__form select { padding: 0.6rem; border: 1px solid #c9c2b4; border-radius: var(--radio); font: inherit; color: var(--color-texto); background: var(--color-crema); }
.envio__form input:focus, .envio__form select:focus { outline: none; border-color: var(--color-texto); box-shadow: var(--enfoque); }
.estado-tag { padding: 0.15rem 0.55rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
.estado-confirmado { background: #e3f2fd; color: #0d47a1; }
.estado-enviado { background: #f3e5f5; color: #6a1b9a; }
.estado-entregado { background: #e8f5e9; color: #1b5e20; }
.estado-pendiente { background: #fff3e0; color: #8a4b00; }
@media (min-width: 900px) { .envio__form { grid-template-columns: 1fr 1fr 1fr auto; } }
@media (max-width: 600px) { .panel-seccion { padding: var(--espacio-4); } }
</style>
