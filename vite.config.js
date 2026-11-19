import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { primerPintado } from './vite/primerPintado.js'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), primerPintado()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    allowedHosts: true
  }
})
