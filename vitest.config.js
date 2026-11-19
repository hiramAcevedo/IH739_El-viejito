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
      coverage: {
        provider: 'v8',
        // Con el remapeo por omisión de v8, un .vue que sólo se importa (por ejemplo, el componente perezoso de una ruta)
        // sale al 100 % aunque nunca se monte. El remapeo por el AST da las cifras de istanbul.
        experimentalAstAwareRemapping: true,
        include: ['src/**'],
        exclude: [
          // arranque: crea la app y la monta en #app; no tiene lógica propia y lo recorren las pruebas de punta a punta
          'src/main.js',
          // sólo existen en el servidor de desarrollo (VITE_API_EJEMPLO=1 o import.meta.env.DEV): el build de
          // producción no los incluye
          'src/lib/api-ejemplo.js',
          'src/components/compartidos/AvisoEjemplo.vue',
          'src/views/ComponentesView.vue',
          'src/views/CorreosView.vue'
        ],
        reporter: ['text', 'html', 'json-summary'],
        thresholds: { lines: 95 }
      },
      mockReset: true,
      restoreMocks: true,
      unstubEnvs: true,
      unstubGlobals: true
    }
  })
)
