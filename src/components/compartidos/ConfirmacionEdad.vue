<template>
  <label class="edad" :class="{ 'edad--marcada': modelValue }">
    <input
      type="checkbox"
      :checked="modelValue"
      required
      aria-describedby="edad-ayuda"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <span>
      <strong>Confirmo que soy mayor de 18 años</strong>
      <small id="edad-ayuda">Vendemos bebidas alcohólicas sólo a mayores de edad. Sin esta confirmación no se activa el pago.</small>
    </span>
  </label>
</template>

<script setup>
/** ConfirmacionEdad · la casilla obligatoria del checkout; sin ella, "Pagar" no se activa. */
defineProps({ modelValue: { type: Boolean, default: false } })
defineEmits(['update:modelValue'])
</script>

<style scoped>
.edad {
  display: flex; gap: var(--espacio-3); align-items: flex-start;
  padding: var(--espacio-4); border: 2px solid var(--color-borde); border-radius: var(--radio-grande);
  background: var(--color-blanco); cursor: pointer;
}
.edad--marcada { border-color: var(--color-texto); }
.edad input { width: 22px; height: 22px; margin-top: 2px; accent-color: var(--color-texto); flex-shrink: 0; }
.edad input:focus-visible { outline: none; box-shadow: var(--enfoque); }
.edad strong { display: block; color: var(--color-texto); font-size: 1rem; }
.edad small { display: block; color: var(--color-texto-2); font-size: 0.85rem; margin-top: var(--espacio-1); }
</style>
