<template>
  <router-link
    v-if="carrito.totalItems > 0"
    to="/carrito"
    class="carrito-flotante"
    aria-label="Ver carrito"
  >
    <ShoppingCart :size="22" />
    <span class="carrito-badge">{{ carrito.totalItems }}</span>
  </router-link>
</template>

<script setup>
import { ShoppingCart } from 'lucide-vue-next'
import { useCarritoStore } from '@/stores/carritoStore'

const carrito = useCarritoStore()
</script>

<style scoped>
.carrito-flotante {
  position: fixed;
  top: 1.25rem;
  right: 1.5rem;
  z-index: 1200;
  background: #c9a84c;
  color: white;
  border-radius: 50%;
  width: 46px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s, background 0.2s;
  text-decoration: none;
}

.carrito-flotante:hover {
  transform: scale(1.1);
  background: #b39340;
}

.carrito-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #d9534f;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
</style>
