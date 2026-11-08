import { ref, watch, onBeforeUnmount } from 'vue'
import { calcularPedido } from '@/lib/api'

/**
 * La cotización del carrito, pedida a la API cada vez que cambia el carrito o la forma de entrega.
 * Espera un momento a que el comprador deje de mover cantidades y descarta las respuestas viejas.
 */
export function useCotizacion(items, metodoEntrega) {
  const cotizacion = ref(null)
  const calculando = ref(false)
  const error = ref('')
  let turno = 0
  let pausa = null

  async function calcular() {
    const mio = ++turno
    if (!items.value.length) {
      cotizacion.value = null
      calculando.value = false
      return
    }
    calculando.value = true
    error.value = ''
    try {
      const respuesta = await calcularPedido({ items: items.value, metodo_entrega: metodoEntrega.value })
      if (mio === turno) cotizacion.value = respuesta
    } catch (e) {
      if (mio === turno) {
        cotizacion.value = null
        error.value = 'No pudimos calcular el total. Intenta de nuevo en un momento.'
      }
    } finally {
      if (mio === turno) calculando.value = false
    }
  }

  watch([items, metodoEntrega], () => {
    calculando.value = true
    clearTimeout(pausa)
    pausa = setTimeout(calcular, 300)
  }, { deep: true, immediate: true })

  onBeforeUnmount(() => clearTimeout(pausa))
  return { cotizacion, calculando, error, recalcular: calcular }
}
