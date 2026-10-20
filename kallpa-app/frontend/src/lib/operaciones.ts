import { api } from './api'

/* Tipos de los módulos operativos (compras, entregas, cocina, personal, finanzas). */

export type TipoComprobante = 'FACTURA' | 'RECIBO' | 'NOTA_VENTA' | 'SIN_COMPROBANTE'
export type Conformidad = 'CONFORME' | 'CON_OBSERVACIONES' | 'RECHAZADO'
export type EtapaProduccion = 'MISE_EN_PLACE' | 'COCCION' | 'EMPLATADO' | 'TRASLADO' | 'SERVICIO'
export type PuntoControl = 'RECEPCION' | 'ALMACENAMIENTO' | 'COCCION' | 'ENFRIAMIENTO' | 'TRANSPORTE' | 'SERVICIO'
export type TipoPersona = 'SOCIO' | 'PASANTE' | 'GARZON_EXTERNO' | 'COCINERO_APOYO'
export type ModalidadPago = 'POR_DIA' | 'POR_PLATO' | 'FIJO'
export type TipoGasto = 'EVENTO' | 'FIJO'

export interface Compra {
  id: string
  fechaHora: string
  total: string
  tipoComprobante: TipoComprobante
  proveedor: { id: string; razonSocial: string }
  compradoPor: { nombre: string }
  solicitud: { id: string; folio: string; contrato: { codigo: string } }
  items: {
    id: string
    cantidad: string
    unidadCodigo: string
    precioUnitario: string
    subtotal: string
    marcaComprada?: string | null
    solicitudItem: { insumo: { nombre: string } }
  }[]
}

export interface Entrega {
  id: string
  fechaHora: string
  lugar: string
  conformidad: Conformidad
  observaciones?: string | null
  entregadoPor: { nombre: string }
  recibidoPor: { nombre: string }
  solicitud: { id: string; folio: string; contrato: { id: string; codigo: string; tipoEvento: string } }
  items: {
    id: string
    cantidadRecibida: string
    conformidad: Conformidad
    observacion?: string | null
    solicitudItem: { cantidad?: string | null; unidadCodigo: string; insumo: { nombre: string } }
  }[]
}

export interface RegistroProduccion {
  id: string
  etapa: EtapaProduccion
  fechaHora: string
  observacion?: string | null
  responsable: { nombre: string }
  contrato: { codigo: string; tipoEvento: string }
}

export interface ControlTemperatura {
  id: string
  punto: PuntoControl
  alimento: string
  temperaturaC: string
  fueraDeRango: boolean
  accionCorrectiva?: string | null
  fechaHora: string
  responsable: { nombre: string }
  contrato: { codigo: string; tipoEvento: string }
}

export interface Persona {
  id: string
  nombre: string
  ci: string
  telefono?: string | null
  tipo: TipoPersona
  carnetSanitarioVence?: string | null
  activo: boolean
}

export interface Remuneracion {
  id: string
  concepto: string
  modalidad: ModalidadPago
  cantidad: string
  tarifa: string
  monto: string
  pagado: boolean
  fechaPago?: string | null
  persona: { nombre: string; tipo: TipoPersona }
  contrato: { codigo: string; tipoEvento: string; fechaEvento: string }
}

export interface Gasto {
  id: string
  tipo: TipoGasto
  categoria: string
  descripcion?: string | null
  monto: string
  fecha: string
  contrato?: { codigo: string } | null
  registradoPor: { nombre: string }
}

export interface Liquidacion {
  contrato: {
    id: string
    codigo: string
    estado: string
    tipoEvento: string
    fechaEvento: string
    horaServicio: string
    lugar: string
    numeroPlatos: number
    numeroPlatosFinal?: number | null
    precioTotal: string
    cliente: { nombre: string; telefono: string }
    items: { cantidad: number; precioUnitario: string; subtotal: string; item: { codigo: string; nombre: string } }[]
    pagos: { tipo: string; monto: string; metodo: string; fecha: string }[]
    gastos: { categoria: string; descripcion?: string | null; monto: string; fecha: string }[]
    remuneraciones: { concepto: string; monto: string; pagado: boolean; persona: { nombre: string } }[]
  }
  compras: { id: string; folio: string; proveedor: string; fecha: string; total: number }[]
  resumen: {
    precioTotal: number
    ingresos: number
    saldo: number
    costoInsumos: number
    costoGastos: number
    costoPersonal: number
    costos: number
    utilidad: number
    margen: number | null
    costoPorPlato: number | null
    remuneracionesPendientes: number
  }
}

export interface ResumenPeriodo {
  periodo: { desde: string; hasta: string }
  indicadores: {
    contratos: number
    cancelados: number
    platos: number
    vendido: number
    cobrado: number
    porCobrar: number
    costoCompras: number
    gastosEvento: number
    gastosFijos: number
    costoPersonal: number
    egresos: number
    resultado: number
  }
  porEstado: Record<string, number>
  contratos: {
    id: string
    codigo: string
    cliente: string
    tipoEvento: string
    fechaEvento: string
    platos: number
    precioTotal: number
    estado: string
  }[]
  topItems: { item: string; cantidad: number; monto: number }[]
  comprasPorProveedor: { proveedor: string; total: number }[]
}

function qs(f: Record<string, string | boolean | undefined>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== '') p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const ComprasApi = {
  listar: (f: { solicitudId?: string } = {}) => api<Compra[]>(`/compras${qs(f)}`),
  crear: (body: {
    solicitudId: string
    proveedorId: string
    tipoComprobante?: TipoComprobante
    items: { solicitudItemId: string; cantidad: number; precioUnitario: number; marcaComprada?: string }[]
  }) => api<Compra>('/compras', { method: 'POST', body }),
}

export const EntregasApi = {
  listar: (f: { solicitudId?: string } = {}) => api<Entrega[]>(`/entregas${qs(f)}`),
  receptores: () => api<{ id: string; nombre: string; rol: string }[]>('/entregas/receptores'),
  crear: (body: {
    solicitudId: string
    recibidoPorId: string
    lugar: string
    conformidad: Conformidad
    observaciones?: string
    items: { solicitudItemId: string; cantidadRecibida: number; conformidad: Conformidad; observacion?: string }[]
  }) => api<Entrega>('/entregas', { method: 'POST', body }),
}

export const ProduccionApi = {
  listar: (contratoId?: string) => api<RegistroProduccion[]>(`/produccion${qs({ contratoId })}`),
  crear: (body: { contratoId: string; etapa: EtapaProduccion; observacion?: string }) =>
    api<RegistroProduccion>('/produccion', { method: 'POST', body }),
}

export const CalidadApi = {
  listar: (f: { contratoId?: string; soloFuera?: boolean } = {}) =>
    api<ControlTemperatura[]>(`/calidad/temperaturas${qs(f)}`),
  crear: (body: { contratoId: string; punto: PuntoControl; alimento: string; temperaturaC: number; accionCorrectiva?: string }) =>
    api<ControlTemperatura>('/calidad/temperaturas', { method: 'POST', body }),
}

export const PersonalApi = {
  personas: () => api<Persona[]>('/personal/personas'),
  crearPersona: (body: { nombre: string; ci: string; telefono?: string; tipo: TipoPersona; carnetSanitarioVence?: string }) =>
    api<Persona>('/personal/personas', { method: 'POST', body }),
  actualizarPersona: (id: string, body: { activo?: boolean }) =>
    api<Persona>(`/personal/personas/${id}`, { method: 'PATCH', body }),
  remuneraciones: (f: { contratoId?: string; pagado?: string } = {}) =>
    api<Remuneracion[]>(`/personal/remuneraciones${qs(f)}`),
  crearRemuneracion: (body: { contratoId: string; personaId: string; concepto: string; modalidad: ModalidadPago; cantidad: number; tarifa: number }) =>
    api<Remuneracion>('/personal/remuneraciones', { method: 'POST', body }),
  pagar: (id: string) => api<Remuneracion>(`/personal/remuneraciones/${id}/pagar`, { method: 'POST' }),
}

export const FinanzasApi = {
  gastos: (f: { tipo?: TipoGasto; desde?: string; hasta?: string } = {}) => api<Gasto[]>(`/finanzas/gastos${qs(f)}`),
  crearGasto: (body: { tipo: TipoGasto; categoria: string; descripcion?: string; monto: number; fecha?: string; contratoId?: string }) =>
    api<Gasto>('/finanzas/gastos', { method: 'POST', body }),
  liquidacion: (id: string) => api<Liquidacion>(`/finanzas/contratos/${id}/liquidacion`),
  liquidar: (id: string) => api<unknown>(`/finanzas/contratos/${id}/liquidar`, { method: 'POST' }),
}

export const ReportesApi = {
  resumen: (desde: string, hasta: string) => api<ResumenPeriodo>(`/reportes/resumen${qs({ desde, hasta })}`),
}

export const ETAPA_ETIQUETA: Record<EtapaProduccion, string> = {
  MISE_EN_PLACE: 'Mise en place',
  COCCION: 'Cocción',
  EMPLATADO: 'Emplatado',
  TRASLADO: 'Traslado',
  SERVICIO: 'Servicio',
}
export const PUNTO_ETIQUETA: Record<PuntoControl, string> = {
  RECEPCION: 'Recepción',
  ALMACENAMIENTO: 'Almacenamiento',
  COCCION: 'Cocción',
  ENFRIAMIENTO: 'Enfriamiento',
  TRANSPORTE: 'Transporte',
  SERVICIO: 'Servicio',
}
export const PUNTO_RANGO: Record<PuntoControl, string> = {
  RECEPCION: '≤ 5 °C',
  ALMACENAMIENTO: '≤ 5 °C',
  COCCION: '≥ 74 °C',
  ENFRIAMIENTO: '≤ 5 °C',
  TRANSPORTE: '≤ 5 °C o ≥ 60 °C',
  SERVICIO: '≤ 5 °C o ≥ 60 °C',
}
export const CONFORMIDAD_ETIQUETA: Record<Conformidad, string> = {
  CONFORME: 'Conforme',
  CON_OBSERVACIONES: 'Con observaciones',
  RECHAZADO: 'Rechazado',
}
export const CONFORMIDAD_COLOR: Record<Conformidad, string> = {
  CONFORME: 'bg-exito-suave text-exito',
  CON_OBSERVACIONES: 'bg-atencion-suave text-atencion',
  RECHAZADO: 'bg-kallpa-100 text-kallpa-700',
}
export const TIPO_PERSONA_ETIQUETA: Record<TipoPersona, string> = {
  SOCIO: 'Socio',
  PASANTE: 'Pasante',
  GARZON_EXTERNO: 'Garzón externo',
  COCINERO_APOYO: 'Cocinero de apoyo',
}
export const MODALIDAD_ETIQUETA: Record<ModalidadPago, string> = {
  POR_DIA: 'Por día',
  POR_PLATO: 'Por plato',
  FIJO: 'Monto fijo',
}
export const COMPROBANTE_ETIQUETA: Record<TipoComprobante, string> = {
  FACTURA: 'Factura',
  RECIBO: 'Recibo',
  NOTA_VENTA: 'Nota de venta',
  SIN_COMPROBANTE: 'Sin comprobante',
}

export function bs(n: number | string | null | undefined): string {
  const v = Number(n ?? 0)
  return 'Bs ' + v.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
export function fechaHoraCorta(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
export function hoyISO(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
export function inicioMesISO(): string {
  return hoyISO().slice(0, 8) + '01'
}
