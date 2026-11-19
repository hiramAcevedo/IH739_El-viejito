<template>
  <main class="seguimiento">
    <div class="seguimiento__caja">
      <h1>Rastrear pedido</h1>
      <p class="seguimiento__intro">Sin cuenta ni contraseña: el correo de tu compra y tu folio.</p>
      <FormularioSeguimiento :cargando="buscando" :error="error" @buscar="buscar" />
    </div>
  </main>
</template>

<script setup>
/**
 * Rastrear pedido · el comprador no tiene cuenta: con su correo y su folio consulta el pedido a la API, que responde
 * sólo si los dos coinciden. La tabla de pedidos sigue cerrada al visitante.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { consultarSeguimiento } from '@/lib/api'
import FormularioSeguimiento from '@/components/compartidos/FormularioSeguimiento.vue'

const router = useRouter()
const buscando = ref(false)
const error = ref('')

async function buscar(datos) {
  buscando.value = true
  error.value = ''
  try {
    const pedido = await consultarSeguimiento(datos)
    // el detalle no vuelve a pedir el correo: se lo pasamos sólo para esta pestaña
    sessionStorage.setItem(`seguimiento-${pedido.folio}`, JSON.stringify(pedido))
    router.push({ name: 'seguimiento-detalle', params: { folio: pedido.folio } })
  } catch (e) {
    error.value = e.estado === 404 ? e.message : 'No pudimos consultar el pedido. Intenta de nuevo en un momento.'
  } finally {
    buscando.value = false
  }
}
</script>

<style scoped>
.seguimiento { min-height: 100vh; background: var(--color-crema); padding: 6.5rem var(--espacio-4) var(--espacio-8); }
.seguimiento__caja { max-width: 460px; margin: 0 auto; background: var(--color-blanco); border-radius: var(--radio-grande); box-shadow: var(--sombra); padding: var(--espacio-6) var(--espacio-5); }
.seguimiento h1 { font-family: var(--fuente-titulos); font-size: 2rem; color: var(--color-texto); }
.seguimiento__intro { color: var(--color-texto-2); margin: var(--espacio-2) 0 var(--espacio-5); }
</style>
