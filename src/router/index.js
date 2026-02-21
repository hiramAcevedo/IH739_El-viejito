import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Inicio | Tequila El Viejito' }
  },
  {
    path: '/nosotros',
    name: 'nosotros',
    // Lazy load — el componente solo se carga cuando se navega a esta ruta
    component: () => import('@/views/NosotrosView.vue'),
    meta: { title: 'Nosotros | Tequila El Viejito' }
  },
  {
    path: '/productos',
    name: 'productos',
    component: () => import('@/views/ProductosView.vue'),
    meta: { title: 'Productos | Tequila El Viejito' }
  },
  {
    path: '/contacto',
    name: 'contacto',
    component: () => import('@/views/ContactoView.vue'),
    meta: { title: 'Contacto | Tequila El Viejito' }
  },
  {
    // Catch-all: redirige rutas desconocidas al home
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  }
})

// Actualiza el título de la pestaña en cada navegación
router.afterEach((to) => {
  document.title = to.meta.title || 'Tequila El Viejito'
})

export default router
