/**
 * imageHelper.js
 * Resuelve nombres de archivo de imagen a URLs compiladas por Vite.
 * Elimina el mapeo temporal por tipo que se usaba en el Sprint 3 (MJ1).
 */

const imageModules = import.meta.glob('@/assets/*.webp', { eager: true })

const imageMap = {}
for (const path in imageModules) {
  const filename = path.split('/').pop()
  imageMap[filename] = imageModules[path].default
}

/**
 * Resuelve imagen_url del producto a la URL compilada del asset.
 * @param {string|null} imagenUrl - Nombre del archivo (e.g. "tequila-blanco.webp")
 * @returns {string} URL resuelta del asset
 */
export function resolveProductImage(imagenUrl) {
  if (!imagenUrl) return imageMap['tequila-blanco.webp'] || ''
  return imageMap[imagenUrl] || imageMap['tequila-blanco.webp'] || ''
}
