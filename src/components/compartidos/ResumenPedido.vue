<template>
  <section class="resumen" :aria-busy="calculando">
    <h2 v-if="titulo" class="resumen__titulo">{{ titulo }}</h2>

    <p v-if="error" class="resumen__error" role="alert">{{ error }}</p>

    <template v-else>
      <ul v-if="!compacto" class="resumen__lineas">
        <li v-for="l in lineasVisibles" :key="l.id || l.nombre" class="resumen__linea">
          <span>{{ l.nombre }} <span class="resumen__cantidad">×{{ l.cantidad }}</span></span>
          <span v-if="l.subtotal">{{ formatoMoneda(l.subtotal) }}</span>
          <span v-else class="resumen__hueco" aria-hidden="true"></span>
        </li>
      </ul>

      <dl v-if="!compacto" class="resumen__cuentas">
        <div><dt>Subtotal</dt><dd>{{ monto(cotizacion?.subtotal) }}</dd></div>
        <div><dt>IVA (16 %)</dt><dd>{{ monto(cotizacion?.iva) }}</dd></div>
        <div><dt>Envío</dt><dd>{{ envio }}</dd></div>
      </dl>

      <div class="resumen__total" aria-live="polite">
        <span>Total</span>
        <strong v-if="calculando" class="resumen__calculando">Calculando…</strong>
        <strong v-else>{{ monto(cotizacion?.total) }}</strong>
      </div>
      <p v-if="nota" class="resumen__nota">{{ nota }}</p>
    </template>
  </section>
</template>

<script setup>
/**
 * ResumenPedido · productos, IVA, envío y total con el importe que calcula la API.
 * No suma nada: muestra la cotización que recibe y, mientras llega, "Calculando…".
 */
import { computed } from 'vue'
import { formatoMoneda } from '@/lib/formato'

const props = defineProps({
  cotizacion: { type: Object, default: null },  // {lineas, subtotal, iva, envio, total}
  lineas: { type: Array, default: null },       // las líneas del carrito mientras la cotización no llega
  calculando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  compacto: { type: Boolean, default: false },
  titulo: { type: String, default: 'Resumen' },
  nota: { type: String, default: '' }
})

const lineasVisibles = computed(() => props.cotizacion?.lineas ?? props.lineas ?? [])
const monto = (valor) => (props.calculando || valor == null ? '…' : formatoMoneda(valor))
const envio = computed(() => {
  if (props.calculando || props.cotizacion?.envio == null) return '…'
  return Number(props.cotizacion.envio) === 0 ? 'Sin costo' : formatoMoneda(props.cotizacion.envio)
})
</script>

<style scoped>
.resumen {
  background: var(--color-blanco);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-grande);
  padding: var(--espacio-5);
}
.resumen__titulo { font-family: var(--fuente-titulos); font-size: 1.2rem; color: var(--color-texto); margin-bottom: var(--espacio-4); }
.resumen__lineas { list-style: none; padding: 0; margin: 0 0 var(--espacio-3); }
.resumen__linea {
  display: flex; justify-content: space-between; gap: var(--espacio-3);
  padding: var(--espacio-2) 0; border-bottom: 1px solid var(--color-borde); color: var(--color-texto); font-size: 0.95rem;
}
.resumen__cantidad { color: var(--color-texto-2); }
.resumen__hueco { width: 4.5rem; height: 0.9rem; border-radius: 4px; background: var(--color-crema-oscuro); align-self: center; }
.resumen__cuentas { margin: 0; }
.resumen__cuentas div { display: flex; justify-content: space-between; padding: var(--espacio-1) 0; color: var(--color-texto-2); font-size: 0.95rem; }
.resumen__cuentas dd { margin: 0; }
.resumen__total {
  display: flex; justify-content: space-between; align-items: baseline;
  border-top: 2px solid var(--color-texto); margin-top: var(--espacio-3); padding-top: var(--espacio-3);
  font-size: 1.1rem; color: var(--color-texto);
}
.resumen__calculando { color: var(--color-texto-2); font-weight: 600; }
.resumen__nota { margin-top: var(--espacio-3); font-size: 0.85rem; color: var(--color-texto-2); }
.resumen__error { color: var(--color-error); font-size: 0.95rem; }
</style>
