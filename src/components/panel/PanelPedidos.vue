<template>
  <section class="panel-seccion">
    <div class="panel-cabeza">
      <h2 class="panel-titulo">Pedidos</h2>
      <div class="selector-vista" role="group" aria-label="Vista de pedidos">
        <button :class="{ activo: vista === 'tarjetas' }" :aria-pressed="vista === 'tarjetas'" @click="vista = 'tarjetas'">Tarjetas</button>
        <button :class="{ activo: vista === 'tabla' }" :aria-pressed="vista === 'tabla'" @click="vista = 'tabla'">Tabla</button>
      </div>
    </div>

    <div class="filtros" role="group" aria-label="Filtrar por estado">
      <button v-for="f in FILTROS" :key="f.valor" :class="['filtro', { activo: filtro === f.valor }]" @click="filtro = f.valor">
        {{ f.etiqueta }}
      </button>
    </div>

    <p v-if="cargando" class="panel-nota">Cargando pedidos…</p>
    <p v-else-if="error" class="panel-error" role="alert">{{ error }}</p>
    <p v-else-if="!visibles.length" class="panel-nota">No hay pedidos con ese estado.</p>

    <div v-else-if="vista === 'tabla'" class="tabla-envoltura">
      <table class="tabla">
        <thead>
          <tr>
            <th>Folio</th>
            <th>
              <button class="orden" :aria-label="`Ordenar por fecha, ${recientes ? 'más antiguos primero' : 'más recientes primero'}`" @click="recientes = !recientes">
                Fecha <component :is="recientes ? ChevronDown : ChevronUp" :size="16" />
              </button>
            </th>
            <th>Cliente</th>
            <th class="num">Total</th>
            <th>Pago</th>
            <th>Estado</th>
            <th>Entrega</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in visibles" :key="p.id">
            <td class="folio">#{{ p.folio }}</td>
            <td>{{ formatoFecha(p.creado) }}</td>
            <td>{{ p.cliente_nombre }}</td>
            <td class="num">{{ formatoMoneda(p.total) }}</td>
            <td><EstadoPago :estado="p.estado_pago" pequeno titulo="Lo escribe el aviso de la pasarela; no se edita" /></td>
            <td>
              <select :value="p.estado" class="select-estado" :aria-label="`Estado del pedido ${p.folio}`" @change="cambiar(p, $event.target.value)">
                <option v-for="e in ESTADOS" :key="e" :value="e">{{ etiqueta(e) }}</option>
              </select>
            </td>
            <td>{{ p.metodo_entrega === 'envio' ? 'Envío' : 'Recoger' }}</td>
          </tr>
        </tbody>
      </table>
      <p class="panel-nota">El estado del pago se lee de la pasarela; no se edita.</p>
    </div>

    <div v-else class="tarjetas">
      <article v-for="p in visibles" :key="p.id" class="tarjeta">
        <header class="tarjeta__cabeza">
          <span class="folio">#{{ p.folio }}</span>
          <span :class="['estado-tag', `estado-${p.estado}`]">{{ etiqueta(p.estado) }}</span>
          <EstadoPago :estado="p.estado_pago" pequeno />
          <span class="tarjeta__fecha">{{ formatoFechaHora(p.creado) }}</span>
        </header>
        <p class="tarjeta__cliente"><strong>{{ p.cliente_nombre }}</strong> · {{ p.cliente_email }}</p>
        <p class="tarjeta__entrega">
          <Truck v-if="p.metodo_entrega === 'envio'" :size="14" /><Store v-else :size="14" />
          {{ p.metodo_entrega === 'envio' ? 'Envío a domicilio' : 'Recoger en tienda' }}
        </p>
        <ul class="tarjeta__lineas">
          <li v-for="l in p.lineas" :key="l.nombre"><span>{{ l.nombre }} ×{{ l.cantidad }}</span><span>{{ formatoMoneda(l.subtotal) }}</span></li>
        </ul>
        <footer class="tarjeta__pie">
          <strong>Total: {{ formatoMoneda(p.total) }}</strong>
          <select :value="p.estado" class="select-estado" :aria-label="`Estado del pedido ${p.folio}`" @change="cambiar(p, $event.target.value)">
            <option v-for="e in ESTADOS" :key="e" :value="e">{{ etiqueta(e) }}</option>
          </select>
        </footer>
      </article>
    </div>
  </section>
</template>

<script setup>
/**
 * Pedidos del panel. Cada pedido lleva dos estados: el logístico, que el administrador mueve con el selector, y el
 * del pago, que llega de la pasarela y se muestra sin permitir editarlo. Tarjetas o tabla ordenable por fecha.
 */
import { ref, computed, onMounted } from 'vue'
import { ChevronDown, ChevronUp, Truck, Store } from 'lucide-vue-next'
import { listarPedidos, cambiarEstadoPedido } from '@/lib/api'
import { formatoMoneda, formatoFecha, formatoFechaHora } from '@/lib/formato'
import { useAuthStore } from '@/stores/authStore'
import EstadoPago from '@/components/compartidos/EstadoPago.vue'

const emit = defineEmits(['cargados'])
const auth = useAuthStore()
const pedidos = ref([])
const cargando = ref(true)
const error = ref('')
const vista = ref('tabla')
const filtro = ref('todos')
const recientes = ref(true)

const ESTADOS = ['pendiente', 'confirmado', 'enviado', 'entregado', 'cancelado']
const FILTROS = [{ valor: 'todos', etiqueta: 'Todos' }, ...ESTADOS.map((e) => ({ valor: e, etiqueta: etiqueta(e) }))]
function etiqueta(e) { return e.charAt(0).toUpperCase() + e.slice(1) }

const visibles = computed(() => {
  const lista = filtro.value === 'todos' ? pedidos.value : pedidos.value.filter((p) => p.estado === filtro.value)
  return [...lista].sort((a, b) => (recientes.value ? -1 : 1) * (new Date(a.creado) - new Date(b.creado)))
})

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    pedidos.value = await listarPedidos(await auth.token())
    emit('cargados', pedidos.value)
  } catch (e) {
    error.value = e.message || 'No pudimos cargar los pedidos.'
  } finally {
    cargando.value = false
  }
}

async function cambiar(pedido, estado) {
  try {
    const actualizado = await cambiarEstadoPedido(await auth.token(), pedido.id, estado)
    pedido.estado = actualizado.estado
  } catch (e) {
    error.value = e.message || 'No pudimos cambiar el estado.'
  }
}

onMounted(cargar)
</script>

<style scoped>
.panel-seccion { background: var(--color-blanco); padding: var(--espacio-6); border-radius: var(--radio-grande); box-shadow: var(--sombra); }
.panel-cabeza { display: flex; justify-content: space-between; align-items: center; gap: var(--espacio-4); flex-wrap: wrap; margin-bottom: var(--espacio-4); }
.panel-titulo { font-family: var(--fuente-titulos); font-size: 1.5rem; color: var(--color-texto); }
.panel-nota { color: var(--color-texto-2); font-size: 0.9rem; margin-top: var(--espacio-3); }
.panel-error { color: var(--color-error); }
.selector-vista { display: inline-flex; border: 2px solid var(--color-texto); border-radius: var(--radio); overflow: hidden; }
.selector-vista button { padding: 0.45rem 1rem; border: none; background: var(--color-blanco); color: var(--color-texto); font-weight: 600; cursor: pointer; }
.selector-vista button.activo { background: var(--color-texto); color: var(--color-crema); }
.selector-vista button:focus-visible, .filtro:focus-visible, .orden:focus-visible, .select-estado:focus-visible { outline: none; box-shadow: var(--enfoque); }
.filtros { display: flex; flex-wrap: wrap; gap: var(--espacio-2); margin-bottom: var(--espacio-4); }
.filtro { padding: 0.4rem 0.9rem; border: 1px solid #c9c2b4; background: var(--color-blanco); border-radius: var(--radio-pildora); font-size: 0.85rem; font-weight: 600; color: var(--color-texto-2); cursor: pointer; }
.filtro.activo { background: var(--color-dorado); border-color: var(--color-dorado); color: var(--color-texto); }
.tabla-envoltura { overflow-x: auto; }
.tabla { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
.tabla th { text-align: left; padding: 0.7rem 0.8rem; background: var(--color-crema-oscuro); color: var(--color-texto); font-weight: 700; white-space: nowrap; }
.tabla td { padding: 0.7rem 0.8rem; border-bottom: 1px solid var(--color-borde); color: var(--color-texto); vertical-align: middle; white-space: nowrap; }
.num { text-align: right; }
.folio { font-family: var(--fuente-mono); font-weight: 700; }
.orden { display: inline-flex; align-items: center; gap: 2px; background: none; border: none; font: inherit; font-weight: 700; color: inherit; cursor: pointer; padding: 0; }
.select-estado { padding: 0.35rem 0.6rem; border: 1px solid #c9c2b4; border-radius: var(--radio); background: var(--color-blanco); color: var(--color-texto); font-weight: 600; font-size: 0.85rem; }
.tarjetas { display: grid; gap: var(--espacio-4); }
.tarjeta { border: 1px solid var(--color-borde); border-radius: var(--radio-grande); padding: var(--espacio-4); }
.tarjeta__cabeza { display: flex; flex-wrap: wrap; align-items: center; gap: var(--espacio-2); margin-bottom: var(--espacio-2); }
.tarjeta__fecha { margin-left: auto; color: var(--color-texto-2); font-size: 0.85rem; }
.tarjeta__cliente, .tarjeta__entrega { color: var(--color-texto-2); font-size: 0.9rem; display: flex; align-items: center; gap: 0.35rem; }
.tarjeta__lineas { list-style: none; padding: var(--espacio-3); margin: var(--espacio-3) 0; background: var(--color-crema); border-radius: var(--radio); }
.tarjeta__lineas li { display: flex; justify-content: space-between; font-size: 0.88rem; color: var(--color-texto); padding: 2px 0; }
.tarjeta__pie { display: flex; justify-content: space-between; align-items: center; }
.estado-tag { padding: 0.15rem 0.55rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
.estado-pendiente { background: #fff3e0; color: #8a4b00; }
.estado-confirmado { background: #e3f2fd; color: #0d47a1; }
.estado-enviado { background: #f3e5f5; color: #6a1b9a; }
.estado-entregado { background: #e8f5e9; color: #1b5e20; }
.estado-cancelado { background: #fbe9e7; color: #b3261e; }
@media (max-width: 600px) { .panel-seccion { padding: var(--espacio-4); } }
</style>
