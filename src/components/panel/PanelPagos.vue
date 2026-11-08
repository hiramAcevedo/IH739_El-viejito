<template>
  <section class="panel-seccion">
    <div class="panel-cabeza">
      <h2 class="panel-titulo">Pagos</h2>
      <p class="panel-nota">Sólo lectura: cada intento de cobro y los avisos que mandó la pasarela.</p>
    </div>

    <p v-if="cargando" class="panel-nota">Cargando pagos…</p>
    <p v-else-if="error" class="panel-error" role="alert">{{ error }}</p>

    <div v-else class="pagos">
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead>
            <tr><th>Fecha</th><th>Pedido</th><th>Pasarela</th><th>Referencia</th><th class="num">Monto</th><th>Estado</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in pagos" :key="p.id" :class="{ elegido: elegido?.id === p.id }" tabindex="0"
              @click="abrir(p)" @keydown.enter="abrir(p)">
              <td>{{ formatoFechaHora(p.creado) }}</td>
              <td class="mono">#{{ p.folio }}</td>
              <td>{{ p.proveedor === 'stripe' ? 'Stripe' : p.proveedor }}</td>
              <td class="mono referencia">{{ p.referencia }}</td>
              <td class="num">{{ formatoMoneda(p.importe) }}</td>
              <td><span :class="['intento', `intento-${p.estado}`]">{{ ESTADOS[p.estado] }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <aside v-if="elegido" class="eventos" aria-live="polite">
        <h3>Avisos de la pasarela · #{{ elegido.folio }}</h3>
        <p v-if="cargandoEventos" class="panel-nota">Cargando avisos…</p>
        <p v-else-if="!eventos.length" class="panel-nota">Este intento todavía no recibe avisos.</p>
        <ol v-else class="eventos__lista">
          <li v-for="(e, i) in eventos" :key="i" :class="{ duplicado: !e.aplicado }">
            <span class="mono">{{ e.tipo }}</span>
            <small>{{ formatoFechaHora(e.recibido) }} · clave {{ e.clave }}</small>
            <strong>{{ e.aplicado ? 'Aplicado' : 'Repetido: no se aplicó otra vez' }}</strong>
          </li>
        </ol>
      </aside>
    </div>
  </section>
</template>

<script setup>
/**
 * Pagos del panel, de sólo lectura: los intentos de la tabla pagos y, al abrir uno, los avisos de pagos_eventos con su
 * clave de idempotencia. Un aviso repetido aparece, pero marcado como no aplicado.
 */
import { ref, onMounted } from 'vue'
import { listarPagos, eventosDePago } from '@/lib/api'
import { formatoMoneda, formatoFechaHora } from '@/lib/formato'
import { useAuthStore } from '@/stores/authStore'

const ESTADOS = { creado: 'Creado', pagado: 'Pagado', fallido: 'Fallido', expirado: 'Expirado', reembolsado: 'Reembolsado' }
const auth = useAuthStore()
const pagos = ref([])
const elegido = ref(null)
const eventos = ref([])
const cargando = ref(true)
const cargandoEventos = ref(false)
const error = ref('')

async function abrir(pago) {
  elegido.value = pago
  cargandoEventos.value = true
  try {
    eventos.value = await eventosDePago(await auth.token(), pago.id)
  } finally {
    cargandoEventos.value = false
  }
}

onMounted(async () => {
  try {
    pagos.value = await listarPagos(await auth.token())
    const conDuplicado = pagos.value.find((p) => p.folio === '3F9A1C27') || pagos.value[0]
    if (conDuplicado) abrir(conDuplicado)
  } catch (e) {
    error.value = e.message || 'No pudimos cargar los pagos.'
  } finally {
    cargando.value = false
  }
})
</script>

<style scoped>
.panel-seccion { background: var(--color-blanco); padding: var(--espacio-6); border-radius: var(--radio-grande); box-shadow: var(--sombra); }
.panel-cabeza { margin-bottom: var(--espacio-4); }
.panel-titulo { font-family: var(--fuente-titulos); font-size: 1.5rem; color: var(--color-texto); }
.panel-nota { color: var(--color-texto-2); font-size: 0.9rem; margin-top: var(--espacio-2); }
.panel-error { color: var(--color-error); }
.pagos { display: grid; grid-template-columns: 1fr; gap: var(--espacio-5); }
.tabla-envoltura { overflow-x: auto; }
.tabla { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.tabla th { text-align: left; padding: 0.65rem 0.75rem; background: var(--color-crema-oscuro); color: var(--color-texto); white-space: nowrap; }
.tabla td { padding: 0.65rem 0.75rem; border-bottom: 1px solid var(--color-borde); color: var(--color-texto); white-space: nowrap; }
.tabla tbody tr { cursor: pointer; }
.tabla tbody tr:hover, .tabla tbody tr.elegido { background: var(--color-crema); }
.tabla tbody tr:focus-visible { outline: none; box-shadow: inset var(--enfoque); }
.num { text-align: right; }
.mono { font-family: var(--fuente-mono); }
.referencia { font-size: 0.8rem; color: var(--color-texto-2); }
.intento { padding: 0.15rem 0.55rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; }
.intento-pagado { background: #e8f5e9; color: #1b5e20; }
.intento-creado { background: #fff4d6; color: var(--color-aviso); }
.intento-fallido { background: #fdecea; color: var(--color-error); }
.intento-expirado { background: #eceff1; color: #37474f; }
.intento-reembolsado { background: #eceff1; color: #37474f; }
.eventos { border: 1px solid var(--color-borde); border-radius: var(--radio-grande); padding: var(--espacio-4); background: var(--color-crema); }
.eventos h3 { font-size: 1rem; color: var(--color-texto); margin-bottom: var(--espacio-3); }
.eventos__lista { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--espacio-2); }
.eventos__lista li { display: grid; gap: 2px; background: var(--color-blanco); border: 1px solid var(--color-borde); border-left: 4px solid #1b5e20; border-radius: var(--radio); padding: var(--espacio-2) var(--espacio-3); }
.eventos__lista li.duplicado { border-left-color: var(--color-aviso); }
.eventos__lista small { color: var(--color-texto-2); }
.eventos__lista strong { font-size: 0.85rem; color: var(--color-texto); }
@media (min-width: 1100px) { .pagos { grid-template-columns: 1.6fr 1fr; } }
@media (max-width: 600px) { .panel-seccion { padding: var(--espacio-4); } }
</style>
