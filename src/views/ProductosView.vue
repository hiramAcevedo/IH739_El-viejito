<template>
  <main class="productos-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1>Nuestros Productos</h1>
        <p>Seleccion premium de tequilas artesanales de El Viejito.</p>
      </div>
    </section>

    <!-- Productos Section -->
    <section class="content-section">
      <div class="container">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando productos...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <p>No se pudieron cargar los productos.</p>
          <button @click="fetchProductos" class="retry-btn">Intentar de nuevo</button>
        </div>

        <template v-else>
          <!-- Filtros (PB8) -->
          <div class="filtros-bar">
            <div class="filtros-tipo">
              <button
                :class="['filtro-btn', { active: filtroTipo === null }]"
                @click="filtroTipo = null"
              >
                Todos
              </button>
              <button
                v-for="tipo in tiposDisponibles"
                :key="tipo.value"
                :class="['filtro-btn', `filtro-${tipo.value}`, { active: filtroTipo === tipo.value }]"
                @click="filtroTipo = tipo.value"
              >
                {{ tipo.label }}
              </button>
            </div>

            <div class="filtros-precio">
              <label class="filtro-label">Precio max: {{ formatPrice(precioMax) }}</label>
              <input
                type="range"
                :min="precioRangoMin"
                :max="precioRangoMax"
                :step="10"
                v-model.number="precioMax"
                class="filtro-range"
              />
            </div>
          </div>

          <!-- Contador de resultados -->
          <p class="resultados-count" v-if="productosFiltrados.length !== productos.length">
            Mostrando {{ productosFiltrados.length }} de {{ productos.length }} productos
          </p>

          <!-- Products Grid -->
          <div v-if="productosFiltrados.length" class="productos-grid">
            <router-link
              v-for="producto in productosFiltrados"
              :key="producto.id"
              :to="{ name: 'producto-detalle', params: { id: producto.id } }"
              class="product-card-link"
            >
              <div class="product-card">
                <div class="product-image-wrapper">
                  <img
                    :src="resolveProductImage(producto.imagen_url)"
                    :alt="producto.nombre"
                    loading="lazy"
                    class="product-image"
                  />
                </div>
                <div class="product-info">
                  <div class="product-header">
                    <h3 class="product-name">{{ producto.nombre }}</h3>
                    <span :class="['type-badge', `badge-${producto.tipo}`]">
                      {{ formatTipo(producto.tipo) }}
                    </span>
                  </div>
                  <p class="product-description">{{ producto.descripcion }}</p>
                  <div class="product-footer">
                    <span class="product-price">{{ formatPrice(producto.precio) }}</span>
                    <span class="ver-detalle">Ver detalle &rarr;</span>
                  </div>
                </div>
              </div>
            </router-link>
          </div>

          <!-- Sin resultados -->
          <div v-else class="empty-state">
            <p>No hay productos que coincidan con los filtros seleccionados.</p>
            <button @click="resetFiltros" class="retry-btn">Limpiar filtros</button>
          </div>
        </template>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getProductos } from '@/lib/supabaseClient'
import { resolveProductImage } from '@/lib/imageHelper'

const productos = ref([])
const loading = ref(false)
const error = ref(false)

// Filtros
const filtroTipo = ref(null)
const precioMax = ref(1000)

const tiposDisponibles = [
  { value: 'blanco', label: 'Blanco' },
  { value: 'reposado', label: 'Reposado' },
  { value: 'añejo', label: 'Añejo' },
  { value: 'extra_añejo', label: 'Extra Añejo' }
]

const precioRangoMin = computed(() => {
  if (!productos.value.length) return 0
  return Math.floor(Math.min(...productos.value.map(p => Number(p.precio))))
})

const precioRangoMax = computed(() => {
  if (!productos.value.length) return 1000
  return Math.ceil(Math.max(...productos.value.map(p => Number(p.precio))))
})

const productosFiltrados = computed(() => {
  return productos.value.filter(p => {
    const pasaTipo = filtroTipo.value === null || p.tipo === filtroTipo.value
    const pasaPrecio = Number(p.precio) <= precioMax.value
    return pasaTipo && pasaPrecio
  })
})

const resetFiltros = () => {
  filtroTipo.value = null
  precioMax.value = precioRangoMax.value
}

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

const fetchProductos = async () => {
  loading.value = true
  error.value = false
  try {
    const data = await getProductos()
    productos.value = data
    precioMax.value = Math.ceil(Math.max(...data.map(p => Number(p.precio))))
  } catch (err) {
    console.error('Error al cargar productos:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProductos()
})
</script>

<style scoped>
.productos-page {
  background-color: #faf7f2;
}

/* Hero Section */
.hero-section {
  height: 40vh;
  background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
    url('@/assets/hero-nosotros.webp');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
}

.hero-content h1 {
  font-size: 3rem;
  font-family: Georgia, serif;
  margin-bottom: 1rem;
  font-weight: normal;
}

.hero-content p {
  font-size: 1.2rem;
  font-weight: 300;
  letter-spacing: 0.5px;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.content-section {
  padding: 3rem 2rem 5rem;
}

/* Loading / Error */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
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

.loading-state p,
.empty-state p {
  color: #666;
  font-size: 1.1rem;
}

.error-state p {
  color: #d9534f;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background-color: #c9a84c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  font-family: Arial, sans-serif;
}

.retry-btn:hover {
  background-color: #b39340;
}

/* Filtros */
.filtros-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.25rem 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.filtros-tipo {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filtro-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e5e0d5;
  background: white;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  color: #555;
}

.filtro-btn:hover {
  border-color: #c9a84c;
  color: #c9a84c;
}

.filtro-btn.active {
  background: #c9a84c;
  border-color: #c9a84c;
  color: white;
}

.filtros-precio {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 200px;
}

.filtro-label {
  font-size: 0.85rem;
  color: #555;
  font-weight: 500;
}

.filtro-range {
  width: 100%;
  accent-color: #c9a84c;
  cursor: pointer;
}

.resultados-count {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

/* Productos Grid */
.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

@media (max-width: 1024px) {
  .productos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .productos-grid {
    grid-template-columns: 1fr;
  }
}

/* Product Card Link */
.product-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
  height: 100%;
}

/* Product Card */
.product-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
}

.product-image-wrapper {
  position: relative;
  overflow: hidden;
  height: 280px;
  background-color: #f5f5f5;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-info {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.product-name {
  font-size: 1.3rem;
  font-family: Georgia, serif;
  color: #1a1a1a;
  margin: 0;
  flex: 1;
}

/* Type Badge */
.type-badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-blanco { background-color: #e8f4f8; color: #0c566e; }
.badge-reposado { background-color: #fff3e0; color: #e65100; }
.badge-añejo { background-color: #f3e5f5; color: #6a1b9a; }
.badge-extra_añejo { background-color: #fce4ec; color: #880e4f; }

.product-description {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  flex-grow: 1;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #eee;
  padding-top: 1rem;
  margin-top: auto;
}

.product-price {
  font-size: 1.5rem;
  font-weight: 600;
  color: #c9a84c;
  font-family: 'Arial', sans-serif;
}

.ver-detalle {
  font-size: 0.85rem;
  color: #c9a84c;
  font-weight: 600;
  transition: color 0.2s;
}

.product-card:hover .ver-detalle {
  color: #b39340;
}

/* Media Queries */
@media (max-width: 768px) {
  .hero-section {
    height: 35vh;
  }

  .hero-content h1 {
    font-size: 2rem;
  }

  .hero-content p {
    font-size: 1rem;
  }

  .content-section {
    padding: 2rem 1rem;
  }

  .container {
    padding: 0 1rem;
  }

  .product-image-wrapper {
    height: 240px;
  }

  .filtros-bar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
