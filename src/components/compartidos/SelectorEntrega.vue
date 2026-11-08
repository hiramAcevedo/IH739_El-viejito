<template>
  <fieldset class="entrega">
    <legend class="entrega__titulo">Forma de entrega</legend>
    <div class="entrega__opciones" role="radiogroup">
      <label :class="['entrega__opcion', { activa: metodo === 'envio' }]">
        <input type="radio" value="envio" :checked="metodo === 'envio'" @change="$emit('update:metodo', 'envio')" />
        <Truck :size="22" aria-hidden="true" />
        <span><strong>Envío a domicilio</strong><small>Entrega en 3 a 5 días hábiles</small></span>
      </label>
      <label :class="['entrega__opcion', { activa: metodo === 'recoger' }]">
        <input type="radio" value="recoger" :checked="metodo === 'recoger'" @change="$emit('update:metodo', 'recoger')" />
        <Store :size="22" aria-hidden="true" />
        <span><strong>Recoger en tienda</strong><small>Tototlán, Jalisco</small></span>
      </label>
    </div>

    <div v-if="metodo === 'envio'" class="entrega__direccion">
      <div class="campo campo--ancho">
        <label for="calle">Calle y número</label>
        <input id="calle" :value="direccion.calle" required autocomplete="street-address" @input="cambia('calle', $event)" />
      </div>
      <div class="campo">
        <label for="cp">C. P.</label>
        <input id="cp" :value="direccion.codigo_postal" required inputmode="numeric" pattern="\d{5}" maxlength="5"
          autocomplete="postal-code" @input="cambia('codigo_postal', $event)" />
      </div>
      <div class="campo">
        <label for="colonia">Colonia</label>
        <input id="colonia" :value="direccion.colonia" required @input="cambia('colonia', $event)" />
      </div>
      <div class="campo">
        <label for="ciudad">Ciudad</label>
        <input id="ciudad" :value="direccion.ciudad" required autocomplete="address-level2" @input="cambia('ciudad', $event)" />
      </div>
      <div class="campo">
        <label for="estado">Estado</label>
        <input id="estado" :value="direccion.estado" required autocomplete="address-level1" @input="cambia('estado', $event)" />
      </div>
    </div>
  </fieldset>
</template>

<script setup>
/**
 * SelectorEntrega · envío a domicilio o recoger en tienda; con envío, la dirección en campos propios
 * (antes se escribía dentro de las notas del pedido).
 */
import { Truck, Store } from 'lucide-vue-next'

const props = defineProps({
  metodo: { type: String, default: 'envio' },
  direccion: { type: Object, required: true }
})
const emit = defineEmits(['update:metodo', 'update:direccion'])
const cambia = (campo, e) => emit('update:direccion', { ...props.direccion, [campo]: e.target.value })
</script>

<style scoped>
.entrega { border: none; padding: 0; margin: 0; }
.entrega__titulo { font-family: var(--fuente-titulos); font-size: 1.15rem; color: var(--color-texto); margin-bottom: var(--espacio-3); }
.entrega__opciones { display: grid; grid-template-columns: 1fr; gap: var(--espacio-3); }
.entrega__opcion {
  display: flex; align-items: center; gap: var(--espacio-3); padding: var(--espacio-4);
  border: 2px solid var(--color-borde); border-radius: var(--radio-grande); cursor: pointer; background: var(--color-blanco);
}
.entrega__opcion.activa { border-color: var(--color-texto); background: var(--color-crema-oscuro); }
.entrega__opcion input { position: absolute; opacity: 0; pointer-events: none; }
.entrega__opcion:focus-within { box-shadow: var(--enfoque); }
.entrega__opcion svg { color: var(--color-texto); flex-shrink: 0; }
.entrega__opcion strong { display: block; color: var(--color-texto); }
.entrega__opcion small { display: block; color: var(--color-texto-2); }
.entrega__direccion { display: grid; grid-template-columns: 1fr; gap: var(--espacio-3); margin-top: var(--espacio-4); }
.campo { display: flex; flex-direction: column; gap: var(--espacio-1); }
.campo label { font-size: 0.85rem; font-weight: 600; color: var(--color-texto-2); }
.campo input {
  padding: 0.75rem; border: 1px solid #c9c2b4; border-radius: var(--radio); font: inherit; background: var(--color-crema);
  color: var(--color-texto);
}
.campo input:focus { outline: none; border-color: var(--color-texto); box-shadow: var(--enfoque); }
@media (min-width: 768px) {
  .entrega__opciones { grid-template-columns: 1fr 1fr; }
  .entrega__direccion { grid-template-columns: 2fr 1fr; }
  .campo--ancho { grid-column: 1; }
}
</style>
