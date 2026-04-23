<template>
  <main class="carrito-page">
    <div class="carrito-container">
      <h1 class="carrito-titulo">Tu carrito</h1>

      <!-- Carrito vacío -->
      <div v-if="carrito.items.length === 0" class="carrito-vacio">
        <ShoppingCart :size="64" color="#ccc" />
        <p>Tu carrito esta vacio.</p>
        <router-link to="/productos" class="btn-catalogo">Ver catalogo</router-link>
      </div>

      <!-- Carrito con items -->
      <div v-else class="carrito-content">
        <div class="carrito-items">
          <table class="carrito-tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Cantidad</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in carrito.items" :key="item.id">
                <td class="celda-producto">
                  <img
                    :src="resolveProductImage(item.imagen_url)"
                    :alt="item.nombre"
                    class="item-imagen"
                  />
                  <span class="item-nombre">{{ item.nombre }}</span>
                </td>
                <td>{{ formatPrice(item.precio) }}</td>
                <td>
                  <div class="cantidad-controls">
                    <button
                      class="btn-qty"
                      @click="carrito.quitarProducto(item.id)"
                      aria-label="Reducir cantidad"
                    >
                      <Minus :size="14" />
                    </button>
                    <span class="qty-value">{{ item.cantidad }}</span>
                    <button
                      class="btn-qty"
                      @click="carrito.agregarProducto(item)"
                      aria-label="Aumentar cantidad"
                    >
                      <Plus :size="14" />
                    </button>
                  </div>
                </td>
                <td class="celda-subtotal">{{ formatPrice(item.precio * item.cantidad) }}</td>
                <td>
                  <button
                    class="btn-eliminar"
                    @click="carrito.eliminarProducto(item.id)"
                    aria-label="Eliminar producto"
                  >
                    <Trash2 :size="16" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Resumen -->
        <aside class="carrito-resumen">
          <h2>Resumen del pedido</h2>
          <div class="resumen-linea">
            <span>Subtotal</span>
            <span>{{ formatPrice(carrito.subtotal) }}</span>
          </div>
          <div class="resumen-linea">
            <span>IVA (16%)</span>
            <span>{{ formatPrice(carrito.subtotal * 0.16) }}</span>
          </div>
          <div class="resumen-linea resumen-total">
            <span>Total</span>
            <span>{{ formatPrice(carrito.subtotal * 1.16) }}</span>
          </div>
          <router-link to="/checkout" class="btn-proceder">Proceder al pedido</router-link>
          <button class="btn-vaciar" @click="confirmarVaciar">Vaciar carrito</button>
        </aside>
      </div>
    </div>

    <!-- Modal de confirmación para vaciar -->
    <div v-if="mostrarConfirmacion" class="modal-overlay" @click.self="mostrarConfirmacion = false">
      <div class="modal-box">
        <p>¿Seguro que deseas vaciar el carrito?</p>
        <div class="modal-acciones">
          <button class="btn-cancelar" @click="mostrarConfirmacion = false">Cancelar</button>
          <button class="btn-confirmar" @click="vaciarYCerrar">Vaciar</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-vue-next'
import { useCarritoStore } from '@/stores/carritoStore'
import { resolveProductImage } from '@/lib/imageHelper'

const carrito = useCarritoStore()
const mostrarConfirmacion = ref(false)

function confirmarVaciar() {
  mostrarConfirmacion.value = true
}

function vaciarYCerrar() {
  carrito.vaciarCarrito()
  mostrarConfirmacion.value = false
}

function formatPrice(precio) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(precio)
}
</script>

<style scoped>
.carrito-page {
  background-color: #faf7f2;
  min-height: 100vh;
  padding: 6rem 2rem 4rem;
}

.carrito-container {
  max-width: 1100px;
  margin: 0 auto;
}

.carrito-titulo {
  font-family: Georgia, serif;
  font-size: 2.2rem;
  color: #1a1a1a;
  margin-bottom: 2rem;
}

/* Carrito vacío */
.carrito-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 5rem 2rem;
  text-align: center;
}

.carrito-vacio p {
  color: #888;
  font-size: 1.15rem;
}

.btn-catalogo {
  display: inline-block;
  padding: 0.85rem 2rem;
  background: #c9a84c;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-catalogo:hover {
  background: #b39340;
}

/* Layout con items */
.carrito-content {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2.5rem;
  align-items: start;
}

/* Tabla */
.carrito-tabla {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.carrito-tabla thead {
  background: #1a1a1a;
  color: #f5f0e8;
}

.carrito-tabla th {
  padding: 1rem;
  text-align: left;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.carrito-tabla td {
  padding: 1rem;
  border-bottom: 1px solid #f0ebe3;
  vertical-align: middle;
  color: #555;
}

.celda-producto {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.item-imagen {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  background: #f5f5f5;
}

.item-nombre {
  font-weight: 600;
  color: #1a1a1a;
}

.celda-subtotal {
  font-weight: 600;
  color: #1a1a1a;
}

/* Controles de cantidad */
.cantidad-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-qty {
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}

.btn-qty:hover {
  border-color: #c9a84c;
}

.qty-value {
  min-width: 28px;
  text-align: center;
  font-weight: 600;
  color: #1a1a1a;
}

.btn-eliminar {
  background: none;
  border: none;
  color: #d9534f;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.2s;
  display: flex;
}

.btn-eliminar:hover {
  background: #fef2f2;
}

/* Resumen */
.carrito-resumen {
  background: white;
  border-radius: 8px;
  padding: 1.75rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 6rem;
}

.carrito-resumen h2 {
  font-family: Georgia, serif;
  font-size: 1.2rem;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
}

.resumen-linea {
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
  color: #555;
  font-size: 0.95rem;
}

.resumen-total {
  border-top: 2px solid #1a1a1a;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  font-weight: 700;
  font-size: 1.1rem;
  color: #1a1a1a;
}

.btn-proceder {
  display: block;
  width: 100%;
  padding: 0.9rem;
  margin-top: 1.5rem;
  background: #c9a84c;
  color: white;
  text-align: center;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.95rem;
  transition: background 0.2s;
}

.btn-proceder:hover {
  background: #b39340;
}

.btn-vaciar {
  display: block;
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.75rem;
  background: none;
  border: 1px solid #ddd;
  color: #888;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: border-color 0.2s, color 0.2s;
}

.btn-vaciar:hover {
  border-color: #d9534f;
  color: #d9534f;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  max-width: 380px;
  width: 90%;
  text-align: center;
}

.modal-box p {
  color: #1a1a1a;
  font-size: 1.05rem;
  margin-bottom: 1.5rem;
}

.modal-acciones {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-cancelar {
  padding: 0.6rem 1.5rem;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #555;
}

.btn-confirmar {
  padding: 0.6rem 1.5rem;
  background: #d9534f;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .carrito-page {
    padding: 5rem 1rem 3rem;
  }

  .carrito-content {
    grid-template-columns: 1fr;
  }

  .carrito-tabla th:nth-child(4),
  .carrito-tabla td:nth-child(4) {
    display: none;
  }

  .carrito-resumen {
    position: static;
  }
}
</style>
