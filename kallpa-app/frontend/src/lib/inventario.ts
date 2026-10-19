import type { MotivoMovimiento, TipoMovimiento } from '../types'

export const TIPOS_MOVIMIENTO: TipoMovimiento[] = ['ENTRADA', 'SALIDA', 'AJUSTE']

export const TIPO_MOVIMIENTO_ETIQUETA: Record<TipoMovimiento, string> = {
  ENTRADA: 'Entrada',
  SALIDA: 'Salida',
  AJUSTE: 'Ajuste',
}

export const TIPO_MOVIMIENTO_COLOR: Record<TipoMovimiento, string> = {
  ENTRADA: 'bg-exito-suave text-exito',
  SALIDA: 'bg-kallpa-100 text-kallpa-800',
  AJUSTE: 'bg-atencion-suave text-atencion',
}

export const MOTIVOS_MOVIMIENTO: MotivoMovimiento[] = [
  'COMPRA',
  'DEVOLUCION',
  'ENTREGA',
  'MERMA',
  'VENCIMIENTO',
  'CONSUMO_INTERNO',
  'INVENTARIO_INICIAL',
  'CONTEO_FISICO',
  'CORRECCION',
  'OTRO',
]

export const MOTIVO_ETIQUETA: Record<MotivoMovimiento, string> = {
  COMPRA: 'Compra',
  DEVOLUCION: 'Devolución',
  ENTREGA: 'Entrega a cocina',
  MERMA: 'Merma',
  VENCIMIENTO: 'Vencimiento',
  CONSUMO_INTERNO: 'Consumo interno',
  INVENTARIO_INICIAL: 'Inventario inicial',
  CONTEO_FISICO: 'Conteo físico',
  CORRECCION: 'Corrección',
  OTRO: 'Otro',
}

/** Motivos sugeridos para cada tipo de movimiento. */
export const MOTIVOS_POR_TIPO: Record<TipoMovimiento, MotivoMovimiento[]> = {
  ENTRADA: ['COMPRA', 'DEVOLUCION', 'INVENTARIO_INICIAL', 'CONTEO_FISICO', 'CORRECCION', 'OTRO'],
  SALIDA: ['ENTREGA', 'MERMA', 'VENCIMIENTO', 'CONSUMO_INTERNO', 'CORRECCION', 'OTRO'],
  AJUSTE: ['CONTEO_FISICO', 'CORRECCION', 'OTRO'],
}

export const MOTIVO_POR_DEFECTO: Record<TipoMovimiento, MotivoMovimiento> = {
  ENTRADA: 'COMPRA',
  SALIDA: 'MERMA',
  AJUSTE: 'CONTEO_FISICO',
}

/** Formatea una cantidad con hasta 3 decimales, sin ceros sobrantes. */
export function cantidad(n: number | string): string {
  const v = typeof n === 'string' ? Number(n) : n
  return v.toLocaleString('es-BO', { maximumFractionDigits: 3 })
}

/** Formatea una cantidad del kardex con su signo explícito. */
export function cantidadConSigno(n: number | string): string {
  const v = typeof n === 'string' ? Number(n) : n
  const signo = v > 0 ? '+' : v < 0 ? '−' : ''
  return signo + cantidad(Math.abs(v))
}
