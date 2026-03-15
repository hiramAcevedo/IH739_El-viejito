<template>
  <main class="admin-container">
    <div class="admin-header">
      <div class="admin-header__content">
        <h1 class="admin-title">Panel de Administración</h1>
        <p class="admin-welcome">
          Bienvenido, <strong>{{ userEmail }}</strong>
        </p>
      </div>

      <button @click="handleLogout" class="btn-logout">
        Cerrar Sesión
      </button>
    </div>

    <div class="admin-content">
      <section class="admin-section">
        <h2 class="section-title">Dashboard</h2>
        <p class="section-description">
          Este es tu panel de administración. En futuros sprints se agregarán
          módulos para gestionar productos, pedidos y contenido del sitio.
        </p>

        <div class="admin-grid">
          <div class="admin-card">
            <div class="card-icon">📦</div>
            <h3>Productos</h3>
            <p>Gestión de inventario y catálogo</p>
            <p class="status-coming">Próximamente</p>
          </div>

          <div class="admin-card">
            <div class="card-icon">📋</div>
            <h3>Pedidos</h3>
            <p>Seguimiento de ventas</p>
            <p class="status-coming">Próximamente</p>
          </div>

          <div class="admin-card">
            <div class="card-icon">📝</div>
            <h3>Contenido</h3>
            <p>Editar páginas del sitio</p>
            <p class="status-coming">Próximamente</p>
          </div>

          <div class="admin-card">
            <div class="card-icon">👥</div>
            <h3>Usuarios</h3>
            <p>Gestión de administradores</p>
            <p class="status-coming">Próximamente</p>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/authStore'

  const router = useRouter()
  const authStore = useAuthStore()

  const userEmail = computed(() => authStore.user?.email || 'Admin')

  async function handleLogout() {
    const { success } = await authStore.logout()

    if (success) {
      router.push('/login')
    }
  }
</script>

<style scoped>
  .admin-container {
    min-height: 100vh;
    background-color: #faf7f2;
    padding: 2rem 1.5rem;
  }

  .admin-header {
    max-width: 1200px;
    margin: 0 auto 3rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .admin-header__content {
    flex: 1;
    min-width: 250px;
  }

  .admin-title {
    font-family: Georgia, serif;
    font-size: 2.5rem;
    color: #1a1a1a;
    margin: 0 0 0.5rem;
  }

  .admin-welcome {
    font-size: 1rem;
    color: #666;
    margin: 0;
  }

  .btn-logout {
    padding: 0.75rem 1.5rem;
    background: #c9a84c;
    color: #1a1a1a;
    border: none;
    border-radius: 4px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;
  }

  .btn-logout:hover {
    background: #e0c068;
    transform: translateY(-1px);
  }

  .admin-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  .admin-section {
    background: white;
    padding: 2.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  }

  .section-title {
    font-family: Georgia, serif;
    font-size: 1.8rem;
    color: #1a1a1a;
    margin: 0 0 0.5rem;
  }

  .section-description {
    color: #666;
    font-size: 1rem;
    margin: 0 0 2rem;
    line-height: 1.6;
  }

  .admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
  }

  .admin-card {
    padding: 2rem;
    background: #faf7f2;
    border: 2px solid #e5e0d5;
    border-radius: 6px;
    text-align: center;
    transition: all 0.2s;
  }

  .admin-card:hover {
    border-color: #c9a84c;
    box-shadow: 0 4px 12px rgba(201, 168, 76, 0.1);
    transform: translateY(-2px);
  }

  .card-icon {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .admin-card h3 {
    font-family: Georgia, serif;
    font-size: 1.2rem;
    color: #1a1a1a;
    margin: 0 0 0.5rem;
  }

  .admin-card p {
    color: #666;
    font-size: 0.9rem;
    margin: 0.25rem 0;
  }

  .status-coming {
    color: #c9a84c !important;
    font-weight: 600;
    font-size: 0.85rem !important;
    margin-top: 0.75rem !important;
  }

  @media (max-width: 768px) {
    .admin-container {
      padding: 1.5rem 1rem;
    }

    .admin-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .admin-title {
      font-size: 2rem;
    }

    .admin-section {
      padding: 1.5rem;
    }

    .admin-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
