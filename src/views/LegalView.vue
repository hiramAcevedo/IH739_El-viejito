<template>
  <main class="legal">
    <article class="legal__caja">
      <p v-if="cargando" class="legal__texto">Cargando…</p>
      <p v-else-if="error" class="legal__texto">{{ error }}</p>
      <template v-else>
        <h1>{{ texto.titulo }}</h1>
        <p class="legal__fecha">Última actualización: {{ formatoFecha(texto.actualizado, { day: 'numeric', month: 'long', year: 'numeric' }) }}</p>
        <p v-for="(parrafo, i) in parrafos" :key="i" class="legal__texto">{{ parrafo }}</p>
      </template>
    </article>
  </main>
</template>

<script setup>
/**
 * Avisos legales: /privacidad y /terminos. El texto no vive en el código: se lee de la API (textos_legales, de lectura
 * pública) y el negocio lo edita desde la vista Legal del panel, sin un despliegue.
 */
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { leerTextoLegal } from '@/lib/api'
import { formatoFecha } from '@/lib/formato'

const route = useRoute()
const texto = ref(null)
const cargando = ref(true)
const error = ref('')
const parrafos = computed(() => (texto.value?.contenido || '').split(/\n\s*\n/))

watch(() => route.meta.clave, async (clave) => {
  if (!clave) return
  cargando.value = true
  error.value = ''
  try {
    texto.value = await leerTextoLegal(clave)
    document.title = `${texto.value.titulo} | Tequila El Viejito`
  } catch {
    error.value = 'No pudimos cargar este aviso. Intenta de nuevo en un momento.'
  } finally {
    cargando.value = false
  }
}, { immediate: true })
</script>

<style scoped>
.legal { min-height: 100vh; background: var(--color-crema); padding: 6.5rem var(--espacio-4) var(--espacio-8); }
.legal__caja { max-width: 760px; margin: 0 auto; background: var(--color-blanco); border-radius: var(--radio-grande); box-shadow: var(--sombra); padding: var(--espacio-6); }
.legal h1 { font-family: var(--fuente-titulos); font-size: 2.1rem; color: var(--color-texto); }
.legal__fecha { color: var(--color-texto-2); font-size: 0.9rem; margin: var(--espacio-2) 0 var(--espacio-5); }
.legal__texto { color: var(--color-texto); line-height: 1.7; margin-bottom: var(--espacio-4); }
@media (max-width: 600px) { .legal__caja { padding: var(--espacio-5) var(--espacio-4); } .legal h1 { font-size: 1.7rem; } }
</style>
