/**
 * primerPintado · lo que necesita el primer pintado llega con el HTML, sin otra vuelta al servidor.
 *
 * - El CSS principal va dentro de index.html: el navegador no espera otra petición para pintar.
 * - Un script en línea mira la ruta que se abrió y pide de una vez el JavaScript y el CSS de esa vista, que el router
 *   carga aparte; sin él, esa petición sale hasta que termina el JavaScript principal.
 * - En teléfonos, en las páginas donde la foto del hero es lo más grande que se pinta (productos y nosotros), la foto
 *   se pide junto con el JavaScript.
 *
 * Sólo corre en el build. Si index.html o una vista no aparecen en el bundle, deja todo como estaba.
 */
export const VISTAS = {
  '/productos': 'src/views/ProductosView.vue',
  '/nosotros': 'src/views/NosotrosView.vue',
  '/contacto': 'src/views/ContactoView.vue',
  '/carrito': 'src/views/CarritoView.vue',
  '/checkout': 'src/views/CheckoutView.vue',
  '/seguimiento': 'src/views/SeguimientoView.vue',
  '/privacidad': 'src/views/LegalView.vue',
  '/terminos': 'src/views/LegalView.vue'
}
export const CON_FOTO = ['/productos', '/nosotros']
const FOTO_MOVIL = /^assets\/hero-nosotros-movil-[\w-]+\.webp$/
const escapar = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Los archivos de una vista: su chunk, los chunks que importa (menos el principal, que ya cargó) y su CSS. */
function archivosDe(bundle, chunk, entrada, vistos = new Set()) {
  if (!chunk || chunk === entrada || vistos.has(chunk.fileName)) return []
  vistos.add(chunk.fileName)
  return [
    chunk.fileName,
    ...(chunk.viteMetadata?.importedCss ?? []),
    ...chunk.imports.flatMap((nombre) => archivosDe(bundle, bundle[nombre], entrada, vistos))
  ]
}

/** El script en línea que pide, según la ruta abierta, los archivos de su vista y la foto del hero. */
export function scriptDePrecarga(mapa, foto) {
  const conFoto = foto
    ? `if(${JSON.stringify(CON_FOTO)}.indexOf(r)>-1&&matchMedia('(max-width: 828px)').matches)a.unshift(${JSON.stringify(`/${foto}`)});`
    : ''
  return '<script>(function(){' +
    `var r=location.pathname.replace(/\\/+$/,'')||'/',a=(${JSON.stringify(mapa)}[r]||[]).slice();${conFoto}` +
    "a.forEach(function(u){var l=document.createElement('link');" +
    // el JavaScript y el CSS van con crossorigin, como los pide Vite: si no, el navegador no reusa la precarga
    "if(/\\.css$/.test(u)){l.rel='preload';l.as='style';l.crossOrigin=''}" +
    "else if(/\\.js$/.test(u)){l.rel='modulepreload';l.crossOrigin=''}" +
    "else{l.rel='preload';l.as='image';l.fetchPriority='high'}" +
    'l.href=u;document.head.appendChild(l)})})()</script>'
}

export function primerPintado() {
  return {
    name: 'primer-pintado',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle['index.html']
      if (!html) return
      let fuente = String(html.source)

      for (const [nombre, archivo] of Object.entries(bundle)) {
        const enlace = new RegExp(`<link rel="stylesheet"[^>]*href="/${escapar(nombre)}"[^>]*>`)
        if (archivo.type === 'asset' && nombre.endsWith('.css') && enlace.test(fuente)) {
          fuente = fuente.replace(enlace, () => `<style>${archivo.source}</style>`)
          delete bundle[nombre]
        }
      }

      const chunks = Object.values(bundle).filter((archivo) => archivo.type === 'chunk')
      const entrada = chunks.find((chunk) => chunk.isEntry)
      const mapa = {}
      for (const [ruta, modulo] of Object.entries(VISTAS)) {
        const chunk = chunks.find((c) => c.facadeModuleId?.endsWith(`/${modulo}`))
        if (chunk) mapa[ruta] = [...new Set(archivosDe(bundle, chunk, entrada))].map((archivo) => `/${archivo}`)
      }
      const foto = Object.keys(bundle).find((nombre) => FOTO_MOVIL.test(nombre))
      html.source = fuente.replace('</head>', `${scriptDePrecarga(mapa, foto)}\n</head>`)
    }
  }
}
