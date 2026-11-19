/**
 * El plugin de build primerPintado (vite/primerPintado.js) sobre un bundle de mentira: mete el CSS principal en
 * index.html y arma el script que precarga, según la ruta, los archivos de su vista y la foto del hero en teléfonos.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { primerPintado, scriptDePrecarga } from '../vite/primerPintado.js'

const HTML = '<html><head><link rel="stylesheet" crossorigin href="/assets/index-a1.css"></head><body></body></html>'

function bundleDePrueba() {
  const entrada = { type: 'chunk', fileName: 'assets/index-e1.js', isEntry: true, imports: [], facadeModuleId: '/sitio/index.html' }
  return {
    'index.html': { type: 'asset', fileName: 'index.html', source: HTML },
    'assets/index-a1.css': { type: 'asset', fileName: 'assets/index-a1.css', source: 'body{color:$1;background:url(/assets/x.webp)}' },
    'assets/index-e1.js': entrada,
    'assets/ProductosView-p1.js': {
      type: 'chunk', fileName: 'assets/ProductosView-p1.js', facadeModuleId: '/sitio/src/views/ProductosView.vue',
      imports: ['assets/index-e1.js', 'assets/BotonPrimario-b1.js'], viteMetadata: { importedCss: new Set(['assets/ProductosView-p2.css']) }
    },
    'assets/BotonPrimario-b1.js': {
      type: 'chunk', fileName: 'assets/BotonPrimario-b1.js', facadeModuleId: '/sitio/src/components/BotonPrimario.vue',
      imports: ['assets/index-e1.js'], viteMetadata: { importedCss: new Set(['assets/BotonPrimario-b2.css']) }
    },
    'assets/hero-nosotros-movil-h1.webp': { type: 'asset', fileName: 'assets/hero-nosotros-movil-h1.webp', source: '' }
  }
}

describe('primerPintado', () => {
  it('mete el CSS principal en index.html, tal cual, y lo quita del bundle', () => {
    const bundle = bundleDePrueba()
    primerPintado().generateBundle({}, bundle)

    const html = bundle['index.html'].source
    expect(html).toContain('<style>body{color:$1;background:url(/assets/x.webp)}</style>')
    expect(html).not.toContain('rel="stylesheet"')
    expect(bundle['assets/index-a1.css']).toBeUndefined()
  })

  it('el mapa lleva, por ruta, el chunk de la vista, sus dependencias sin el principal y su CSS', () => {
    const bundle = bundleDePrueba()
    primerPintado().generateBundle({}, bundle)

    const html = bundle['index.html'].source
    expect(html).toContain('"/productos":["/assets/ProductosView-p1.js","/assets/ProductosView-p2.css","/assets/BotonPrimario-b1.js","/assets/BotonPrimario-b2.css"]')
    expect(html).not.toContain('index-e1.js"]')
    expect(html).toContain('a.unshift("/assets/hero-nosotros-movil-h1.webp")')
    expect(html.indexOf('<script>')).toBeLessThan(html.indexOf('</head>'))
  })

  it('sin index.html en el bundle no toca nada', () => {
    const bundle = bundleDePrueba()
    delete bundle['index.html']
    primerPintado().generateBundle({}, bundle)
    expect(bundle['assets/index-a1.css']).toBeDefined()
  })
})

describe('el script de precarga en el navegador', () => {
  afterEach(() => {
    document.head.querySelectorAll('link').forEach((l) => l.remove())
    window.history.replaceState({}, '', '/')
  })
  const correr = (ruta, telefono) => {
    window.history.replaceState({}, '', ruta)
    vi.stubGlobal('matchMedia', () => ({ matches: telefono }))
    const codigo = scriptDePrecarga({ '/productos': ['/assets/p.js', '/assets/p.css'] }, 'assets/foto.webp')
    new Function(codigo.replace(/^<script>|<\/script>$/g, ''))()
    // jsdom no refleja «as» en el atributo: se lee la propiedad, que es lo que usa el navegador
    return [...document.head.querySelectorAll('link')].map((l) => [l.rel, l.as ?? null, l.getAttribute('href'), l.hasAttribute('crossorigin')])
  }

  it('en productos desde un teléfono pide la foto, el JavaScript y el CSS de la vista', () => {
    expect(correr('/productos/', true)).toEqual([
      ['preload', 'image', '/assets/foto.webp', false],
      ['modulepreload', null, '/assets/p.js', true],
      ['preload', 'style', '/assets/p.css', true]
    ])
  })

  it('en pantalla ancha no pide la foto, y en una ruta sin vista aparte no pide nada', () => {
    expect(correr('/productos', false).map((l) => l[2])).toEqual(['/assets/p.js', '/assets/p.css'])
    document.head.querySelectorAll('link').forEach((l) => l.remove())
    expect(correr('/', true)).toEqual([])
  })
})
