<template>
  <NavBar />
  <RouterView />
</template>

<script setup>
  import NavBar from '@/components/NavBar.vue'
  import { RouterView } from 'vue-router'
</script>

<style>
  /* ── Reset global ── */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #faf7f2;
    color: #1a1a1a;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  img {
    max-width: 100%;
    display: block;
  }

  a {
    color: inherit;
  }
</style>
