<template>
  <main class="registro">
    <div class="registro__caja">
      <p v-if="cargando" class="registro__texto">Revisando la invitación…</p>

      <template v-else-if="error">
        <h1>Invitación no válida</h1>
        <p class="registro__texto">{{ error }}</p>
      </template>

      <template v-else-if="listo">
        <h1>Tu cuenta quedó lista</h1>
        <p class="registro__texto">Entra al panel con tu correo y la contraseña que acabas de elegir.</p>
        <BotonPrimario to="/login" bloque>Ir al inicio de sesión</BotonPrimario>
      </template>

      <template v-else>
        <h1>Crea tu cuenta del panel</h1>
        <p class="registro__texto">Te invitaron como administrador de Tequila El Viejito. La invitación vence el
          {{ formatoFechaHora(invitacion.vence) }} y sirve una sola vez.</p>
        <form class="formulario" @submit.prevent="crear">
          <label>Nombre <input v-model.trim="nombre" required autocomplete="name" /></label>
          <label>Correo <input :value="invitacion.email" readonly aria-readonly="true" /></label>
          <label>Contraseña <input v-model="contrasena" type="password" minlength="10" required autocomplete="new-password" /></label>
          <label>Repite la contraseña <input v-model="repetida" type="password" required autocomplete="new-password" /></label>
          <p v-if="errorForm" class="registro__error" role="alert">{{ errorForm }}</p>
          <BotonPrimario type="submit" bloque :cargando="creando">Crear cuenta</BotonPrimario>
        </form>
      </template>
    </div>
  </main>
</template>

<script setup>
/**
 * Registro por invitación (/admin/registro?invitacion=…). La liga la genera el superadministrador desde Usuarios;
 * la API la valida, trae el nombre y el correo, y crea la cuenta. La liga vence y sirve una sola vez.
 */
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { leerInvitacion, aceptarInvitacion } from '@/lib/api'
import { formatoFechaHora } from '@/lib/formato'
import BotonPrimario from '@/components/compartidos/BotonPrimario.vue'

const route = useRoute()
const invitacion = ref(null)
const nombre = ref('')
const contrasena = ref('')
const repetida = ref('')
const cargando = ref(true)
const creando = ref(false)
const listo = ref(false)
const error = ref('')
const errorForm = ref('')

onMounted(async () => {
  try {
    invitacion.value = await leerInvitacion(route.query.invitacion || '')
    nombre.value = invitacion.value.nombre
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
})

async function crear() {
  errorForm.value = ''
  if (contrasena.value.length < 10) return (errorForm.value = 'Usa al menos 10 caracteres.')
  if (contrasena.value !== repetida.value) return (errorForm.value = 'Las contraseñas no coinciden.')
  creando.value = true
  try {
    await aceptarInvitacion(route.query.invitacion, { nombre: nombre.value, contrasena: contrasena.value })
    listo.value = true
  } catch (e) {
    errorForm.value = e.message
  } finally {
    creando.value = false
  }
}
</script>

<style scoped>
.registro { min-height: 100vh; background: var(--color-crema); padding: 6.5rem var(--espacio-4) var(--espacio-8); }
.registro__caja { max-width: 460px; margin: 0 auto; background: var(--color-blanco); border-radius: var(--radio-grande); box-shadow: var(--sombra); padding: var(--espacio-6) var(--espacio-5); display: flex; flex-direction: column; gap: var(--espacio-4); }
.registro h1 { font-family: var(--fuente-titulos); font-size: 1.8rem; color: var(--color-texto); }
.registro__texto { color: var(--color-texto-2); }
.registro__error { color: var(--color-error); }
.formulario { display: flex; flex-direction: column; gap: var(--espacio-3); }
.formulario label { display: flex; flex-direction: column; gap: var(--espacio-1); font-size: 0.88rem; font-weight: 600; color: var(--color-texto-2); }
.formulario input { padding: 0.7rem; border: 1px solid #c9c2b4; border-radius: var(--radio); font: inherit; color: var(--color-texto); background: var(--color-crema); }
.formulario input[readonly] { background: var(--color-crema-oscuro); color: var(--color-texto-2); }
.formulario input:focus { outline: none; border-color: var(--color-texto); box-shadow: var(--enfoque); }
</style>
