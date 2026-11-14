import { fileURLToPath, URL } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

/**
 * Pruebas unitarias y de componentes con Vitest (npm run test).
 *
 * Las pruebas no leen el .env del proyecto: envDir apunta a tests/, que no lleva .env, y las variables se fijan aquí
 * con valores de prueba. Supabase y la API se simulan en cada archivo; ninguna prueba sale a la red.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    envDir: fileURLToPath(new URL('./tests', import.meta.url)),
    test: {
      environment: 'jsdom',
      include: ['tests/**/*.test.js'],
      env: {
        VITE_API_URL: 'https://api.prueba.local/api/',
        VITE_API_EJEMPLO: '0',
        VITE_SUPABASE_URL: 'https://supabase.prueba.local',
        VITE_SUPABASE_ANON_KEY: 'llave-de-prueba'
      },
      mockReset: true,
      restoreMocks: true,
      unstubEnvs: true,
      unstubGlobals: true
    }
  })
)
