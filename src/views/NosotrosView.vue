<template>
  <main class="nosotros-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1>Nuestra Historia</h1>
        <p>Tradición y pasión en cada gota de Tequila El Viejito.</p>
      </div>
    </section>

    <!-- Historia Section -->
    <section class="content-section history">
      <div class="container">
        <div class="grid">
          <div class="text-block">
            <h2>Desde hace generaciones...</h2>
            <p>
              Tequila El Viejito nació en el corazón de Jalisco, fruto de la dedicación de una familia apasionada por la tierra y el agave. Lo que comenzó como un pequeño sueño se ha convertido en un símbolo de calidad y tradición, respetando siempre los métodos artesanales que nos dieron origen.
            </p>
            <p>
              Nuestra misión es compartir la esencia auténtica de México con el mundo, manteniendo la integridad de nuestros procesos y el respeto por nuestra comunidad.
            </p>
          </div>
          <div class="image-block">
            <img :src="imgHistoria" alt="Campos de agave" />
          </div>
        </div>
      </div>
    </section>

    <!-- Proceso Section -->
    <section class="content-section proceso">
      <div class="container">
        <h2 class="section-title">Proceso de Elaboración</h2>
        <div class="proceso-grid">
          <div class="proceso-step" v-for="(step, index) in steps" :key="index">
            <span class="step-number">{{ index + 1 }}</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Galería Section -->
    <section class="content-section galeria">
      <div class="container">
        <h2 class="section-title">Identidad y Valores</h2>
        <swiper
          :modules="modules"
          :slides-per-view="1"
          :space-between="30"
          :pagination="{ clickable: true }"
          :breakpoints="{
            '640': { slidesPerView: 2 },
            '1024': { slidesPerView: 3 }
          }"
          class="mySwiper"
        >
          <swiper-slide v-for="(image, index) in galleryImages" :key="index">
            <div class="gallery-card">
              <img :src="image.url" :alt="image.title" />
              <div class="overlay">
                <h3>{{ image.title }}</h3>
              </div>
            </div>
          </swiper-slide>
        </swiper>
      </div>
    </section>
  </main>
</template>

<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Pagination, Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

// Importación de imágenes locales
import imgHistoria from '@/assets/historia.png'
import imgGaleria1 from '@/assets/galeria1.png'
import imgGaleria2 from '@/assets/galeria2.png'
import imgGaleria3 from '@/assets/galeria3.png'
import imgGaleria4 from '@/assets/galeria4.png'

const modules = [Pagination, Autoplay]

const steps = [
  { title: 'Jima', description: 'Seleccionamos cuidadosamente los agaves maduros en su punto óptimo.' },
  { title: 'Cocción', description: 'Cocemos las piñas en hornos de mampostería para liberar los azúcares.' },
  { title: 'Extracción', description: 'Molienda tradicional para obtener el néctar más puro.' },
  { title: 'Fermentación', description: 'Proceso natural con levaduras propias para desarrollar el carácter.' },
  { title: 'Destilación', description: 'Doble destilación en alambiques de cobre para una pureza excepcional.' }
]

const galleryImages = [
  { url: imgGaleria1, title: 'Tradición' },
  { url: imgGaleria2, title: 'Calidad' },
  { url: imgGaleria3, title: 'Pasión' },
  { url: imgGaleria4, title: 'Orgullo' }
]
</script>

<style scoped>
.nosotros-page {
  background-color: #faf7f2;
}

.hero-section {
  height: 40vh;
  background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('@/assets/hero-nosotros.png');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
}
/* ... resto del CSS igual ... */

.hero-content h1 {
  font-size: 3rem;
  font-family: Georgia, serif;
  margin-bottom: 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.content-section {
  padding: 5rem 0;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
  font-family: Georgia, serif;
  color: #1a1a1a;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}

.text-block h2 {
  font-size: 2rem;
  margin-bottom: 1.5rem;
  color: #c9a84c;
}

.text-block p {
  margin-bottom: 1rem;
  color: #444;
}

.image-block img {
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.proceso-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
}

.proceso-step {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  transition: transform 0.3s;
}

.proceso-step:hover {
  transform: translateY(-10px);
}

.step-number {
  display: block;
  font-size: 3rem;
  font-weight: bold;
  color: #c9a84c;
  opacity: 0.3;
  margin-bottom: -1rem;
}

.proceso-step h3 {
  margin-bottom: 1rem;
  color: #1a1a1a;
}

.gallery-card {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  height: 400px;
}

.gallery-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  display: flex;
  align-items: flex-end;
  padding: 2rem;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
}

.gallery-card:hover img {
  transform: scale(1.1);
}

.gallery-card:hover .overlay {
  opacity: 1;
}

.mySwiper {
  padding-bottom: 3rem;
}
</style>
