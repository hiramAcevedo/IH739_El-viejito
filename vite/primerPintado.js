/**
 * primerPintado · lo que necesita el primer pintado llega con el HTML, sin otra vuelta al servidor.
 *
 * - El CSS principal va dentro de index.html: el navegador no espera otra petición para pintar.
 * - En teléfonos, en las páginas donde la foto del hero es lo más grande que se pinta (productos y nosotros), un script
 *   en línea pide la foto junto con el JavaScript; sin él, sale hasta que la vista se dibuja.
 *
 * Sólo corre en el build. Si index.html no aparece en el bundle, deja todo como estaba.
 */
export const CON_FOTO = ['/productos', '/nosotros']
const FOTO_MOVIL = /^assets\/hero-nosotros-movil-[\w-]+\.webp$/
const escapar = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** El script en línea que, en teléfonos y en las rutas con foto en el hero, pide esa foto con prioridad alta. */
export function scriptDePrecarga(foto) {
  return '<script>(function(){' +
    "var r=location.pathname.replace(/\\/+$/,'')||'/';" +
    `if(${JSON.stringify(CON_FOTO)}.indexOf(r)<0||!matchMedia('(max-width: 828px)').matches)return;` +
    "var l=document.createElement('link');l.rel='preload';l.as='image';l.fetchPriority='high';" +
    `l.href=${JSON.stringify(`/${foto}`)};document.head.appendChild(l)})()</script>`
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

      const foto = Object.keys(bundle).find((nombre) => FOTO_MOVIL.test(nombre))
      if (foto) fuente = fuente.replace('</head>', `${scriptDePrecarga(foto)}\n</head>`)
      html.source = fuente
    }
  }
}
