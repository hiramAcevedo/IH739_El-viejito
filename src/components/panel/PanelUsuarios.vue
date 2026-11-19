<template>
  <section class="usuarios">
    <div class="panel-seccion">
      <div class="panel-cabeza">
        <h2 class="panel-titulo">Administradores</h2>
        <BotonPrimario variante="secundario" @click="altaAbierta = !altaAbierta">Alta directa</BotonPrimario>
      </div>

      <form v-if="altaAbierta" class="formulario alta" @submit.prevent="darDeAlta">
        <label>Nombre <input v-model.trim="alta.nombre" required /></label>
        <label>Correo <input v-model.trim="alta.email" type="email" required /></label>
        <label>Contraseña temporal <input v-model="alta.contrasena" type="password" minlength="10" required autocomplete="new-password" /></label>
        <BotonPrimario type="submit" :cargando="trabajando === 'alta'">Crear cuenta</BotonPrimario>
      </form>

      <p v-if="cargando" class="panel-nota">Cargando…</p>
      <p v-if="error" class="panel-error" role="alert">{{ error }}</p>
      <div v-if="!cargando" class="tabla-envoltura">
        <table class="tabla">
          <thead><tr><th>Nombre y correo</th><th>Rol</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            <tr v-for="u in usuarios" :key="u.id">
              <td><strong>{{ u.nombre }}</strong><br /><span class="correo">{{ u.email }}</span></td>
              <td class="mono">{{ u.rol }}</td>
              <td>
                <span v-if="u.rol === 'superadmin'">Activo</span>
                <span v-else-if="u.estado === 'invitado'">Invitado<br /><small>vence el {{ formatoFecha(u.vence) }}</small></span>
                <label v-else class="interruptor">
                  <input type="checkbox" :checked="u.estado === 'activo'" :aria-label="`Cuenta de ${u.nombre} activa`" @change="alternar(u)" />
                  <span>{{ u.estado === 'activo' ? 'Activo' : 'Apagado' }}</span>
                </label>
              </td>
              <td class="acciones">
                <em v-if="u.rol === 'superadmin'">Tu cuenta</em>
                <button v-else-if="u.estado === 'invitado'" class="boton-chico" @click="copiar(u.liga)">Copiar liga</button>
                <button v-else class="boton-chico" @click="borrar(u)">Borrar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="copiado" class="panel-nota" role="status">Liga copiada.</p>
    </div>

    <aside class="panel-seccion invitar">
      <h2 class="panel-titulo">Invitar por liga</h2>
      <form class="formulario" @submit.prevent="invitar">
        <label>Nombre <input v-model.trim="invitacion.nombre" required /></label>
        <label>Correo <input v-model.trim="invitacion.email" type="email" required /></label>
        <p class="panel-nota">Rol: admin</p>
        <BotonPrimario type="submit" bloque :cargando="trabajando === 'invitar'">Generar liga</BotonPrimario>
      </form>
      <div v-if="liga" class="liga">
        <code>{{ liga.liga }}</code>
        <p class="panel-nota">Vence el {{ formatoFechaHora(liga.vence) }} y sirve una sola vez.</p>
        <button class="boton-chico" @click="copiar(liga.liga)">Copiar liga</button>
      </div>
    </aside>
  </section>
</template>

<script setup>
/**
 * Usuarios, sólo para el superadministrador: la lista de administradores, el alta directa, la invitación por liga,
 * el apagado y la baja. Las altas pasan por la API porque crear una cuenta en Supabase Auth pide la llave de servicio,
 * que nunca viaja al navegador. La cuenta del superadministrador no se apaga ni se borra desde aquí.
 */
import { ref, reactive, onMounted } from 'vue'
import { listarUsuarios, crearUsuario, cambiarUsuario, borrarUsuario, invitarUsuario } from '@/lib/api'
import { formatoFecha, formatoFechaHora } from '@/lib/formato'
import { useAuthStore } from '@/stores/authStore'
import BotonPrimario from '@/components/compartidos/BotonPrimario.vue'

const auth = useAuthStore()
const usuarios = ref([])
const cargando = ref(true)
const trabajando = ref('')
const error = ref('')
const copiado = ref(false)
const altaAbierta = ref(false)
const alta = reactive({ nombre: '', email: '', contrasena: '' })
const invitacion = reactive({ nombre: '', email: '' })
const liga = ref(null)

async function cargar() {
  cargando.value = true
  try {
    usuarios.value = await listarUsuarios(await auth.token())
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}

async function accion(nombre, fn) {
  trabajando.value = nombre
  error.value = ''
  try {
    await fn(await auth.token())
    await cargar()
  } catch (e) {
    error.value = e.message
  } finally {
    trabajando.value = ''
  }
}

const darDeAlta = () => accion('alta', async (t) => {
  await crearUsuario(t, { ...alta })
  Object.assign(alta, { nombre: '', email: '', contrasena: '' })
  altaAbierta.value = false
})
const alternar = (u) => accion('estado', (t) => cambiarUsuario(t, u.id, { estado: u.estado === 'activo' ? 'apagado' : 'activo' }))
const borrar = (u) => window.confirm(`¿Borrar la cuenta de ${u.nombre}?`) && accion('borrar', (t) => borrarUsuario(t, u.id))
const invitar = () => accion('invitar', async (t) => { liga.value = await invitarUsuario(t, { ...invitacion }) })

async function copiar(ruta) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}${ruta}`)
    copiado.value = true
    setTimeout(() => (copiado.value = false), 2000)
  } catch {
    /* sin portapapeles: la liga queda a la vista */
  }
}

onMounted(cargar)
</script>

<style scoped>
.usuarios { display: grid; grid-template-columns: 1fr; gap: var(--espacio-5); align-items: start; }
.panel-seccion { background: var(--color-blanco); padding: var(--espacio-6); border-radius: var(--radio-grande); box-shadow: var(--sombra); }
.panel-cabeza { display: flex; justify-content: space-between; align-items: center; gap: var(--espacio-3); margin-bottom: var(--espacio-4); }
.panel-titulo { font-family: var(--fuente-titulos); font-size: 1.4rem; color: var(--color-texto); }
.panel-nota { color: var(--color-texto-2); font-size: 0.9rem; }
.panel-error { color: var(--color-error); }
.tabla-envoltura { overflow-x: auto; }
.tabla { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
.tabla th { text-align: left; padding: 0.65rem 0.75rem; background: var(--color-crema-oscuro); color: var(--color-texto); }
.tabla td { padding: 0.75rem; border-bottom: 1px solid var(--color-borde); color: var(--color-texto); vertical-align: middle; }
.correo { color: var(--color-texto-2); font-size: 0.85rem; }
.mono { font-family: var(--fuente-mono); }
.acciones { text-align: right; white-space: nowrap; }
.acciones em { color: var(--color-texto-2); }
.boton-chico { padding: 0.4rem 0.9rem; border: 1px solid var(--color-texto); background: var(--color-blanco); color: var(--color-texto); border-radius: var(--radio); font-weight: 600; cursor: pointer; }
.boton-chico:focus-visible { outline: none; box-shadow: var(--enfoque); }
.interruptor { display: inline-flex; align-items: center; gap: var(--espacio-2); cursor: pointer; }
.interruptor input { width: 40px; height: 22px; accent-color: var(--color-texto); }
.formulario { display: flex; flex-direction: column; gap: var(--espacio-3); }
.formulario label { display: flex; flex-direction: column; gap: var(--espacio-1); font-size: 0.88rem; font-weight: 600; color: var(--color-texto-2); }
.formulario input { padding: 0.65rem; border: 1px solid #c9c2b4; border-radius: var(--radio); font: inherit; color: var(--color-texto); background: var(--color-crema); }
.formulario input:focus { outline: none; border-color: var(--color-texto); box-shadow: var(--enfoque); }
.alta { background: var(--color-crema); border-radius: var(--radio-grande); padding: var(--espacio-4); margin-bottom: var(--espacio-4); }
.invitar .panel-titulo { margin-bottom: var(--espacio-4); }
.liga { margin-top: var(--espacio-4); display: flex; flex-direction: column; gap: var(--espacio-2); }
.liga code { display: block; padding: var(--espacio-3); border: 1px solid #c9c2b4; border-radius: var(--radio); background: var(--color-crema); font-size: 0.85rem; word-break: break-all; color: var(--color-texto); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
@media (min-width: 1100px) { .usuarios { grid-template-columns: 1.7fr 1fr; } }
@media (max-width: 600px) { .panel-seccion { padding: var(--espacio-4); } }
</style>
