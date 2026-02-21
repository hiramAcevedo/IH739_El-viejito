<template>
  <main class="page-stub">
    <h1>Productos</h1>
    <p>Catálogo completo — se conectará a Supabase en el <strong>Sprint 2</strong> (PB2).</p>
    <RouterLink to="/" class="back-link">← Volver al inicio</RouterLink>
  </main>
</template>

<script setup>
  import { RouterLink } from 'vue-router'
</script>

<style scoped>
  .page-stub {
    min-height: 80vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    text-align: center;
    padding: 2rem;
    font-family: Georgia, serif;
  }
  h1 { font-size: 2.5rem; color: #1a1a1a; }
  p  { color: #666; }
  .back-link { color: #c9a84c; text-decoration: none; font-size: 0.9rem; }
</style>
