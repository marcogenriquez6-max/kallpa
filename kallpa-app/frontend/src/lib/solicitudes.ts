import type { EstadoSolicitud, OrigenInsumo } from '../types'

export const ESTADOS_SOLICITUD: EstadoSolicitud[] = [
  'BORRADOR',
  'APROBADA',
  'EN_COMPRA',
  'ENTREGADA_PARCIAL',
  'ENTREGADA',
  'ANULADA',
]

export const ESTADO_SOLICITUD_ETIQUETA: Record<EstadoSolicitud, string> = {
  BORRADOR: 'Borrador',
  APROBADA: 'Aprobada',
  EN_COMPRA: 'En compra',
  ENTREGADA_PARCIAL: 'Entregada parcial',
  ENTREGADA: 'Entregada',
  ANULADA: 'Anulada',
}

export const ESTADO_SOLICITUD_COLOR: Record<EstadoSolicitud, string> = {
  BORRADOR: 'bg-fondo text-texto-2',
  APROBADA: 'bg-exito-suave text-exito',
  EN_COMPRA: 'bg-atencion-suave text-atencion',
  ENTREGADA_PARCIAL: 'bg-atencion-suave text-atencion',
  ENTREGADA: 'bg-exito-suave text-exito',
  ANULADA: 'bg-rose-100 text-rose-800',
}

export const ORIGENES: OrigenInsumo[] = ['COMPRAR', 'STOCK', 'A_CRITERIO']

export const ORIGEN_ETIQUETA: Record<OrigenInsumo, string> = {
  COMPRAR: 'Comprar',
  STOCK: 'Stock',
  A_CRITERIO: 'A criterio',
}

export const ORIGEN_COLOR: Record<OrigenInsumo, string> = {
  COMPRAR: 'bg-kallpa-100 text-kallpa-700',
  STOCK: 'bg-fondo text-texto-2',
  A_CRITERIO: 'bg-atencion-suave text-atencion',
}
