<template>
  <form class="buscar" novalidate @submit.prevent="enviar">
    <div class="campo">
      <label for="seg-correo">Correo</label>
      <input id="seg-correo" v-model.trim="correo" type="email" autocomplete="email" required
        :aria-invalid="!!errorCorreo" aria-describedby="seg-correo-error" />
      <small v-if="errorCorreo" id="seg-correo-error" class="campo__error">{{ errorCorreo }}</small>
    </div>
    <div class="campo">
      <label for="seg-folio">Folio</label>
      <input id="seg-folio" v-model.trim="folio" maxlength="8" autocomplete="off" required class="campo__folio"
        :aria-invalid="!!errorFolio" aria-describedby="seg-folio-ayuda" @input="folio = folio.toUpperCase()" />
      <small id="seg-folio-ayuda" :class="errorFolio ? 'campo__error' : 'campo__ayuda'">
        {{ errorFolio || 'Los ocho caracteres que vienen en tu correo de confirmación.' }}
      </small>
    </div>
    <p v-if="error" class="buscar__error" role="alert">{{ error }}</p>
    <BotonPrimario type="submit" bloque :cargando="cargando">Buscar pedido</BotonPrimario>
  </form>
</template>

<script setup>
/**
 * FormularioSeguimiento · correo y folio, con sus mensajes. Sólo revisa el formato; si el pedido existe y los dos
 * datos coinciden lo decide la API, y su mensaje no dice cuál de los dos falló.
 */
import { ref } from 'vue'
import BotonPrimario from './BotonPrimario.vue'

defineProps({ cargando: { type: Boolean, default: false }, error: { type: String, default: '' } })
const emit = defineEmits(['buscar'])
const correo = ref('')
const folio = ref('')
const errorCorreo = ref('')
const errorFolio = ref('')

function enviar() {
  errorCorreo.value = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo.value) ? '' : 'Escribe el correo con el que compraste.'
  errorFolio.value = /^[0-9A-F]{8}$/.test(folio.value) ? '' : 'El folio tiene ocho caracteres, letras de la A a la F y números.'
  if (!errorCorreo.value && !errorFolio.value) emit('buscar', { correo: correo.value.toLowerCase(), folio: folio.value })
}
</script>

<style scoped>
.buscar { display: flex; flex-direction: column; gap: var(--espacio-4); }
.campo { display: flex; flex-direction: column; gap: var(--espacio-1); }
.campo label { font-size: 0.9rem; font-weight: 600; color: var(--color-texto-2); }
.campo input { padding: 0.8rem; border: 1px solid #c9c2b4; border-radius: var(--radio); font: inherit; background: var(--color-crema); color: var(--color-texto); }
.campo input:focus { outline: none; border-color: var(--color-texto); box-shadow: var(--enfoque); }
.campo__folio { font-family: var(--fuente-mono); letter-spacing: 0.15em; text-transform: uppercase; }
.campo__ayuda { color: var(--color-texto-2); font-size: 0.85rem; }
.campo__error, .buscar__error { color: var(--color-error); font-size: 0.9rem; }
</style>
