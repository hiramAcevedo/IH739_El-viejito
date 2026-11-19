/**
 * Espera a que el navegador pinte el cuadro en curso. Lo que no se ve al abrir una página (una foto de fondo, una
 * imagen más abajo, datos de un carrusel) se pide después, para que el primer pintado no compita con eso.
 */
export const despuesDelPintado = () => new Promise((listo) => requestAnimationFrame(() => setTimeout(listo, 0)))
