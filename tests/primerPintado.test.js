/**
 * El plugin de build primerPintado (vite/primerPintado.js) sobre un bundle de mentira: mete el CSS principal en
 * index.html y agrega el script que, en teléfonos, precarga la foto del hero de productos y nosotros.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { primerPintado, scriptDePrecarga } from '../vite/primerPintado.js'

const HTML = '<html><head><link rel="stylesheet" crossorigin href="/assets/index-a1.css"></head><body></body></html>'

function bundleDePrueba() {
  return {
    'index.html': { type: 'asset', fileName: 'index.html', source: HTML },
    'assets/index-a1.css': { type: 'asset', fileName: 'assets/index-a1.css', source: 'body{color:$1;background:url(/assets/x.webp)}' },
    'assets/index-e1.js': { type: 'chunk', fileName: 'assets/index-e1.js', isEntry: true, imports: [] },
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

  it('agrega en el head el script con la foto del hero; sin la foto en el bundle no agrega nada', () => {
    const bundle = bundleDePrueba()
    primerPintado().generateBundle({}, bundle)
    const html = bundle['index.html'].source
    expect(html).toContain('"/assets/hero-nosotros-movil-h1.webp"')
    expect(html.indexOf('<script>')).toBeLessThan(html.indexOf('</head>'))

    const sinFoto = bundleDePrueba()
    delete sinFoto['assets/hero-nosotros-movil-h1.webp']
    primerPintado().generateBundle({}, sinFoto)
    expect(sinFoto['index.html'].source).not.toContain('<script>')
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
    new Function(scriptDePrecarga('assets/foto.webp').replace(/^<script>|<\/script>$/g, ''))()
    // jsdom no refleja «as» en el atributo: se lee la propiedad, que es lo que usa el navegador
    return [...document.head.querySelectorAll('link')].map((l) => [l.rel, l.as ?? null, l.getAttribute('href')])
  }

  it('en productos y nosotros, desde un teléfono, pide la foto del hero', () => {
    expect(correr('/productos/', true)).toEqual([['preload', 'image', '/assets/foto.webp']])
    document.head.querySelectorAll('link').forEach((l) => l.remove())
    expect(correr('/nosotros', true)).toEqual([['preload', 'image', '/assets/foto.webp']])
  })

  it('en pantalla ancha, o en otra ruta, no pide nada', () => {
    expect(correr('/productos', false)).toEqual([])
    expect(correr('/', true)).toEqual([])
    expect(correr('/seguimiento', true)).toEqual([])
  })
})
