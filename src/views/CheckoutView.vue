<template>
  <main class="checkout-page">
    <div class="checkout-container">
      <h1 class="checkout-titulo">Finalizar pedido</h1>

      <div v-if="carrito.items.length === 0" class="checkout-vacio">
        <p>No tienes productos en el carrito.</p>
        <BotonPrimario to="/productos">Ir al catálogo</BotonPrimario>
      </div>

      <form v-else class="checkout-grid" novalidate @submit.prevent="pagar">
        <div class="checkout-form">
          <fieldset class="bloque">
            <legend>Datos de contacto</legend>
            <div class="campo">
              <label for="nombre">Nombre completo</label>
              <input id="nombre" v-model.trim="form.nombre" required autocomplete="name" />
            </div>
            <div class="fila">
              <div class="campo">
                <label for="correo">Correo electrónico</label>
                <input id="correo" v-model.trim="form.correo" type="email" required autocomplete="email" />
              </div>
              <div class="campo">
                <label for="telefono">Teléfono</label>
                <input id="telefono" v-model.trim="form.telefono" type="tel" autocomplete="tel" />
              </div>
            </div>
          </fieldset>

          <SelectorEntrega v-model:metodo="form.metodoEntrega" v-model:direccion="form.direccion" class="bloque" />

          <div class="campo bloque">
            <label for="notas">Indicaciones para la entrega (opcional)</label>
            <textarea id="notas" v-model.trim="form.notas" rows="2" placeholder="Entre qué calles, horario para recibir…"></textarea>
          </div>
        </div>

        <aside class="checkout-lado">
          <ConfirmacionEdad v-model="form.mayorDeEdad" />
          <ResumenPedido :cotizacion="cotizacion" :lineas="carrito.items" :calculando="calculando" :error="errorCotizacion" />
          <p v-if="errorPago" class="error-msg" role="alert">{{ errorPago }}</p>
          <BotonPrimario type="submit" bloque :disabled="!listo" :cargando="pagando">
            {{ pagando ? 'Abriendo el pago…' : textoPagar }}
          </BotonPrimario>
          <p class="pie-pago">{{ faltante || 'Te llevamos a la pasarela de pago. Los datos de tu tarjeta los recibe la pasarela, no este sitio.' }}</p>
        </aside>
      </form>
    </div>
  </main>
</template>

<script setup>
/**
 * Checkout del sprint 4. El navegador ya no calcula el total ni escribe el pedido: manda los datos a la API, que
 * registra el pedido con el importe del servidor y abre la sesión de pago, y lleva al comprador a la pasarela.
 */
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCarritoStore } from '@/stores/carritoStore'
import { crearPedido, abrirSesionPago } from '@/lib/api'
import { formatoMoneda } from '@/lib/formato'
import { useCotizacion } from '@/composables/useCotizacion'
import BotonPrimario from '@/components/compartidos/BotonPrimario.vue'
import ResumenPedido from '@/components/compartidos/ResumenPedido.vue'
import ConfirmacionEdad from '@/components/compartidos/ConfirmacionEdad.vue'
import SelectorEntrega from '@/components/compartidos/SelectorEntrega.vue'

const router = useRouter()
const carrito = useCarritoStore()
const pagando = ref(false)
const errorPago = ref('')

const form = reactive({
  nombre: '',
  correo: '',
  telefono: '',
  metodoEntrega: 'envio',
  direccion: { calle: '', colonia: '', codigo_postal: '', ciudad: '', estado: 'Jalisco' },
  notas: '',
  mayorDeEdad: false
})

const { cotizacion, calculando, error: errorCotizacion } = useCotizacion(
  computed(() => carrito.paraLaApi),
  computed(() => form.metodoEntrega)
)

const direccionCompleta = computed(() => {
  if (form.metodoEntrega !== 'envio') return true
  const d = form.direccion
  return Boolean(d.calle && d.colonia && d.ciudad && d.estado && /^\d{5}$/.test(d.codigo_postal))
})
const contactoCompleto = computed(() => Boolean(form.nombre) && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.correo))
const listo = computed(() => form.mayorDeEdad && contactoCompleto.value && direccionCompleta.value && cotizacion.value && !calculando.value)
const textoPagar = computed(() => (cotizacion.value && !calculando.value ? `Pagar ${formatoMoneda(cotizacion.value.total)}` : 'Pagar'))
const faltante = computed(() => {
  if (!contactoCompleto.value) return 'Escribe tu nombre y un correo válido.'
  if (!direccionCompleta.value) return 'Completa la dirección de entrega.'
  if (!form.mayorDeEdad) return 'Confirma que eres mayor de edad para activar el pago.'
  return ''
})

async function pagar() {
  if (!listo.value) return
  pagando.value = true
  errorPago.value = ''
  try {
    const pedido = await crearPedido({
      items: carrito.paraLaApi,
      metodo_entrega: form.metodoEntrega,
      cliente_nombre: form.nombre,
      cliente_email: form.correo,
      telefono: form.telefono,
      notas: form.notas,
      direccion: form.metodoEntrega === 'envio' ? { ...form.direccion } : null,
      confirma_mayor_de_edad: form.mayorDeEdad
    })
    // el pedido queda guardado para reintentar el cobro sin crear otro
    sessionStorage.setItem('pedido-en-curso', JSON.stringify({ id: pedido.id, folio: pedido.folio }))
    const sesion = await abrirSesionPago(pedido.id)
    if (sesion.url.startsWith('/')) router.push(sesion.url)
    else window.location.assign(sesion.url)
  } catch (e) {
    errorPago.value = e.message || 'No pudimos abrir el pago. Intenta de nuevo.'
    pagando.value = false
  }
}
</script>

<style scoped>
.checkout-page { background-color: var(--color-crema); min-height: 100vh; padding: 6rem 2rem 4rem; }
.checkout-container { max-width: 1100px; margin: 0 auto; }
.checkout-titulo { font-family: var(--fuente-titulos); font-size: 2.2rem; color: var(--color-texto); margin-bottom: 2rem; }
.checkout-vacio { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; padding: 5rem 2rem; text-align: center; color: var(--color-texto-2); }
.checkout-grid { display: grid; grid-template-columns: 1fr 360px; gap: 2.5rem; align-items: start; }
.checkout-form { background: var(--color-blanco); border-radius: var(--radio-grande); padding: 2rem; box-shadow: var(--sombra); }
.bloque { border: none; padding: 0; margin: 0 0 1.75rem; }
.bloque:last-child { margin-bottom: 0; }
.bloque legend { font-family: var(--fuente-titulos); font-size: 1.15rem; color: var(--color-texto); margin-bottom: 0.75rem; }
.fila { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.campo { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }
.campo label { font-size: 0.85rem; font-weight: 600; color: var(--color-texto-2); }
.campo input, .campo textarea {
  width: 100%; padding: 0.75rem; border: 1px solid #c9c2b4; border-radius: var(--radio); font-size: 0.95rem;
  font-family: inherit; background: var(--color-crema); color: var(--color-texto);
}
.campo input:focus, .campo textarea:focus { outline: none; border-color: var(--color-texto); box-shadow: var(--enfoque); }
.checkout-lado { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 6rem; }
.error-msg { color: var(--color-error); font-size: 0.9rem; }
.pie-pago { font-size: 0.85rem; color: var(--color-texto-2); text-align: center; }

@media (max-width: 900px) {
  .checkout-grid { grid-template-columns: 1fr; }
  .checkout-lado { position: static; }
}
@media (max-width: 600px) {
  .checkout-page { padding: 5rem 1rem 3rem; }
  .checkout-titulo { font-size: 1.8rem; margin-bottom: 1.25rem; }
  .checkout-form { padding: 1.25rem; }
  .fila { grid-template-columns: 1fr; gap: 0; }
}
</style>
