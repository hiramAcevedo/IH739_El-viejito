<template>
  <section class="panel-seccion">
    <div class="panel-cabeza">
      <h2 class="panel-titulo">Legal</h2>
      <p class="panel-nota">Los avisos del sitio se editan aquí y cambian sin tocar el código.</p>
    </div>

    <div class="pestanas" role="tablist">
      <button v-for="c in CLAVES" :key="c.clave" role="tab" :aria-selected="clave === c.clave"
        :class="['pestana', { activa: clave === c.clave }]" @click="elegir(c.clave)">{{ c.etiqueta }}</button>
    </div>

    <p v-if="cargando" class="panel-nota">Cargando…</p>
    <form v-else-if="texto" class="editor" @submit.prevent="guardar">
      <label>Título
        <input v-model.trim="texto.titulo" required />
      </label>
      <label>Texto <small>(una línea en blanco separa los párrafos)</small>
        <textarea v-model="texto.contenido" :rows="clave === 'leyenda' ? 3 : 12" required></textarea>
      </label>
      <div class="editor__pie">
        <span class="panel-nota">Última actualización: {{ formatoFechaHora(texto.actualizado) }}</span>
        <RouterLink v-if="clave !== 'leyenda'" :to="`/${clave}`" target="_blank" class="editor__ver">Ver la página</RouterLink>
        <BotonPrimario type="submit" :cargando="guardando">Guardar</BotonPrimario>
      </div>
      <p v-if="aviso" :class="aviso.ok ? 'editor__ok' : 'panel-error'" role="status">{{ aviso.texto }}</p>
    </form>
  </section>
</template>

<script setup>
/** Legal del panel: el editor simple del aviso de privacidad, los términos de venta y la leyenda de venta a mayores. */
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { leerTextoLegal, guardarTextoLegal } from '@/lib/api'
import { formatoFechaHora } from '@/lib/formato'
import { useAuthStore } from '@/stores/authStore'
import BotonPrimario from '@/components/compartidos/BotonPrimario.vue'

const CLAVES = [
  { clave: 'privacidad', etiqueta: 'Aviso de privacidad' },
  { clave: 'terminos', etiqueta: 'Términos de venta' },
  { clave: 'leyenda', etiqueta: 'Leyenda de venta a mayores' }
]
const auth = useAuthStore()
const clave = ref('terminos')
const texto = ref(null)
const cargando = ref(true)
const guardando = ref(false)
const aviso = ref(null)

async function elegir(nueva) {
  clave.value = nueva
  aviso.value = null
  cargando.value = true
  try {
    texto.value = await leerTextoLegal(nueva)
  } finally {
    cargando.value = false
  }
}

async function guardar() {
  guardando.value = true
  aviso.value = null
  try {
    texto.value = await guardarTextoLegal(await auth.token(), clave.value, { titulo: texto.value.titulo, contenido: texto.value.contenido })
    aviso.value = { ok: true, texto: 'Guardado. El sitio ya muestra el texto nuevo.' }
  } catch (e) {
    aviso.value = { ok: false, texto: e.message }
  } finally {
    guardando.value = false
  }
}

onMounted(() => elegir(clave.value))
</script>

<style scoped>
.panel-seccion { background: var(--color-blanco); padding: var(--espacio-6); border-radius: var(--radio-grande); box-shadow: var(--sombra); }
.panel-cabeza { margin-bottom: var(--espacio-4); }
.panel-titulo { font-family: var(--fuente-titulos); font-size: 1.5rem; color: var(--color-texto); }
.panel-nota { color: var(--color-texto-2); font-size: 0.9rem; }
.panel-error { color: var(--color-error); }
.pestanas { display: flex; flex-wrap: wrap; gap: var(--espacio-2); margin-bottom: var(--espacio-4); border-bottom: 1px solid var(--color-borde); }
.pestana { padding: 0.6rem 1rem; border: none; background: none; font-weight: 600; color: var(--color-texto-2); cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -1px; }
.pestana.activa { color: var(--color-texto); border-bottom-color: var(--color-dorado); }
.pestana:focus-visible { outline: none; box-shadow: var(--enfoque); }
.editor { display: flex; flex-direction: column; gap: var(--espacio-4); }
.editor label { display: flex; flex-direction: column; gap: var(--espacio-1); font-size: 0.9rem; font-weight: 600; color: var(--color-texto-2); }
.editor small { font-weight: 400; }
.editor input, .editor textarea { padding: 0.7rem; border: 1px solid #c9c2b4; border-radius: var(--radio); font: inherit; font-weight: 400; color: var(--color-texto); background: var(--color-crema); line-height: 1.6; }
.editor input:focus, .editor textarea:focus { outline: none; border-color: var(--color-texto); box-shadow: var(--enfoque); }
.editor__pie { display: flex; flex-wrap: wrap; align-items: center; gap: var(--espacio-4); justify-content: flex-end; }
.editor__pie .panel-nota { margin-right: auto; }
.editor__ver { color: var(--color-texto); font-weight: 600; }
.editor__ok { color: #1b5e20; font-weight: 600; }
@media (max-width: 600px) { .panel-seccion { padding: var(--espacio-4); } }
</style>
