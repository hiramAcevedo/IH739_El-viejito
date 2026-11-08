<template>
  <p v-if="MODO_EJEMPLO" class="aviso-ejemplo" role="note">Datos de ejemplo</p>
</template>

<script setup>
/** Marca visible del modo de ejemplo: sólo aparece en el servidor de desarrollo con VITE_API_EJEMPLO=1. */
import { MODO_EJEMPLO } from '@/lib/api'
</script>

<style scoped>
.aviso-ejemplo {
  position: fixed; left: 1rem; bottom: 1rem; z-index: 1001; margin: 0;
  padding: 0.4rem 0.8rem; border-radius: var(--radio-pildora);
  background: var(--color-texto); color: var(--color-crema); font-size: 0.78rem; font-weight: 600;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}
</style>
