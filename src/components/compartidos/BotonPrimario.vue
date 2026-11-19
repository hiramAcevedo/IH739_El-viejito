<template>
  <RouterLink v-if="to && !disabled" :to="to" :class="clases"><slot /></RouterLink>
  <a v-else-if="href && !disabled" :href="href" :class="clases"><slot /></a>
  <button v-else :type="type" :class="clases" :disabled="disabled || cargando" :aria-busy="cargando">
    <span v-if="cargando" class="giro" aria-hidden="true"></span>
    <slot />
  </button>
</template>

<script setup>
/**
 * BotonPrimario · el dorado de la marca con texto casi negro (7.6:1).
 * Botón, liga interna (to) o liga externa (href); variante secundaria con borde; estado de carga.
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  to: { type: [String, Object], default: null },
  href: { type: String, default: null },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  cargando: { type: Boolean, default: false },
  variante: { type: String, default: 'primario' }, // primario | secundario
  bloque: { type: Boolean, default: false }
})

const clases = computed(() => ['boton', `boton--${props.variante}`, { 'boton--bloque': props.bloque }])
</script>

<style scoped>
.boton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--espacio-2);
  padding: 0.85rem var(--espacio-6);
  border-radius: var(--radio);
  font-family: var(--fuente-texto);
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
  border: 2px solid transparent;
  line-height: 1.2;
}
.boton--bloque { width: 100%; }
.boton--primario { background: var(--color-dorado); color: var(--color-texto); }
.boton--primario:hover:not(:disabled) { background: var(--color-dorado-hover); }
.boton--secundario { background: var(--color-blanco); color: var(--color-texto); border-color: var(--color-texto); }
.boton--secundario:hover:not(:disabled) { background: var(--color-crema-oscuro); }
.boton:focus-visible { outline: none; box-shadow: var(--enfoque); }
.boton:disabled { opacity: 0.55; cursor: not-allowed; }
.giro {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: girar 0.8s linear infinite;
}
@keyframes girar { to { transform: rotate(360deg); } }
</style>
