import type { LineaCatalogo, TipoItemCatalogo, TipoUnidad } from '../types'

export const TIPOS_ITEM: TipoItemCatalogo[] = [
  'PLATO_FONDO',
  'GUARNICION',
  'ENSALADA',
  'POSTRE',
  'COCTELERIA',
  'BOCADITOS',
  'SERVICIO',
]

export const TIPO_ITEM_ETIQUETA: Record<TipoItemCatalogo, string> = {
  PLATO_FONDO: 'Plato de fondo',
  GUARNICION: 'Guarnición',
  ENSALADA: 'Ensalada',
  POSTRE: 'Postre',
  COCTELERIA: 'Coctelería',
  BOCADITOS: 'Bocaditos',
  SERVICIO: 'Servicio',
}

export const LINEAS: LineaCatalogo[] = ['CLASICA', 'RESERVA', 'GRAN_RESERVA']

export const LINEA_ETIQUETA: Record<LineaCatalogo, string> = {
  CLASICA: 'Clásica (pollo)',
  RESERVA: 'Reserva (cerdo)',
  GRAN_RESERVA: 'Gran Reserva (res)',
}

export const TIPO_UNIDAD_ETIQUETA: Record<TipoUnidad, string> = {
  MASA: 'Masa',
  VOLUMEN: 'Volumen',
  CONTEO: 'Conteo',
}

export const TIPOS_UNIDAD: TipoUnidad[] = ['MASA', 'VOLUMEN', 'CONTEO']

/** Clases compartidas por los formularios del módulo. */
export const campo =
  'w-full rounded-md border border-linea bg-white px-3 py-2 text-sm text-grafito outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15'
export const campoCompacto =
  'rounded-md border border-linea bg-white px-2 py-1.5 text-sm text-grafito outline-none transition focus:border-brand'
export const botonPrimario =
  'inline-flex items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark active:translate-y-px disabled:opacity-60'
export const botonSecundario =
  'inline-flex items-center justify-center gap-2 rounded-md border border-linea bg-white px-3 py-2 text-sm font-medium text-grafito transition hover:border-brand/40 hover:text-brand'
export const etiquetaTipo =
  'inline-block rounded bg-fondo px-2 py-0.5 text-xs font-medium text-texto-2'

export function aBs(n: number): string {
  return n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
