<template>
  <span :class="['pago', `pago--${clave}`]" :title="titulo || undefined">
    <component :is="icono" :size="pequeno ? 14 : 18" aria-hidden="true" :class="{ girando: clave === 'confirmando' }" />
    <template v-if="texto">
      <span aria-hidden="true">{{ texto }}</span>
      <span class="sr-only">{{ etiqueta }}</span>
    </template>
    <template v-else>{{ etiqueta }}</template>
  </span>
</template>

<script setup>
/**
 * EstadoPago · color, icono y etiqueta para el estado del pago, con forma de píldora con borde, distinta de la
 * etiqueta del estado logístico, para que "entregado" y "pagado" no se confundan. No depende sólo del color.
 */
import { computed } from 'vue'
import { Check, Clock, X, RotateCcw, LoaderCircle, Mail } from 'lucide-vue-next'

const props = defineProps({
  estado: { type: String, required: true }, // pagado | pendiente | rechazado | reembolsado | confirmando | correo
  forma: { type: String, default: 'corta' }, // corta: tabla del panel · larga: pantallas del comprador
  pequeno: { type: Boolean, default: false },
  titulo: { type: String, default: '' },
  // un texto visible distinto de la etiqueta, por ejemplo el que rota mientras se pregunta; los lectores de pantalla
  // siguen oyendo la etiqueta, que no cambia
  texto: { type: String, default: '' }
})

const ESTADOS = {
  pagado: { icono: Check, corta: 'Pagado', larga: 'Pago confirmado' },
  pendiente: { icono: Clock, corta: 'Pendiente', larga: 'Pago pendiente' },
  rechazado: { icono: X, corta: 'Rechazado', larga: 'No se pudo cobrar' },
  reembolsado: { icono: RotateCcw, corta: 'Reembolsado', larga: 'Pago reembolsado' },
  confirmando: { icono: LoaderCircle, corta: 'Confirmando', larga: 'Confirmando el pago' },
  // la espera del aviso se agotó y el pedido sigue pendiente en la base: no se afirma nada del pago
  correo: { icono: Mail, corta: 'Por correo', larga: 'Te avisaremos por correo' }
}
const clave = computed(() => (ESTADOS[props.estado] ? props.estado : 'pendiente'))
const icono = computed(() => ESTADOS[clave.value].icono)
const etiqueta = computed(() => ESTADOS[clave.value][props.forma])
</script>

<style scoped>
.pago {
  display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.8rem;
  border: 2px solid currentColor; border-radius: var(--radio-pildora); font-weight: 700; font-size: 0.9rem;
  white-space: nowrap; line-height: 1.2;
}
.pago--pagado { color: #1b5e20; background: #e8f5e9; }
.pago--pendiente { color: var(--color-aviso); background: #fff4d6; }
.pago--rechazado { color: var(--color-error); background: #fdecea; }
.pago--reembolsado { color: #37474f; background: #eceff1; }
.pago--confirmando { color: var(--color-texto-2); background: var(--color-crema-oscuro); }
.pago--correo { color: var(--color-texto-2); background: var(--color-crema-oscuro); }
.girando { animation: girar 1s linear infinite; }
@keyframes girar { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .girando { animation: none; } }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
