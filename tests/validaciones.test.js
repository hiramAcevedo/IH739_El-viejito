import { describe, it, expect } from 'vitest'
import { ErrorApi } from '@/lib/api.js'
import { esCorreoValido, esFolioValido } from '@/lib/validacion.js'
import { estadoDe } from '@/lib/regreso.js'

// Pruebas de Arturo Daniel Aguilar (PR #1), sobre las funciones que usan el seguimiento, el checkout y el regreso.
describe('Pruebas Unitarias - Lógica y Validaciones Frontend (El Viejito)', () => {
  it('valida correctamente folios hexadecimales de 8 caracteres', () => {
    expect(esFolioValido('5BCD1264')).toBe(true)
    expect(esFolioValido('3f9a1c27')).toBe(true)
    expect(esFolioValido('5BCD126')).toBe(false)
    expect(esFolioValido('5BCD126Z')).toBe(false)
    expect(esFolioValido('')).toBe(false)
  })

  it('valida formato de correo electrónico en seguimiento y checkout', () => {
    expect(esCorreoValido('laura@example.com')).toBe(true)
    expect(esCorreoValido('correo-invalido')).toBe(false)
    expect(esCorreoValido('sin@dominio')).toBe(false)
  })

  it('traduce el estado de regreso según la respuesta de la API y no por la URL', () => {
    expect(estadoDe({ pago: 'paid', estado_sesion: 'complete', estado_pago: 'pagado' })).toBe('confirmado')
    expect(estadoDe({ pago: 'paid', estado_sesion: 'complete', estado_pago: 'pendiente' })).toBe('confirmando')
    expect(estadoDe({ pago: 'unpaid', estado_sesion: 'expired', estado_pago: 'pendiente' })).toBe('error')
    expect(estadoDe({ pago: 'unpaid', estado_sesion: 'open', estado_pago: 'pendiente' })).toBe('pendiente')
  })

  it('construye ErrorApi conservando código HTTP y mensaje del servidor', () => {
    const err = new ErrorApi(400, { detail: 'Hace falta la confirmación de edad.' })
    expect(err).toBeInstanceOf(Error)
    expect(err.estado).toBe(400)
    expect(err.message).toContain('confirmación de edad')
  })
})
