<template>
  <main class="regreso">
    <div class="regreso__caja" aria-live="polite">
      <template v-if="cargando">
        <EstadoPago estado="confirmando" forma="larga" />
        <h1>Revisando tu pago</h1>
        <p class="regreso__texto">Le preguntamos al sistema en qué estado quedó tu pedido.</p>
      </template>

      <template v-else-if="fallo">
        <h1>No encontramos ese pago</h1>
        <p class="regreso__texto">{{ fallo }}</p>
        <BotonPrimario to="/carrito" bloque>Volver al carrito</BotonPrimario>
      </template>

      <template v-else-if="estado === 'confirmado'">
        <EstadoPago estado="pagado" forma="larga" />
        <h1>Gracias por tu compra</h1>
        <p class="regreso__folio-etiqueta">Folio</p>
        <p class="regreso__folio">#{{ datos.folio }}</p>
        <p class="regreso__texto">Guarda tu folio: con él y tu correo puedes seguir tu pedido.</p>
        <ResumenPedido :cotizacion="datos" titulo="" />
        <BotonPrimario to="/seguimiento" bloque>Seguir mi pedido</BotonPrimario>
        <RouterLink to="/productos" class="regreso__liga">Seguir comprando</RouterLink>
      </template>

      <template v-else-if="estado === 'pendiente'">
        <EstadoPago estado="pendiente" forma="larga" />
        <h1>Completa tu pago</h1>
        <p class="regreso__folio-etiqueta">Folio</p>
        <p class="regreso__folio">#{{ datos.folio }}</p>
        <div class="regreso__recuadro">
          <p>Tu pedido está registrado, pero el pago todavía no se completa.</p>
          <p v-if="datos.vence">La sesión de pago sigue abierta hasta el <strong>{{ formatoFechaHora(datos.vence) }}</strong></p>
        </div>
        <ResumenPedido :cotizacion="datos" titulo="" compacto />
        <BotonPrimario :href="datos.url" :to="datos.url?.startsWith('/') ? datos.url : null" bloque>Completar el pago</BotonPrimario>
        <p class="regreso__pie">El pedido se confirma al recibir el pago.</p>
      </template>

      <template v-else>
        <EstadoPago estado="rechazado" forma="larga" />
        <h1>El cobro no se completó</h1>
        <p class="regreso__texto">La sesión de pago venció o el banco no autorizó el cargo. Tu carrito sigue igual.</p>
        <ResumenPedido :cotizacion="datos" titulo="" compacto />
        <BotonPrimario bloque :cargando="reintentando" @click="reintentar">Intentar de nuevo</BotonPrimario>
        <p v-if="errorReintento" class="regreso__pie" role="alert">{{ errorReintento }}</p>
        <BotonPrimario to="/carrito" variante="secundario" bloque>Volver al carrito</BotonPrimario>
      </template>
    </div>
  </main>
</template>

<script setup>
/**
 * Las tres pantallas de regreso de la pasarela: /pago/confirmado, /pago/pendiente y /pago/error.
 * No dan el cobro por hecho porque el comprador volvió: le preguntan a la API el estado de la sesión y muestran el
 * que ella responde. Si la ruta no coincide con ese estado, pasan a la que sí. El carrito se vacía sólo con el pago
 * confirmado.
 */
import { ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { consultarRegreso, abrirSesionPago } from '@/lib/api'
import { formatoFechaHora } from '@/lib/formato'
import { useCarritoStore } from '@/stores/carritoStore'
import BotonPrimario from '@/components/compartidos/BotonPrimario.vue'
import ResumenPedido from '@/components/compartidos/ResumenPedido.vue'
import EstadoPago from '@/components/compartidos/EstadoPago.vue'

const route = useRoute()
const router = useRouter()
const carrito = useCarritoStore()
const cargando = ref(true)
const fallo = ref('')
const datos = ref(null)
const estado = ref('')

const PANTALLA = { confirmado: 'pago-confirmado', pendiente: 'pago-pendiente', error: 'pago-error' }

function estadoDe(respuesta) {
  if (respuesta.pago === 'paid') return 'confirmado'
  if (respuesta.estado_sesion === 'expired') return 'error'
  return 'pendiente' // sesión abierta, o completa con el pago en camino
}

async function revisar() {
  cargando.value = true
  fallo.value = ''
  const sesion = route.query.session_id
  if (!sesion) {
    fallo.value = 'La dirección no trae la sesión de pago.'
    cargando.value = false
    return
  }
  try {
    datos.value = await consultarRegreso(sesion)
    estado.value = estadoDe(datos.value)
    if (route.name !== PANTALLA[estado.value]) {
      router.replace({ name: PANTALLA[estado.value], query: route.query })
    }
    if (estado.value === 'confirmado') {
      carrito.vaciarCarrito()
      sessionStorage.removeItem('pedido-en-curso')
    }
  } catch (e) {
    fallo.value = e.message || 'No pudimos revisar el pago.'
  } finally {
    cargando.value = false
  }
}

watch(() => route.query.session_id, revisar, { immediate: true })

/**
 * Intentar de nuevo: el mismo pedido abre otra sesión de pago (otro intento en pagos), sin crear un pedido nuevo.
 * Si el navegador ya no tiene el pedido en curso, se vuelve al checkout.
 */
const reintentando = ref(false)
const errorReintento = ref('')
async function reintentar() {
  const enCurso = JSON.parse(sessionStorage.getItem('pedido-en-curso') || 'null')
  if (!enCurso) return router.push('/checkout')
  reintentando.value = true
  errorReintento.value = ''
  try {
    const sesion = await abrirSesionPago(enCurso.id)
    if (sesion.url.startsWith('/')) router.push(sesion.url)
    else window.location.assign(sesion.url)
  } catch (e) {
    errorReintento.value = e.message || 'No pudimos abrir otra sesión de pago.'
    reintentando.value = false
  }
}
</script>

<style scoped>
.regreso { min-height: 100vh; background: var(--color-crema); padding: 6.5rem var(--espacio-4) var(--espacio-8); }
.regreso__caja {
  max-width: 520px; margin: 0 auto; background: var(--color-blanco); border-radius: var(--radio-grande);
  box-shadow: var(--sombra); padding: var(--espacio-6) var(--espacio-5); display: flex; flex-direction: column; gap: var(--espacio-4);
}
.regreso__caja > :first-child { align-self: flex-start; }
.regreso h1 { font-family: var(--fuente-titulos); font-size: 2rem; line-height: 1.15; color: var(--color-texto); }
.regreso__texto { color: var(--color-texto-2); font-size: 1.05rem; }
.regreso__folio-etiqueta { color: var(--color-texto-2); margin-bottom: calc(-1 * var(--espacio-4)); }
.regreso__folio { font-family: var(--fuente-mono); font-size: 2.1rem; font-weight: 700; color: var(--color-texto); letter-spacing: 0.04em; }
.regreso__recuadro { background: var(--color-crema-oscuro); border: 1px solid var(--color-borde); border-radius: var(--radio-grande); padding: var(--espacio-4); color: var(--color-texto); }
.regreso__recuadro p + p { margin-top: var(--espacio-2); }
.regreso__liga { text-align: center; color: var(--color-texto-2); font-weight: 600; }
.regreso__pie { text-align: center; color: var(--color-texto-2); font-size: 0.9rem; }
</style>
