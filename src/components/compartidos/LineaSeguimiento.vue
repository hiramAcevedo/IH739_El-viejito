<template>
  <ol class="linea" aria-label="Estados del pedido">
    <li v-for="paso in pasos" :key="paso.etiqueta" :class="['linea__paso', { hecho: paso.hecho }]">
      <span class="linea__punto" aria-hidden="true"></span>
      <span class="linea__etiqueta">{{ paso.etiqueta }}</span>
      <time v-if="paso.fecha" class="linea__fecha" :datetime="paso.fecha">{{ formatoFecha(paso.fecha) }}</time>
      <span class="sr-only">{{ paso.hecho ? '(hecho)' : '(por venir)' }}</span>
    </li>
  </ol>
</template>

<script setup>
/** LineaSeguimiento · los estados del pedido con sus fechas; los que faltan, con el punto vacío. */
import { formatoFecha } from '@/lib/formato'

defineProps({ pasos: { type: Array, required: true } }) // [{ etiqueta, fecha, hecho }]
</script>

<style scoped>
.linea { list-style: none; padding: 0; margin: 0; }
.linea__paso { position: relative; display: grid; grid-template-columns: 28px 1fr auto; align-items: center; padding: var(--espacio-2) 0; }
.linea__paso:not(:last-child)::after {
  content: ''; position: absolute; left: 10px; top: 32px; bottom: -8px; width: 3px; background: var(--color-borde);
}
.linea__paso.hecho:not(:last-child)::after { background: var(--color-texto); }
.linea__punto { width: 22px; height: 22px; border-radius: 50%; border: 3px solid var(--color-texto); background: var(--color-blanco); z-index: 1; }
.linea__paso.hecho .linea__punto { background: var(--color-texto); }
.linea__etiqueta { color: var(--color-texto-2); font-size: 1rem; }
.linea__paso.hecho .linea__etiqueta { color: var(--color-texto); font-weight: 700; }
.linea__fecha { color: var(--color-texto-2); font-size: 0.9rem; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
