<template>
  <main class="checkout-page">
    <div class="checkout-container">

      <!-- Sin items -->
      <div v-if="carrito.items.length === 0 && !pedidoExitoso" class="checkout-vacio">
        <p>No tienes productos en el carrito.</p>
        <router-link to="/productos" class="btn-catalogo">Ir al catalogo</router-link>
      </div>

      <!-- Pedido confirmado -->
      <div v-else-if="pedidoExitoso" class="checkout-exito">
        <div class="exito-icon">
          <CircleCheck :size="64" color="#5cb85c" />
        </div>
        <h1>Pedido confirmado</h1>
        <p>Tu pedido ha sido registrado correctamente. Nos pondremos en contacto contigo para coordinar los detalles.</p>
        <p class="exito-folio">Folio: <strong>{{ folioGenerado }}</strong></p>
        <router-link to="/productos" class="btn-catalogo">Seguir comprando</router-link>
      </div>

      <!-- Formulario de checkout -->
      <template v-else>
        <h1 class="checkout-titulo">Finalizar pedido</h1>

        <div class="checkout-grid">
          <!-- Formulario -->
          <form class="checkout-form" @submit.prevent="enviarPedido">
            <h2>Datos de contacto</h2>

            <div class="form-group">
              <label for="nombre">Nombre completo</label>
              <input
                id="nombre"
                v-model="form.nombre"
                type="text"
                required
                placeholder="Tu nombre"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="email">Correo electronico</label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div class="form-group">
                <label for="telefono">Telefono</label>
                <input
                  id="telefono"
                  v-model="form.telefono"
                  type="tel"
                  required
                  placeholder="+52 33 1234 5678"
                />
              </div>
            </div>

            <h2>Metodo de entrega</h2>

            <div class="entrega-opciones">
              <label
                :class="['entrega-opcion', { active: form.metodoEntrega === 'envio' }]"
              >
                <input type="radio" v-model="form.metodoEntrega" value="envio" />
                <Truck :size="22" />
                <div>
                  <strong>Envio a domicilio</strong>
                  <span>Entrega en 3-5 dias habiles</span>
                </div>
              </label>
              <label
                :class="['entrega-opcion', { active: form.metodoEntrega === 'recoger' }]"
              >
                <input type="radio" v-model="form.metodoEntrega" value="recoger" />
                <Store :size="22" />
                <div>
                  <strong>Recoger en tienda</strong>
                  <span>Tototlan, Jalisco</span>
                </div>
              </label>
            </div>

            <div class="form-group">
              <label for="notas">Notas adicionales (opcional)</label>
              <textarea
                id="notas"
                v-model="form.notas"
                rows="3"
                placeholder="Instrucciones especiales, direccion de envio, etc."
              ></textarea>
            </div>

            <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

            <button type="submit" class="btn-confirmar" :disabled="enviando">
              {{ enviando ? 'Procesando...' : 'Confirmar pedido' }}
            </button>
          </form>

          <!-- Resumen del pedido -->
          <aside class="checkout-resumen">
            <h2>Resumen</h2>
            <ul class="resumen-items">
              <li v-for="item in carrito.items" :key="item.id" class="resumen-item">
                <img
                  :src="resolveProductImage(item.imagen_url)"
                  :alt="item.nombre"
                  class="resumen-img"
                />
                <div class="resumen-item-info">
                  <span class="resumen-nombre">{{ item.nombre }}</span>
                  <span class="resumen-qty">x{{ item.cantidad }}</span>
                </div>
                <span class="resumen-precio">{{ formatPrice(item.precio * item.cantidad) }}</span>
              </li>
            </ul>
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
          </aside>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { CircleCheck, Truck, Store } from 'lucide-vue-next'
import { useCarritoStore } from '@/stores/carritoStore'
import { createPedido } from '@/lib/supabaseClient'
import { resolveProductImage } from '@/lib/imageHelper'

const carrito = useCarritoStore()
const enviando = ref(false)
const errorMsg = ref('')
const pedidoExitoso = ref(false)
const folioGenerado = ref('')

const form = reactive({
  nombre: '',
  email: '',
  telefono: '',
  metodoEntrega: 'envio',
  notas: ''
})

function formatPrice(precio) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(precio)
}

async function enviarPedido() {
  enviando.value = true
  errorMsg.value = ''

  try {
    const detalle = carrito.items.map(item => ({
      id: item.id,
      nombre: item.nombre,
      precio: Number(item.precio),
      cantidad: item.cantidad,
      subtotal: Number(item.precio) * item.cantidad
    }))

    const pedido = {
      cliente_nombre: form.nombre,
      cliente_email: form.email,
      telefono: form.telefono,
      metodo_entrega: form.metodoEntrega,
      notas: form.notas || null,
      detalle,
      total: carrito.subtotal * 1.16,
      estado: 'pendiente'
    }

    const resultado = await createPedido(pedido)
    folioGenerado.value = resultado.id.slice(0, 8).toUpperCase()
    pedidoExitoso.value = true
    carrito.vaciarCarrito()
  } catch (err) {
    console.error('Error al crear pedido:', err)
    errorMsg.value = 'Ocurrio un error al procesar tu pedido. Intenta de nuevo.'
  } finally {
    enviando.value = false
  }
}
</script>

<style scoped>
.checkout-page {
  background-color: #faf7f2;
  min-height: 100vh;
  padding: 6rem 2rem 4rem;
}

.checkout-container {
  max-width: 1100px;
  margin: 0 auto;
}

.checkout-titulo {
  font-family: Georgia, serif;
  font-size: 2.2rem;
  color: #1a1a1a;
  margin-bottom: 2rem;
}

/* Vacío */
.checkout-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 5rem 2rem;
  text-align: center;
  color: #888;
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

/* Éxito */
.checkout-exito {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 5rem 2rem;
  text-align: center;
}

.checkout-exito h1 {
  font-family: Georgia, serif;
  color: #1a1a1a;
  font-size: 2rem;
}

.checkout-exito p {
  color: #555;
  max-width: 480px;
  line-height: 1.6;
}

.exito-folio {
  background: #f5f0e8;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

/* Grid */
.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 2.5rem;
  align-items: start;
}

/* Formulario */
.checkout-form {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.checkout-form h2 {
  font-family: Georgia, serif;
  font-size: 1.15rem;
  color: #1a1a1a;
  margin: 1.5rem 0 1rem;
}

.checkout-form h2:first-child {
  margin-top: 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 0.4rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.2s;
  background: #faf7f2;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #c9a84c;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Método de entrega */
.entrega-opciones {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.entrega-opcion {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #e5e0d5;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.entrega-opcion input[type="radio"] {
  display: none;
}

.entrega-opcion.active {
  border-color: #c9a84c;
  background: #fdf8ef;
}

.entrega-opcion div {
  display: flex;
  flex-direction: column;
}

.entrega-opcion strong {
  font-size: 0.9rem;
  color: #1a1a1a;
}

.entrega-opcion span {
  font-size: 0.8rem;
  color: #888;
}

.entrega-opcion svg {
  color: #c9a84c;
  flex-shrink: 0;
}

.error-msg {
  color: #d9534f;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.btn-confirmar {
  width: 100%;
  padding: 1rem;
  background: #c9a84c;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-confirmar:hover:not(:disabled) {
  background: #b39340;
}

.btn-confirmar:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Resumen */
.checkout-resumen {
  background: white;
  border-radius: 8px;
  padding: 1.75rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 6rem;
}

.checkout-resumen h2 {
  font-family: Georgia, serif;
  font-size: 1.2rem;
  color: #1a1a1a;
  margin-bottom: 1.25rem;
}

.resumen-items {
  list-style: none;
  padding: 0;
  margin: 0 0 1.25rem;
}

.resumen-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid #f0ebe3;
}

.resumen-img {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  background: #f5f5f5;
}

.resumen-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.resumen-nombre {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a1a1a;
}

.resumen-qty {
  font-size: 0.78rem;
  color: #888;
}

.resumen-precio {
  font-weight: 600;
  font-size: 0.9rem;
  color: #1a1a1a;
}

.resumen-linea {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: #555;
  font-size: 0.9rem;
}

.resumen-total {
  border-top: 2px solid #1a1a1a;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  font-weight: 700;
  font-size: 1.05rem;
  color: #1a1a1a;
}

/* Responsive */
@media (max-width: 768px) {
  .checkout-page {
    padding: 5rem 1rem 3rem;
  }

  .checkout-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .entrega-opciones {
    grid-template-columns: 1fr;
  }

  .checkout-resumen {
    position: static;
  }
}
</style>
