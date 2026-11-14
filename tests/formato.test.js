import { describe, it, expect, vi } from 'vitest'
import { formatoMoneda, formatoFecha, formatoFechaHora } from '@/lib/formato'

describe('formato.js', () => {
  it('formatoMoneda: pesos con separador de miles y dos decimales, también con el importe en texto que manda la API', () => {
    expect(formatoMoneda(1234.5)).toBe('$1,234.50')
    expect(formatoMoneda(1234567.891)).toBe('$1,234,567.89')
    expect(formatoMoneda(0)).toBe('$0.00')
    expect(formatoMoneda('1113.60')).toBe('$1,113.60')
  })

  it('formatoFecha: día y mes corto en la hora de la Ciudad de México, aunque el equipo esté en UTC', () => {
    vi.stubEnv('TZ', 'UTC')
    const iso = '2026-11-06T03:30:00Z' // en UTC ya es 6 de noviembre; en la Ciudad de México son las 21:30 del 5
    expect(new Date(iso).getUTCDate()).toBe(6)
    expect(new Date(iso).getDate()).toBe(6) // control: el proceso quedó en UTC
    expect(formatoFecha(iso)).toBe('5 nov')
    expect(formatoFecha('2026-01-01T05:59:00Z')).toBe('31 dic')
    expect(
      formatoFecha('2026-11-05T10:24:00-06:00', { day: 'numeric', month: 'long', year: 'numeric' })
    ).toBe('5 de noviembre de 2026')
  })

  it('formatoFechaHora: día, mes y hora con minutos en la Ciudad de México', () => {
    expect(formatoFechaHora('2026-11-09T18:30:00-06:00')).toBe('9 nov, 06:30 p.m.')
    expect(formatoFechaHora('2026-11-05T09:05:00-06:00')).toBe('5 nov, 09:05 a.m.')
    expect(formatoFechaHora('2026-11-06T03:30:00Z')).toBe('5 nov, 09:30 p.m.')
  })
})
