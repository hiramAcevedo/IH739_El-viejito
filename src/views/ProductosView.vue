<template>
  <main class="productos-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1>Nuestros Productos</h1>
        <p>Selección premium de tequilas artesanales de El Viejito.</p>
      </div>
    </section>

    <!-- Productos Grid Section -->
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

        <!-- Products Grid -->
        <div v-else class="productos-grid">
          <div v-for="producto in productos" :key="producto.id" class="product-card">
            <div class="product-image-wrapper">
              <img
                :src="getProductImage(producto.tipo)"
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getProductos } from '@/lib/supabaseClient'

// Importación de imágenes locales
import imgBlanco from '@/assets/tequila-blanco.webp'
import imgReposado from '@/assets/tequila-reposado.webp'
import imgAnejo from '@/assets/tequila-anejo.webp'

// Estado reactivo
const productos = ref([])
const loading = ref(false)
const error = ref(false)

// Mapeo de tipos a imágenes locales
const imageMap = {
  blanco: imgBlanco,
  reposado: imgReposado,
  añejo: imgAnejo,
  extra_añejo: imgAnejo // Fallback a añejo
}

// Obtener imagen del producto basada en el tipo
const getProductImage = (tipo) => {
  return imageMap[tipo] || imgBlanco
}

// Formatear tipo de producto
const formatTipo = (tipo) => {
  const labels = {
    blanco: 'Blanco',
    reposado: 'Reposado',
    añejo: 'Añejo',
    extra_añejo: 'Extra Añejo'
  }
  return labels[tipo] || tipo
}

// Formatear precio como MXN
const formatPrice = (precio) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(precio)
}

// Obtener productos de Supabase
const fetchProductos = async () => {
  loading.value = true
  error.value = false
  try {
    const data = await getProductos()
    productos.value = data
  } catch (err) {
    console.error('Error al cargar productos:', err)
    error.value = true
  } finally {
    loading.value = false
  }
}

// Al montar el componente, cargar los productos
onMounted(() => {
  fetchProductos()
})
</script>

<style scoped>
.productos-page {
  background-color: #faf7f2;
}

/* ─── Hero Section ─── */
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

/* ─── Container ─── */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.content-section {
  padding: 5rem 2rem;
}

/* ─── Loading State ─── */
.loading-state {
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: #666;
  font-size: 1.1rem;
}

/* ─── Error State ─── */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
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

/* ─── Productos Grid ─── */
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

/* ─── Product Card ─── */
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

/* ─── Type Badge ─── */
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

.badge-blanco {
  background-color: #e8f4f8;
  color: #0c566e;
}

.badge-reposado {
  background-color: #fff3e0;
  color: #e65100;
}

.badge-añejo {
  background-color: #f3e5f5;
  color: #6a1b9a;
}

.badge-extra_añejo {
  background-color: #fce4ec;
  color: #880e4f;
}

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

/* ─── Media Queries ─── */
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
    padding: 3rem 1rem;
  }

  .container {
    padding: 0 1rem;
  }

  .product-image-wrapper {
    height: 240px;
  }
}
</style>
