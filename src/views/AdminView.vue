<template>
  <main class="admin-container">
    <div class="admin-header">
      <div class="admin-header__content">
        <h1 class="admin-title">Panel de Administracion</h1>
        <p class="admin-welcome">
          Bienvenido, <strong>{{ userEmail }}</strong>
        </p>
      </div>

      <div class="admin-actions">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" :size="18" />
          {{ tab.label }}
        </button>
        <button @click="handleLogout" class="btn-logout">
          <LogOut :size="18" />
          Salir
        </button>
      </div>
    </div>

    <!-- Dashboard -->
    <div v-if="activeTab === 'dashboard'" class="admin-content">
      <section class="admin-section">
        <h2 class="section-title">Dashboard</h2>
        <div class="admin-grid">
          <div class="admin-card" @click="activeTab = 'productos'">
            <div class="card-icon-wrap"><Package :size="32" color="#c9a84c" /></div>
            <h3>Productos</h3>
            <p>{{ statsProductos }} registrados</p>
          </div>
          <div class="admin-card" @click="activeTab = 'pedidos'">
            <div class="card-icon-wrap"><ClipboardList :size="32" color="#c9a84c" /></div>
            <h3>Pedidos</h3>
            <p>{{ statsPedidos }} registrados</p>
          </div>
          <div class="admin-card">
            <div class="card-icon-wrap"><FileText :size="32" color="#c9a84c" /></div>
            <h3>Contenido</h3>
            <p>Proximamente</p>
          </div>
          <div class="admin-card">
            <div class="card-icon-wrap"><Users :size="32" color="#c9a84c" /></div>
            <h3>Usuarios</h3>
            <p>{{ statsAdmins }} administradores</p>
          </div>
        </div>
      </section>
    </div>

    <!-- CRUD Productos -->
    <div v-if="activeTab === 'productos'" class="admin-content">
      <section class="admin-section">
        <div class="section-header">
          <h2 class="section-title">Gestion de Productos</h2>
          <button class="btn-primary" @click="abrirFormulario()">
            <Plus :size="18" /> Nuevo producto
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loadingProductos" class="loading-inline">
          <div class="spinner-sm"></div>
          Cargando...
        </div>

        <!-- Tabla de productos -->
        <div v-else class="tabla-wrapper">
          <table class="tabla-productos">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Precio</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in productosAdmin" :key="p.id">
                <td class="td-nombre">{{ p.nombre }}</td>
                <td>
                  <span :class="['tipo-tag', `tag-${p.tipo}`]">{{ formatTipo(p.tipo) }}</span>
                </td>
                <td>{{ formatPrice(p.precio) }}</td>
                <td>
                  <span :class="['estado-tag', p.activo ? 'tag-activo' : 'tag-inactivo']">
                    {{ p.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="td-acciones">
                  <button class="btn-icon" title="Editar" @click="abrirFormulario(p)">
                    <Pencil :size="16" />
                  </button>
                  <button
                    class="btn-icon btn-toggle"
                    :title="p.activo ? 'Desactivar' : 'Activar'"
                    @click="toggleActivo(p)"
                  >
                    <Eye v-if="p.activo" :size="16" />
                    <EyeOff v-else :size="16" />
                  </button>
                  <button class="btn-icon btn-danger" title="Eliminar" @click="confirmarEliminar(p)">
                    <Trash2 :size="16" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Gestión de Pedidos (PB14) -->
    <div v-if="activeTab === 'pedidos'" class="admin-content">
      <section class="admin-section">
        <div class="section-header">
          <h2 class="section-title">Gestion de Pedidos</h2>
          <div class="pedidos-filtros">
            <button
              v-for="f in filtrosEstado"
              :key="f.value"
              :class="['filtro-estado-btn', { active: filtroPedido === f.value }]"
              @click="filtroPedido = f.value"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <div v-if="loadingPedidos" class="loading-inline">
          <div class="spinner-sm"></div>
          Cargando pedidos...
        </div>

        <div v-else-if="pedidosFiltrados.length === 0" class="empty-pedidos">
          <ClipboardList :size="48" color="#ccc" />
          <p>No hay pedidos {{ filtroPedido !== 'todos' ? 'con estado "' + filtroPedido + '"' : 'registrados' }}.</p>
        </div>

        <div v-else class="pedidos-lista">
          <div
            v-for="pedido in pedidosFiltrados"
            :key="pedido.id"
            class="pedido-card"
          >
            <div class="pedido-header">
              <div class="pedido-info">
                <span class="pedido-folio">#{{ pedido.id.slice(0, 8).toUpperCase() }}</span>
                <span :class="['pedido-estado-tag', `estado-${pedido.estado}`]">
                  {{ pedido.estado }}
                </span>
              </div>
              <span class="pedido-fecha">{{ formatFecha(pedido.created_at) }}</span>
            </div>

            <div class="pedido-cliente">
              <p><strong>{{ pedido.cliente_nombre }}</strong></p>
              <p>{{ pedido.cliente_email }} · {{ pedido.telefono || 'Sin telefono' }}</p>
              <p class="pedido-entrega">
                <Truck v-if="pedido.metodo_entrega === 'envio'" :size="14" />
                <Store v-else :size="14" />
                {{ pedido.metodo_entrega === 'envio' ? 'Envio a domicilio' : 'Recoger en tienda' }}
              </p>
            </div>

            <!-- Detalle de items -->
            <div v-if="pedido.detalle && pedido.detalle.length" class="pedido-detalle">
              <div
                v-for="(item, idx) in pedido.detalle"
                :key="idx"
                class="detalle-item"
              >
                <span class="detalle-nombre">{{ item.nombre }}</span>
                <span class="detalle-qty">x{{ item.cantidad }}</span>
                <span class="detalle-precio">{{ formatPrice(item.subtotal) }}</span>
              </div>
            </div>

            <div class="pedido-footer">
              <span class="pedido-total">Total: {{ formatPrice(pedido.total) }}</span>
              <div class="pedido-acciones">
                <select
                  :value="pedido.estado"
                  @change="cambiarEstado(pedido.id, $event.target.value)"
                  class="select-estado"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <p v-if="pedido.notas" class="pedido-notas">
              <em>Nota: {{ pedido.notas }}</em>
            </p>
          </div>
        </div>
      </section>
    </div>

    <!-- Modal Formulario -->
    <Teleport to="body">
      <div v-if="mostrarModal" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ editando ? 'Editar producto' : 'Nuevo producto' }}</h3>
            <button class="btn-icon" @click="cerrarModal"><X :size="20" /></button>
          </div>

          <form @submit.prevent="guardarProducto" class="modal-form">
            <div class="form-group">
              <label>Nombre</label>
              <input v-model="form.nombre" type="text" required placeholder="Nombre del producto" />
            </div>

            <div class="form-group">
              <label>Descripcion</label>
              <textarea v-model="form.descripcion" rows="3" placeholder="Descripcion del producto"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Tipo</label>
                <select v-model="form.tipo" required>
                  <option value="">Seleccionar</option>
                  <option value="blanco">Blanco</option>
                  <option value="reposado">Reposado</option>
                  <option value="añejo">Añejo</option>
                  <option value="extra_añejo">Extra Añejo</option>
                </select>
              </div>

              <div class="form-group">
                <label>Precio (MXN)</label>
                <input v-model.number="form.precio" type="number" min="0" step="0.01" required />
              </div>
            </div>

            <div class="form-group">
              <label>Archivo de imagen</label>
              <select v-model="form.imagen_url">
                <option value="tequila-blanco.webp">tequila-blanco.webp</option>
                <option value="tequila-reposado.webp">tequila-reposado.webp</option>
                <option value="tequila-anejo.webp">tequila-anejo.webp</option>
              </select>
            </div>

            <div class="form-group form-check">
              <label>
                <input type="checkbox" v-model="form.activo" />
                Producto activo (visible en catalogo)
              </label>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="cerrarModal">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="guardando">
                {{ guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear') }}
              </button>
            </div>

            <p v-if="formError" class="form-error">{{ formError }}</p>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Modal Confirmar Eliminar -->
    <Teleport to="body">
      <div v-if="mostrarConfirmar" class="modal-overlay" @click.self="mostrarConfirmar = false">
        <div class="modal-content modal-sm">
          <h3>Confirmar eliminacion</h3>
          <p>¿Eliminar <strong>{{ productoEliminar?.nombre }}</strong>? Esta accion no se puede deshacer.</p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="mostrarConfirmar = false">Cancelar</button>
            <button class="btn-danger-solid" @click="eliminarProducto" :disabled="guardando">
              {{ guardando ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import {
  getProductosAdmin,
  createProducto,
  updateProducto,
  deleteProducto as deleteProductoDB,
  getPedidos,
  updatePedidoEstado
} from '@/lib/supabaseClient'
import {
  Package,
  ClipboardList,
  FileText,
  Users,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Truck,
  Store
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const userEmail = computed(() => authStore.user?.email || 'Admin')

// Tabs
const activeTab = ref('dashboard')
const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: ClipboardList },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'pedidos', label: 'Pedidos', icon: ClipboardList }
]

// Productos
const productosAdmin = ref([])
const loadingProductos = ref(false)

const statsProductos = computed(() => productosAdmin.value.length)
const statsAdmins = ref(2)

const formatTipo = (tipo) => {
  const labels = { blanco: 'Blanco', reposado: 'Reposado', 'añejo': 'Añejo', extra_añejo: 'Extra Añejo' }
  return labels[tipo] || tipo
}

const formatPrice = (precio) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(precio)
}

async function cargarProductos() {
  loadingProductos.value = true
  try {
    productosAdmin.value = await getProductosAdmin()
  } catch (err) {
    console.error('Error cargando productos:', err)
  } finally {
    loadingProductos.value = false
  }
}

// Formulario
const mostrarModal = ref(false)
const editando = ref(false)
const guardando = ref(false)
const formError = ref('')
const productoEditandoId = ref(null)

const formInicial = {
  nombre: '',
  descripcion: '',
  tipo: '',
  precio: 0,
  imagen_url: 'tequila-blanco.webp',
  activo: true
}

const form = ref({ ...formInicial })

function abrirFormulario(producto = null) {
  formError.value = ''
  if (producto) {
    editando.value = true
    productoEditandoId.value = producto.id
    form.value = {
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      tipo: producto.tipo || '',
      precio: Number(producto.precio),
      imagen_url: producto.imagen_url || 'tequila-blanco.webp',
      activo: producto.activo
    }
  } else {
    editando.value = false
    productoEditandoId.value = null
    form.value = { ...formInicial }
  }
  mostrarModal.value = true
}

function cerrarModal() {
  mostrarModal.value = false
  formError.value = ''
}

async function guardarProducto() {
  guardando.value = true
  formError.value = ''
  try {
    if (editando.value) {
      await updateProducto(productoEditandoId.value, { ...form.value })
    } else {
      await createProducto({ ...form.value })
    }
    cerrarModal()
    await cargarProductos()
  } catch (err) {
    console.error('Error guardando producto:', err)
    formError.value = err.message || 'Error al guardar el producto'
  } finally {
    guardando.value = false
  }
}

async function toggleActivo(producto) {
  try {
    await updateProducto(producto.id, { activo: !producto.activo })
    await cargarProductos()
  } catch (err) {
    console.error('Error al cambiar estado:', err)
  }
}

// Eliminar
const mostrarConfirmar = ref(false)
const productoEliminar = ref(null)

function confirmarEliminar(producto) {
  productoEliminar.value = producto
  mostrarConfirmar.value = true
}

async function eliminarProducto() {
  guardando.value = true
  try {
    await deleteProductoDB(productoEliminar.value.id)
    mostrarConfirmar.value = false
    productoEliminar.value = null
    await cargarProductos()
  } catch (err) {
    console.error('Error al eliminar:', err)
  } finally {
    guardando.value = false
  }
}

// Pedidos (PB14)
const pedidosAdmin = ref([])
const loadingPedidos = ref(false)
const filtroPedido = ref('todos')

const statsPedidos = computed(() => pedidosAdmin.value.length)

const filtrosEstado = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' }
]

const pedidosFiltrados = computed(() => {
  if (filtroPedido.value === 'todos') return pedidosAdmin.value
  return pedidosAdmin.value.filter(p => p.estado === filtroPedido.value)
})

function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

async function cargarPedidos() {
  loadingPedidos.value = true
  try {
    pedidosAdmin.value = await getPedidos()
  } catch (err) {
    console.error('Error cargando pedidos:', err)
  } finally {
    loadingPedidos.value = false
  }
}

async function cambiarEstado(id, nuevoEstado) {
  try {
    await updatePedidoEstado(id, nuevoEstado)
    await cargarPedidos()
  } catch (err) {
    console.error('Error al cambiar estado:', err)
  }
}

// Logout
async function handleLogout() {
  const { success } = await authStore.logout()
  if (success) {
    router.push('/login')
  }
}

onMounted(() => {
  cargarProductos()
  cargarPedidos()
})
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background-color: #faf7f2;
  padding: 5.5rem 1.5rem 2rem;
}

.admin-header {
  max-width: 1200px;
  margin: 0 auto 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.admin-header__content { flex: 1; min-width: 250px; }

.admin-title {
  font-family: Georgia, serif;
  font-size: 2.2rem;
  color: #1a1a1a;
  margin: 0 0 0.25rem;
}

.admin-welcome { font-size: 0.95rem; color: #666; margin: 0; }

.admin-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.1rem;
  border: 2px solid #e5e0d5;
  background: white;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  color: #555;
  transition: all 0.2s;
}

.tab-btn:hover { border-color: #c9a84c; color: #c9a84c; }
.tab-btn.active { background: #c9a84c; border-color: #c9a84c; color: white; }

.btn-logout {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1.1rem;
  background: #e8e8e8;
  color: #555;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover { background: #d5d5d5; }

/* Content */
.admin-content { max-width: 1200px; margin: 0 auto; }

.admin-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  font-family: Georgia, serif;
  font-size: 1.5rem;
  color: #1a1a1a;
  margin: 0;
}

/* Dashboard Grid */
.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.admin-card {
  padding: 1.5rem;
  background: #faf7f2;
  border: 2px solid #e5e0d5;
  border-radius: 6px;
  text-align: center;
  transition: all 0.2s;
  cursor: pointer;
}

.admin-card:hover {
  border-color: #c9a84c;
  transform: translateY(-2px);
}

.card-icon-wrap { margin-bottom: 0.75rem; }

.admin-card h3 {
  font-family: Georgia, serif;
  font-size: 1.1rem;
  color: #1a1a1a;
  margin: 0 0 0.4rem;
}

.admin-card p { color: #888; font-size: 0.85rem; margin: 0; }

/* Tabla */
.tabla-wrapper { overflow-x: auto; }

.tabla-productos {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.tabla-productos th {
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid #e5e0d5;
  color: #888;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tabla-productos td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #f0ede7;
  vertical-align: middle;
}

.td-nombre { font-weight: 600; color: #1a1a1a; }

.tipo-tag {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tag-blanco { background: #e8f4f8; color: #0c566e; }
.tag-reposado { background: #fff3e0; color: #e65100; }
.tag-añejo { background: #f3e5f5; color: #6a1b9a; }
.tag-extra_añejo { background: #fce4ec; color: #880e4f; }

.estado-tag {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tag-activo { background: #e8f5e9; color: #2e7d32; }
.tag-inactivo { background: #fbe9e7; color: #c62828; }

.td-acciones { display: flex; gap: 0.4rem; }

.btn-icon {
  background: none;
  border: 1px solid #e5e0d5;
  border-radius: 4px;
  padding: 0.4rem;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}

.btn-icon:hover { border-color: #c9a84c; color: #c9a84c; }
.btn-danger:hover { border-color: #d9534f; color: #d9534f; }

/* Buttons */
.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.2rem;
  background: #c9a84c;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover { background: #b39340; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-secondary {
  padding: 0.65rem 1.2rem;
  background: #e8e8e8;
  color: #555;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-secondary:hover { background: #d5d5d5; }

.btn-danger-solid {
  padding: 0.65rem 1.2rem;
  background: #d9534f;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}

.btn-danger-solid:hover { background: #c9302c; }
.btn-danger-solid:disabled { opacity: 0.6; cursor: not-allowed; }

/* Loading inline */
.loading-inline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #888;
}

.spinner-sm {
  border: 3px solid #e8e8e8;
  border-top: 3px solid #c9a84c;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 10px;
  padding: 2rem;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-sm { max-width: 400px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  font-family: Georgia, serif;
  font-size: 1.3rem;
  color: #1a1a1a;
  margin: 0;
}

.modal-form { display: flex; flex-direction: column; gap: 1rem; }

.form-group { display: flex; flex-direction: column; gap: 0.3rem; }

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group textarea,
.form-group select {
  padding: 0.65rem 0.8rem;
  border: 2px solid #e5e0d5;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #c9a84c;
}

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.form-check label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.form-error {
  color: #d9534f;
  font-size: 0.85rem;
  margin: 0;
}

/* Pedidos */
.pedidos-filtros {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.filtro-estado-btn {
  padding: 0.4rem 0.8rem;
  border: 1px solid #e5e0d5;
  background: white;
  border-radius: 16px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  color: #888;
  transition: all 0.2s;
}

.filtro-estado-btn:hover { border-color: #c9a84c; color: #c9a84c; }
.filtro-estado-btn.active { background: #c9a84c; border-color: #c9a84c; color: white; }

.empty-pedidos {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  text-align: center;
  color: #888;
}

.pedidos-lista {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pedido-card {
  border: 1px solid #e5e0d5;
  border-radius: 8px;
  padding: 1.25rem;
  transition: border-color 0.2s;
}

.pedido-card:hover { border-color: #c9a84c; }

.pedido-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.pedido-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.pedido-folio {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1a1a1a;
  font-family: monospace;
}

.pedido-estado-tag {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.estado-pendiente { background: #fff3e0; color: #e65100; }
.estado-confirmado { background: #e3f2fd; color: #1565c0; }
.estado-enviado { background: #f3e5f5; color: #6a1b9a; }
.estado-entregado { background: #e8f5e9; color: #2e7d32; }
.estado-cancelado { background: #fbe9e7; color: #c62828; }

.pedido-fecha {
  font-size: 0.8rem;
  color: #888;
}

.pedido-cliente p {
  margin: 0.15rem 0;
  font-size: 0.9rem;
  color: #555;
}

.pedido-entrega {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #888;
  font-size: 0.82rem;
  margin-top: 0.25rem;
}

.pedido-detalle {
  background: #faf7f2;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin: 0.75rem 0;
}

.detalle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;
  font-size: 0.85rem;
}

.detalle-nombre { flex: 1; color: #1a1a1a; font-weight: 500; }
.detalle-qty { color: #888; margin: 0 1rem; }
.detalle-precio { font-weight: 600; color: #1a1a1a; }

.pedido-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f0ede7;
}

.pedido-total {
  font-weight: 700;
  font-size: 1rem;
  color: #1a1a1a;
}

.select-estado {
  padding: 0.4rem 0.7rem;
  border: 1px solid #e5e0d5;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  background: white;
  color: #555;
}

.select-estado:focus {
  outline: none;
  border-color: #c9a84c;
}

.pedido-notas {
  font-size: 0.82rem;
  color: #888;
  margin: 0.5rem 0 0;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-container { padding: 5rem 1rem 1rem; }
  .admin-header { flex-direction: column; align-items: stretch; }
  .admin-title { font-size: 1.8rem; }
  .admin-section { padding: 1.25rem; }
  .form-row { grid-template-columns: 1fr; }
  .tabla-productos { font-size: 0.8rem; }
  .tabla-productos th,
  .tabla-productos td { padding: 0.6rem 0.5rem; }
}
</style>
