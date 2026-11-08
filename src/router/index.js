import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { useAuthStore } from '@/stores/authStore'

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
    path: '/productos/:id',
    name: 'producto-detalle',
    component: () => import('@/views/ProductoDetalleView.vue'),
    meta: { title: 'Detalle | Tequila El Viejito' },
    props: true
  },
  {
    path: '/contacto',
    name: 'contacto',
    component: () => import('@/views/ContactoView.vue'),
    meta: { title: 'Contacto | Tequila El Viejito' }
  },
  {
    path: '/carrito',
    name: 'carrito',
    component: () => import('@/views/CarritoView.vue'),
    meta: { title: 'Carrito | Tequila El Viejito' }
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/views/CheckoutView.vue'),
    meta: { title: 'Checkout | Tequila El Viejito' }
  },
  {
    // Las tres pantallas de regreso de la pasarela comparten la vista: el estado lo dice la API, no la ruta
    path: '/pago/confirmado',
    name: 'pago-confirmado',
    component: () => import('@/views/RegresoPagoView.vue'),
    meta: { title: 'Pago confirmado | Tequila El Viejito' }
  },
  {
    path: '/pago/pendiente',
    name: 'pago-pendiente',
    component: () => import('@/views/RegresoPagoView.vue'),
    meta: { title: 'Pago pendiente | Tequila El Viejito' }
  },
  {
    path: '/pago/error',
    name: 'pago-error',
    component: () => import('@/views/RegresoPagoView.vue'),
    meta: { title: 'No se pudo cobrar | Tequila El Viejito' }
  },
  {
    // Seguimiento sin cuenta: correo y folio, o la liga firmada del correo de confirmación
    path: '/seguimiento',
    name: 'seguimiento',
    component: () => import('@/views/SeguimientoView.vue'),
    meta: { title: 'Rastrear pedido | Tequila El Viejito' }
  },
  {
    path: '/seguimiento/:folio',
    name: 'seguimiento-detalle',
    component: () => import('@/views/SeguimientoDetalleView.vue'),
    meta: { title: 'Tu pedido | Tequila El Viejito' }
  },
  {
    // Avisos legales: el texto lo da la API y se edita desde el panel
    path: '/privacidad',
    name: 'privacidad',
    component: () => import('@/views/LegalView.vue'),
    meta: { title: 'Aviso de privacidad | Tequila El Viejito', clave: 'privacidad' }
  },
  {
    path: '/terminos',
    name: 'terminos',
    component: () => import('@/views/LegalView.vue'),
    meta: { title: 'Términos de venta | Tequila El Viejito', clave: 'terminos' }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Login | Tequila El Viejito' }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { title: 'Panel de Administración | Tequila El Viejito', requiresAuth: true }
  },
  // Página de muestra de los componentes compartidos: sólo en el servidor de desarrollo
  ...(import.meta.env.DEV
    ? [{ path: '/componentes', name: 'componentes', component: () => import('@/views/ComponentesView.vue'), meta: { title: 'Componentes | Tequila El Viejito' } }]
    : []),
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

// Navigation guard: protege rutas que requieren autenticación
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth

  if (requiresAuth) {
    // Verifica si el usuario está autenticado
    const isAuthenticated = await authStore.checkAuth()

    if (!isAuthenticated) {
      // No está autenticado, redirige a login
      next('/login')
    } else {
      // Está autenticado, permite la navegación
      next()
    }
  } else if (to.path === '/login' && authStore.user) {
    // Si ya está autenticado y trata de ir a login, redirige a admin
    next('/admin')
  } else {
    // Permite la navegación normal
    next()
  }
})

// Actualiza el título de la pestaña en cada navegación
router.afterEach((to) => {
  document.title = to.meta.title || 'Tequila El Viejito'
})

export default router
