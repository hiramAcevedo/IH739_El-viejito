<template>
  <main class="carrito-page">
    <div class="carrito-container">
      <h1 class="carrito-titulo">Tu carrito</h1>

      <div v-if="carrito.items.length === 0" class="carrito-vacio">
        <ShoppingCart :size="64" color="#9a9488" aria-hidden="true" />
        <p>Tu carrito está vacío.</p>
        <BotonPrimario to="/productos">Ver catálogo</BotonPrimario>
      </div>

      <div v-else class="carrito-content">
        <div class="carrito-items">
          <table class="carrito-tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
                <th><span class="sr-only">Quitar</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in carrito.items" :key="item.id">
                <td class="celda-producto">
                  <img :src="resolveProductImage(item.imagen_url)" :alt="item.nombre" class="item-imagen" />
                  <span class="item-nombre">{{ item.nombre }}</span>
                </td>
                <td data-titulo="Precio">{{ deLaApi(item.id, 'precio') }}</td>
                <td data-titulo="Cantidad">
                  <div class="cantidad-controls">
                    <button class="btn-qty" @click="carrito.quitarProducto(item.id)" :aria-label="`Quitar un ${item.nombre}`">
                      <Minus :size="14" />
                    </button>
                    <span class="qty-value">{{ item.cantidad }}</span>
                    <button class="btn-qty" @click="carrito.agregarProducto(item)" :aria-label="`Agregar un ${item.nombre}`">
                      <Plus :size="14" />
                    </button>
                  </div>
                </td>
                <td class="celda-subtotal" data-titulo="Subtotal">{{ deLaApi(item.id, 'subtotal') }}</td>
                <td>
                  <button class="btn-eliminar" @click="carrito.eliminarProducto(item.id)" :aria-label="`Eliminar ${item.nombre}`">
                    <Trash2 :size="16" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <aside class="carrito-resumen">
          <ResumenPedido
            titulo="Resumen del pedido"
            :cotizacion="cotizacion"
            :lineas="carrito.items"
            :calculando="calculando"
            :error="error"
            nota="El total lo calcula el sistema con los precios vigentes; el envío depende de la forma de entrega."
          />
          <BotonPrimario to="/checkout" bloque :disabled="calculando || !cotizacion">Continuar al pago</BotonPrimario>
          <button class="btn-vaciar" @click="mostrarConfirmacion = true">Vaciar carrito</button>
        </aside>
      </div>
    </div>

    <div v-if="mostrarConfirmacion" class="modal-overlay" @click.self="mostrarConfirmacion = false">
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="vaciar-titulo">
        <p id="vaciar-titulo">¿Seguro que deseas vaciar el carrito?</p>
        <div class="modal-acciones">
          <button class="btn-cancelar" @click="mostrarConfirmacion = false">Cancelar</button>
          <button class="btn-confirmar" @click="vaciarYCerrar">Vaciar</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-vue-next'
import { useCarritoStore } from '@/stores/carritoStore'
import { resolveProductImage } from '@/lib/imageHelper'
import { formatoMoneda } from '@/lib/formato'
import { useCotizacion } from '@/composables/useCotizacion'
import BotonPrimario from '@/components/compartidos/BotonPrimario.vue'
import ResumenPedido from '@/components/compartidos/ResumenPedido.vue'

const carrito = useCarritoStore()
const mostrarConfirmacion = ref(false)
// el carrito todavía no sabe la forma de entrega: se cotiza con envío, y el checkout recalcula si cambia
const { cotizacion, calculando, error } = useCotizacion(computed(() => carrito.paraLaApi), ref('envio'))

/** El precio y el subtotal de cada línea salen de la cotización de la API, no del navegador. */
function deLaApi(id, campo) {
  if (calculando.value) return '…'
  const linea = cotizacion.value?.lineas?.find((l) => l.id === id)
  return linea ? formatoMoneda(linea[campo]) : '…'
}

function vaciarYCerrar() {
  carrito.vaciarCarrito()
  mostrarConfirmacion.value = false
}
</script>

<style scoped>
.carrito-page { background-color: var(--color-crema); min-height: 100vh; padding: 6rem 2rem 4rem; }
.carrito-container { max-width: 1100px; margin: 0 auto; }
.carrito-titulo { font-family: var(--fuente-titulos); font-size: 2.2rem; color: var(--color-texto); margin-bottom: 2rem; }
.carrito-vacio { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; padding: 5rem 2rem; text-align: center; }
.carrito-vacio p { color: var(--color-texto-2); font-size: 1.15rem; }
.carrito-content { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start; }
.carrito-items { background: var(--color-blanco); border-radius: var(--radio-grande); overflow: hidden; box-shadow: var(--sombra); }
.carrito-tabla { width: 100%; border-collapse: collapse; }
.carrito-tabla thead { background: var(--color-oscuro); color: var(--color-crema-oscuro); }
.carrito-tabla th { padding: 1rem; text-align: left; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.carrito-tabla td { padding: 1rem; border-bottom: 1px solid #f0ebe3; vertical-align: middle; color: var(--color-texto-2); }
.celda-producto { display: flex; align-items: center; gap: 1rem; }
.item-imagen { width: 56px; height: 56px; object-fit: cover; border-radius: var(--radio); background: #f5f5f5; }
.item-nombre { font-weight: 600; color: var(--color-texto); }
.cantidad-controls { display: flex; align-items: center; gap: 0.75rem; }
.btn-qty {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  border: 1px solid #c9c2b4; border-radius: 4px; background: var(--color-blanco); cursor: pointer; color: var(--color-texto);
}
.btn-qty:hover { border-color: var(--color-texto); }
.btn-qty:focus-visible, .btn-eliminar:focus-visible, .btn-vaciar:focus-visible { outline: none; box-shadow: var(--enfoque); }
.qty-value { font-weight: 600; min-width: 20px; text-align: center; color: var(--color-texto); }
.celda-subtotal { font-weight: 600; color: var(--color-texto); }
.btn-eliminar { background: none; border: none; color: var(--color-error); cursor: pointer; padding: 0.4rem; border-radius: 4px; }
.carrito-resumen { display: flex; flex-direction: column; gap: 1rem; position: sticky; top: 6rem; }
.btn-vaciar {
  width: 100%; padding: 0.75rem; background: none; border: 1px solid #c9c2b4; border-radius: var(--radio);
  color: var(--color-texto-2); font-size: 0.9rem; cursor: pointer;
}
.btn-vaciar:hover { border-color: var(--color-error); color: var(--color-error); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; }
.modal-box { background: var(--color-blanco); border-radius: var(--radio-grande); padding: 2rem; max-width: 380px; width: 90%; text-align: center; }
.modal-box p { font-size: 1.05rem; color: var(--color-texto); margin-bottom: 1.5rem; }
.modal-acciones { display: flex; gap: 1rem; justify-content: center; }
.btn-cancelar, .btn-confirmar { padding: 0.65rem 1.5rem; border-radius: var(--radio); font-weight: 600; cursor: pointer; border: none; }
.btn-cancelar { background: #e8e8e8; color: var(--color-texto-2); }
.btn-confirmar { background: var(--color-error); color: var(--color-blanco); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

@media (max-width: 900px) {
  .carrito-content { grid-template-columns: 1fr; }
  .carrito-resumen { position: static; }
}
@media (max-width: 600px) {
  .carrito-page { padding: 5rem 1rem 3rem; }
  .carrito-titulo { font-size: 1.8rem; margin-bottom: 1.25rem; }
  .carrito-tabla thead { display: none; }
  .carrito-tabla, .carrito-tabla tbody, .carrito-tabla tr, .carrito-tabla td { display: block; width: 100%; }
  .carrito-tabla tr { position: relative; padding: 0.75rem 1rem; border-bottom: 1px solid #f0ebe3; }
  .carrito-tabla td { border: none; padding: 0.3rem 0; display: flex; justify-content: space-between; align-items: center; }
  .carrito-tabla td[data-titulo]::before { content: attr(data-titulo); font-size: 0.85rem; color: var(--color-texto-2); }
  .carrito-tabla td.celda-producto { justify-content: flex-start; }
  .carrito-tabla td:last-child { position: absolute; top: 0.75rem; right: 0.5rem; width: auto; }
}
</style>
