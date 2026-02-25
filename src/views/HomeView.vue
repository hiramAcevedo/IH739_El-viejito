<template>
  <main>
    <!-- ── Hero ── -->
    <section class="hero">
      <div class="hero__overlay"></div>
      <div class="hero__content">
        <p class="hero__eyebrow">Desde 1937</p>
        <h1 class="hero__title">Tequila<br><em>El Viejito</em></h1>
        <p class="hero__subtitle">Tradición destilada en cada botella</p>
        <RouterLink to="/productos" class="hero__cta">Ver productos</RouterLink>
      </div>
      <!-- Scroll indicator -->
      <div class="hero__scroll-hint" aria-hidden="true">
        <span></span>
      </div>
    </section>

    <!-- ── Slider de productos destacados ── -->
    <section class="section slider-section">
      <h2 class="section__title">Nuestros Tequilas</h2>
      <p class="section__subtitle">Una selección de lo mejor de nuestra destilería</p>

      <!-- Swiper -->
      <div class="swiper product-swiper">
        <div class="swiper-wrapper">
          <div
            v-for="product in featuredProducts"
            :key="product.id"
            class="swiper-slide product-card"
          >
            <div class="product-card__img-wrap">
              <img :src="product.img" :alt="product.name" loading="lazy" />
            </div>
            <div class="product-card__info">
              <h3>{{ product.name }}</h3>
              <p>{{ product.description }}</p>
            </div>
          </div>
        </div>
        <div class="swiper-pagination"></div>
        <div class="swiper-button-prev"></div>
        <div class="swiper-button-next"></div>
      </div>
    </section>

    <!-- ── Sección Bienvenida ── -->
    <section class="section welcome">
      <div class="welcome__text">
        <h2 class="section__title">Bienvenido a El Viejito</h2>
        <p>
          Somos una destilería con más de siete décadas de historia en los Altos de Jalisco.
          Cada botella de Tequila El Viejito es el resultado de procesos artesanales heredados
          de generación en generación, combinados con las mejores prácticas de elaboración modernas.
        </p>
        <RouterLink to="/nosotros" class="btn-secondary">Conoce nuestra historia</RouterLink>
      </div>
      <div class="welcome__img">
        <img :src="imgHistoria" alt="Destilería El Viejito" class="welcome__real-img" />
      </div>
    </section>
  </main>
</template>

<script setup>
  import { onMounted } from 'vue'
  import { RouterLink } from 'vue-router'
  import Swiper from 'swiper'
  import { Navigation, Pagination, Autoplay } from 'swiper/modules'
  import 'swiper/css'
  import 'swiper/css/navigation'
  import 'swiper/css/pagination'

  // Importación de imágenes locales
  import imgHistoria from '@/assets/historia.png'
  import imgHero from '@/assets/hero-nosotros.png'
  import imgBlanco from '@/assets/tequila-blanco.png'
  import imgReposado from '@/assets/tequila-reposado.png'
  import imgAnejo from '@/assets/tequila-anejo.png'

  // Datos de productos con tus imágenes de marca
  const featuredProducts = [
    {
      id: 1,
      name: 'Blanco Clásico',
      description: 'Cristalino, fresco y con notas herbales características del agave azul.',
      img: imgBlanco
    },
    {
      id: 2,
      name: 'Reposado Suave',
      description: 'Reposado 8 meses en barrica de roble blanco. Notas a vainilla y caramelo.',
      img: imgReposado
    },
    {
      id: 3,
      name: 'Añejo Premium',
      description: 'Añejado 18 meses. Complejo, con notas a chocolate amargo y frutos secos.',
      img: imgAnejo
    }
  ]

  onMounted(() => {
    new Swiper('.product-swiper', {
      modules: [Navigation, Pagination, Autoplay],
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      autoplay: { delay: 4000, disableOnInteraction: false },
      pagination: { el: '.swiper-pagination', clickable: true },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      },
      breakpoints: {
        640:  { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      }
    })
  })
</script>

<style scoped>
  /* ── Hero ── */
  .hero {
    position: relative;
    height: 100vh;
    min-height: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1a1a1a 0%, #2d1f0e 100%);
    overflow: hidden;
    text-align: center;
    color: #f5f0e8;
  }

  .hero__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('@/assets/hero-nosotros.png') center/cover no-repeat;
    opacity: 0.8;
  }

  .hero__content {
    position: relative;
    z-index: 1;
    max-width: 700px;
    padding: 0 1.5rem;
  }

  .hero__eyebrow {
    font-size: 0.85rem;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    color: #c9a84c;
    margin-bottom: 1rem;
  }

  .hero__title {
    font-family: Georgia, serif;
    font-size: clamp(3rem, 8vw, 6rem);
    line-height: 1;
    margin: 0 0 1rem;
  }

  .hero__title em {
    font-style: italic;
    color: #c9a84c;
  }

  .hero__subtitle {
    font-size: 1.1rem;
    opacity: 0.8;
    margin-bottom: 2rem;
  }

  .hero__cta {
    display: inline-block;
    padding: 0.85rem 2.5rem;
    background: #c9a84c;
    color: #1a1a1a;
    text-decoration: none;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-size: 0.9rem;
    transition: background 0.2s, transform 0.2s;
    border-radius: 2px;
  }

  .hero__cta:hover {
    background: #e0c068;
    transform: translateY(-2px);
  }

  .hero__scroll-hint {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
  }

  .hero__scroll-hint span {
    display: block;
    width: 24px;
    height: 40px;
    border: 2px solid rgba(245,240,232,0.4);
    border-radius: 12px;
    position: relative;
  }

  .hero__scroll-hint span::after {
    content: '';
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 4px;
    background: #c9a84c;
    border-radius: 50%;
    animation: scrollBounce 1.5s infinite;
  }

  @keyframes scrollBounce {
    0%, 100% { top: 6px; opacity: 1; }
    50%       { top: 18px; opacity: 0.3; }
  }

  /* ── Sections shared ── */
  .section {
    padding: 5rem 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .section__title {
    font-family: Georgia, serif;
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    color: #1a1a1a;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .section__subtitle {
    text-align: center;
    color: #666;
    margin-bottom: 3rem;
  }

  /* ── Swiper custom colors ── */
  :deep(.swiper-button-next),
  :deep(.swiper-button-prev) {
    color: #c9a84c;
  }

  :deep(.swiper-pagination-bullet-active) {
    background: #c9a84c;
  }

  /* ── Product card ── */
  .product-card {
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    background: #fff;
    transition: transform 0.25s;
  }

  .product-card:hover {
    transform: translateY(-4px);
  }

  .product-card__img-wrap img {
    width: 100%;
    height: 280px;
    object-fit: cover;
    display: block;
  }

  .product-card__info {
    padding: 1.2rem;
  }

  .product-card__info h3 {
    margin: 0 0 0.4rem;
    font-family: Georgia, serif;
    color: #1a1a1a;
  }

  .product-card__info p {
    font-size: 0.9rem;
    color: #555;
    margin: 0;
  }

  /* ── Welcome ── */
  .welcome {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
  }

  .welcome__text p {
    color: #444;
    line-height: 1.8;
    margin-bottom: 1.5rem;
  }

  .btn-secondary {
    display: inline-block;
    padding: 0.75rem 2rem;
    border: 2px solid #c9a84c;
    color: #c9a84c;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: #c9a84c;
    color: #1a1a1a;
  }

  .welcome__real-img {
    width: 100%;
    aspect-ratio: 4/5;
    object-fit: cover;
    border-radius: 6px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }

  @media (max-width: 768px) {
    .welcome {
      grid-template-columns: 1fr;
    }
  }
</style>
