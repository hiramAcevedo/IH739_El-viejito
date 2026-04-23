<template>
  <main class="detalle-page">
    <!-- Loading -->
    <div v-if="loading" class="state-container">
      <div class="spinner"></div>
      <p>Cargando producto...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-container">
      <p class="error-text">No se pudo cargar el producto.</p>
      <router-link to="/productos" class="btn-back">Volver al catalogo</router-link>
    </div>

    <!-- Producto -->
    <template v-else-if="producto">
      <section class="detalle-hero">
        <div class="detalle-grid">
          <div class="imagen-container">
            <img
              :src="imagenResuelta"
              :alt="producto.nombre"
              class="producto-imagen"
            />
            <span :class="['type-badge', `badge-${producto.tipo}`]">
              {{ formatTipo(producto.tipo) }}
            </span>
          </div>

          <div class="info-container">
            <router-link to="/productos" class="link-volver">
              &larr; Volver al catalogo
            </router-link>

            <h1 class="producto-nombre">{{ producto.nombre }}</h1>

            <p class="producto-precio">{{ formatPrice(producto.precio) }}</p>

            <div class="producto-descripcion">
              <h2>Descripcion</h2>
              <p>{{ producto.descripcion }}</p>
            </div>

            <div class="producto-specs">
              <h2>Especificaciones</h2>
              <table class="specs-table">
                <tr>
                  <td>Tipo</td>
                  <td>{{ formatTipo(producto.tipo) }}</td>
                </tr>
                <tr>
                  <td>Categoria</td>
                  <td>Tequila 100% Agave</td>
                </tr>
                <tr>
                  <td>Origen</td>
                  <td>Tototlan, Jalisco</td>
                </tr>
                <tr>
                  <td>Disponibilidad</td>
                  <td>{{ producto.activo ? 'Disponible' : 'No disponible' }}</td>
                </tr>
              </table>
            </div>

            <button
              class="btn-agregar"
              @click="agregarAlCarrito"
              :disabled="agregado"
            >
              <ShoppingCart :size="18" />
              {{ agregado ? 'Agregado al carrito' : 'Agregar al carrito' }}
            </button>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ShoppingCart } from 'lucide-vue-next'
import { getProductoById } from '@/lib/supabaseClient'
import { resolveProductImage } from '@/lib/imageHelper'
import { useCarritoStore } from '@/stores/carritoStore'

const route = useRoute()
const carrito = useCarritoStore()
const producto = ref(null)
const loading = ref(true)
const error = ref(false)
const agregado = ref(false)

function agregarAlCarrito() {
  if (!producto.value) return
  carrito.agregarProducto(producto.value)
  agregado.value = true
  setTimeout(() => { agregado.value = false }, 1500)
}

const imagenResuelta = computed(() => {
  if (!producto.value) return ''
  return resolveProductImage(producto.value.imagen_url)
})

const formatTipo = (tipo) => {
  const labels = {
    blanco: 'Blanco',
    reposado: 'Reposado',
    'añejo': 'Añejo',
    extra_añejo: 'Extra Añejo'
  }
  return labels[tipo] || tipo
}

const formatPrice = (precio) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(precio)
}

onMounted(async () => {
  try {
    loading.value = true
    producto.value = await getProductoById(route.params.id)
  } catch (err) {
    console.error('Error al cargar producto:', err)
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detalle-page {
  background-color: #faf7f2;
  min-height: 100vh;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 6rem 2rem 2rem;
}

.spinner {
  border: 4px solid #e8e8e8;
  border-top: 4px solid #c9a84c;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-text {
  color: #d9534f;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.btn-back {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #c9a84c;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 600;
}

/* Hero / Grid */
.detalle-hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: 6rem 2rem 3rem;
}

.detalle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: start;
}

/* Imagen */
.imagen-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.producto-imagen {
  width: 100%;
  height: auto;
  display: block;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.type-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-blanco { background-color: #e8f4f8; color: #0c566e; }
.badge-reposado { background-color: #fff3e0; color: #e65100; }
.badge-añejo { background-color: #f3e5f5; color: #6a1b9a; }
.badge-extra_añejo { background-color: #fce4ec; color: #880e4f; }

/* Info */
.info-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.link-volver {
  color: #c9a84c;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: color 0.2s;
}

.link-volver:hover {
  color: #b39340;
}

.producto-nombre {
  font-family: Georgia, serif;
  font-size: 2.5rem;
  color: #1a1a1a;
  margin: 0;
  line-height: 1.2;
}

.producto-precio {
  font-size: 2rem;
  font-weight: 700;
  color: #c9a84c;
  margin: 0;
}

.producto-descripcion h2,
.producto-specs h2 {
  font-family: Georgia, serif;
  font-size: 1.2rem;
  color: #1a1a1a;
  margin: 0 0 0.5rem;
}

.producto-descripcion p {
  color: #555;
  line-height: 1.7;
  margin: 0;
}

.specs-table {
  width: 100%;
  border-collapse: collapse;
}

.specs-table tr {
  border-bottom: 1px solid #e5e0d5;
}

.specs-table td {
  padding: 0.75rem 0;
  color: #555;
}

.specs-table td:first-child {
  font-weight: 600;
  color: #1a1a1a;
  width: 40%;
}

.btn-agregar {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: #c9a84c;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 1rem;
  text-align: center;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  letter-spacing: 0.02em;
}

.btn-agregar:hover:not(:disabled) {
  background: #b39340;
  transform: translateY(-2px);
}

.btn-agregar:disabled {
  background: #5cb85c;
  cursor: default;
}

/* Responsive */
@media (max-width: 768px) {
  .detalle-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .detalle-hero {
    padding: 2rem 1rem;
  }

  .producto-nombre {
    font-size: 1.8rem;
  }

  .producto-precio {
    font-size: 1.5rem;
  }
}
</style>
