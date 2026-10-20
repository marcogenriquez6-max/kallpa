import type { EstadoContrato, TipoCliente, TipoPago } from '../types'

export const ESTADOS_CONTRATO: EstadoContrato[] = [
  'COTIZACION',
  'CONFIRMADO',
  'PLANIFICADO',
  'EN_COMPRA',
  'INSUMOS_ENTREGADOS',
  'EN_PRODUCCION',
  'SERVIDO',
  'LIQUIDADO',
  'CANCELADO',
]

export const ESTADO_ETIQUETA: Record<EstadoContrato, string> = {
  COTIZACION: 'Cotización',
  CONFIRMADO: 'Confirmado',
  PLANIFICADO: 'Planificado',
  EN_COMPRA: 'En compra',
  INSUMOS_ENTREGADOS: 'Insumos entregados',
  EN_PRODUCCION: 'En producción',
  SERVIDO: 'Servido',
  LIQUIDADO: 'Liquidado',
  CANCELADO: 'Cancelado',
}

export const ESTADO_COLOR: Record<EstadoContrato, string> = {
  COTIZACION: 'bg-fondo text-texto-2',
  CONFIRMADO: 'bg-exito-suave text-exito',
  PLANIFICADO: 'bg-atencion-suave text-atencion',
  EN_COMPRA: 'bg-kallpa-100 text-kallpa-700',
  INSUMOS_ENTREGADOS: 'bg-exito-suave text-exito',
  EN_PRODUCCION: 'bg-kallpa-100 text-kallpa-700',
  SERVIDO: 'bg-exito-suave text-exito',
  LIQUIDADO: 'bg-grafito text-white',
  CANCELADO: 'bg-rose-100 text-rose-800',
}

/** Estados a los que se puede pasar desde uno dado (debe coincidir con el backend). */
export const TRANSICIONES: Record<EstadoContrato, EstadoContrato[]> = {
  COTIZACION: ['CONFIRMADO', 'CANCELADO'],
  CONFIRMADO: ['PLANIFICADO', 'CANCELADO'],
  PLANIFICADO: ['EN_COMPRA', 'CANCELADO'],
  EN_COMPRA: ['INSUMOS_ENTREGADOS', 'CANCELADO'],
  INSUMOS_ENTREGADOS: ['EN_PRODUCCION', 'CANCELADO'],
  EN_PRODUCCION: ['SERVIDO', 'CANCELADO'],
  SERVIDO: ['LIQUIDADO'],
  LIQUIDADO: [],
  CANCELADO: [],
}

export const TIPOS_CLIENTE: TipoCliente[] = ['SOCIAL', 'FOLKLORICO', 'ACADEMICO', 'INSTITUCIONAL']

export const TIPO_CLIENTE_ETIQUETA: Record<TipoCliente, string> = {
  SOCIAL: 'Social',
  FOLKLORICO: 'Folklórico',
  ACADEMICO: 'Académico',
  INSTITUCIONAL: 'Institucional',
}

export const TIPOS_PAGO: TipoPago[] = ['ANTICIPO', 'SALDO', 'ADICIONAL', 'DEVOLUCION']

export const TIPO_PAGO_ETIQUETA: Record<TipoPago, string> = {
  ANTICIPO: 'Anticipo',
  SALDO: 'Saldo',
  ADICIONAL: 'Adicional',
  DEVOLUCION: 'Devolución',
}

export function fechaCorta(iso: string): string {
  // Las fechas sin hora (fecha del evento) llegan como medianoche UTC: se muestran
  // en UTC para que en Bolivia (UTC-4) no aparezcan como el día anterior.
  const soloFecha = /T00:00:00(\.000)?Z$/.test(iso) || /^\d{4}-\d{2}-\d{2}$/.test(iso)
  return new Date(iso).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(soloFecha ? { timeZone: 'UTC' } : {}),
  })
}

export function aInputFecha(iso: string): string {
  return iso.slice(0, 10)
}
