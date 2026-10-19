import type { CondicionPago } from '../types'

export const CONDICIONES_PAGO: CondicionPago[] = [
  'CONTADO',
  'CREDITO_7',
  'CREDITO_15',
  'CREDITO_30',
]

export const CONDICION_PAGO_ETIQUETA: Record<CondicionPago, string> = {
  CONTADO: 'Contado',
  CREDITO_7: 'Crédito 7 días',
  CREDITO_15: 'Crédito 15 días',
  CREDITO_30: 'Crédito 30 días',
}

export function estrellas(calificacion?: number | null): string {
  if (!calificacion) return '—'
  return '★'.repeat(calificacion) + '☆'.repeat(Math.max(0, 5 - calificacion))
}
