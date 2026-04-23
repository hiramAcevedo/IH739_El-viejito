<template>
  <nav class="navbar" :class="{ 'navbar--scrolled': isScrolled, 'navbar--open': menuOpen }">
    <div class="navbar__container">

      <!-- Logo -->
      <RouterLink to="/" class="navbar__logo" @click="closeMenu">
        <span class="navbar__logo-text">El Viejito</span>
        <span class="navbar__logo-sub">Tequila</span>
      </RouterLink>

      <!-- Links de navegación (desktop) -->
      <ul class="navbar__links" :class="{ 'navbar__links--active': menuOpen }">
        <li v-for="link in navLinks" :key="link.name">
          <RouterLink
            :to="link.path"
            class="navbar__link"
            active-class="navbar__link--active"
            @click="closeMenu"
          >
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>

      <!-- Carrito + Burger -->
      <div class="navbar__right">
        <RouterLink to="/carrito" class="navbar__cart" aria-label="Ver carrito">
          <ShoppingCart :size="20" />
          <span v-if="carrito.totalItems > 0" class="navbar__cart-badge">
            {{ carrito.totalItems }}
          </span>
        </RouterLink>

        <!-- Botón hamburguesa (móvil) -->
        <button
          class="navbar__burger"
          :aria-expanded="menuOpen"
          aria-label="Menú de navegación"
          @click="toggleMenu"
        >
          <span class="navbar__burger-bar"></span>
          <span class="navbar__burger-bar"></span>
          <span class="navbar__burger-bar"></span>
        </button>
      </div>

    </div>
  </nav>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import { RouterLink } from 'vue-router'
  import { ShoppingCart } from 'lucide-vue-next'
  import { useCarritoStore } from '@/stores/carritoStore'

  const carrito = useCarritoStore()
  const menuOpen = ref(false)
  const isScrolled = ref(false)

  const navLinks = [
    { name: 'home',      path: '/',          label: 'Inicio'    },
    { name: 'nosotros',  path: '/nosotros',  label: 'Nosotros'  },
    { name: 'productos', path: '/productos', label: 'Productos' },
    { name: 'contacto',  path: '/contacto',  label: 'Contacto'  }
  ]

  function toggleMenu() {
    menuOpen.value = !menuOpen.value
  }

  function closeMenu() {
    menuOpen.value = false
  }

  function handleScroll() {
    isScrolled.value = window.scrollY > 50
  }

  onMounted(() => window.addEventListener('scroll', handleScroll))
  onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<style scoped>
  /* ── Base ── */
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1100;
    background: rgba(26, 26, 26, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    transition: background 0.3s ease, box-shadow 0.3s ease;
  }

  .navbar--scrolled {
    background: rgba(26, 26, 26, 0.97);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  }

  .navbar__container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    height: 70px;
  }

  /* ── Logo ── */
  .navbar__logo {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    line-height: 1.1;
  }

  .navbar__logo-text {
    font-size: 1.4rem;
    font-weight: 700;
    color: #c9a84c;
    letter-spacing: 0.05em;
    font-family: Georgia, serif;
  }

  .navbar__logo-sub {
    font-size: 0.65rem;
    color: #f5f0e8;
    letter-spacing: 0.3em;
    text-transform: uppercase;
  }

  /* ── Links ── */
  .navbar__links {
    display: flex;
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .navbar__link {
    color: #f5f0e8;
    text-decoration: none;
    font-size: 0.95rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: color 0.2s;
    padding-bottom: 2px;
    border-bottom: 2px solid transparent;
  }

  .navbar__link:hover,
  .navbar__link--active {
    color: #c9a84c;
    border-bottom-color: #c9a84c;
  }

  /* ── Right section (cart + burger) ── */
  .navbar__right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  /* ── Cart ── */
  .navbar__cart {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f5f0e8;
    text-decoration: none;
    transition: color 0.2s;
    padding: 4px;
  }

  .navbar__cart:hover {
    color: #c9a84c;
  }

  .navbar__cart-badge {
    position: absolute;
    top: -5px;
    right: -8px;
    background: #c9a84c;
    color: #1a1a1a;
    font-size: 0.65rem;
    font-weight: 700;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  /* ── Burger ── */
  .navbar__burger {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
  }

  .navbar__burger-bar {
    width: 26px;
    height: 2px;
    background: #f5f0e8;
    border-radius: 2px;
    transition: transform 0.3s, opacity 0.3s;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .navbar__burger {
      display: flex;
    }

    .navbar__links {
      position: absolute;
      top: 70px;
      left: 0;
      width: 100%;
      flex-direction: column;
      align-items: center;
      gap: 0;
      background: rgba(26, 26, 26, 0.97);
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.35s ease;
    }

    .navbar__links--active {
      max-height: 300px;
    }

    .navbar__links li {
      width: 100%;
      text-align: center;
    }

    .navbar__link {
      display: block;
      padding: 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
  }
</style>
