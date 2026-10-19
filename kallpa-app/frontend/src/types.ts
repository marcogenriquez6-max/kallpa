export type Rol =
  | 'GERENTE'
  | 'GERENTE_GASTRONOMICO'
  | 'LOGISTICA'
  | 'COCINA'
  | 'CONSULTA'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo?: boolean
  debeCambiarPassword?: boolean
  ultimoAcceso?: string | null
  creadoEn?: string
}

export interface LoginRespuesta {
  token: string
  usuario: Usuario
}

export interface Parametro {
  clave: string
  valor: string
  descripcion?: string | null
  actualizado?: string
}

export interface BitacoraEntrada {
  id: string
  entidad: string
  entidadId: string
  accion: string
  estadoAnterior?: string | null
  estadoNuevo?: string | null
  detalle?: unknown
  usuario?: { nombre: string; rol: Rol }
  usuarioId: string
  fechaHora: string
}

export interface CrearUsuario {
  nombre: string
  email: string
  rol: Rol
  passwordTemporal: string
}

// ---------------------------------------------------------------------
// Catálogo y fichas técnicas
// ---------------------------------------------------------------------

export type TipoUnidad = 'MASA' | 'VOLUMEN' | 'CONTEO'

export type TipoItemCatalogo =
  | 'PLATO_FONDO'
  | 'GUARNICION'
  | 'ENSALADA'
  | 'POSTRE'
  | 'COCTELERIA'
  | 'BOCADITOS'
  | 'SERVICIO'

export type LineaCatalogo = 'CLASICA' | 'RESERVA' | 'GRAN_RESERVA'

export interface UnidadMedida {
  codigo: string
  nombre: string
  tipo: TipoUnidad
  factorBase: string
}

export interface CategoriaInsumo {
  id: number
  nombre: string
  orden: number
  _count?: { insumos: number }
}

export interface Insumo {
  id: string
  nombre: string
  categoriaId: number
  categoria?: CategoriaInsumo
  unidadBaseCodigo: string
  unidadBase?: UnidadMedida
  unidadCompraCodigo?: string | null
  unidadCompra?: UnidadMedida | null
  pesoUnitarioGramos?: string | null
  especificacionHabitual?: string | null
  marcaPreferida?: string | null
  perecible: boolean
  requiereFrio: boolean
  stockActual?: string
  stockMinimo?: string
  activo: boolean
  _count?: { fichaLineas: number }
}

export interface ItemCatalogo {
  id: string
  codigo: string
  nombre: string
  descripcion?: string | null
  tipo: TipoItemCatalogo
  linea?: LineaCatalogo | null
  precioVenta: string
  activo: boolean
  fichaVigente?: { id: string; version: number } | null
}

export interface FichaTecnicaLinea {
  id: string
  insumoId: string
  insumo?: Insumo
  cantidadPorPorcion: string
  unidadCodigo: string
  unidad?: UnidadMedida
  porcentajeMerma: string
  aCriterio: boolean
  especificacion?: string | null
}

export interface FichaTecnica {
  id: string
  itemId: string
  version: number
  vigente: boolean
  porcionGramos?: string | null
  procedimiento?: string | null
  creadoEn: string
  lineas?: FichaTecnicaLinea[]
  item?: { id: string; codigo: string; nombre: string; precioVenta: string }
  _count?: { lineas: number }
}

export interface DetalleCosto {
  insumoId: string
  insumo: string
  cantidad: number | null
  unidad: string
  costo: number | null
  motivo?: string
}

export interface CostoFicha {
  fichaId: string
  version: number
  item: { id: string; codigo: string; nombre: string; precioVenta: string }
  completo: boolean
  costoPorcion: number
  precioVenta: number
  margen: number
  margenPorcentaje: number | null
  detalle: DetalleCosto[]
}

// ---------------------------------------------------------------------
// Clientes y contratos
// ---------------------------------------------------------------------

export type TipoCliente = 'SOCIAL' | 'FOLKLORICO' | 'ACADEMICO' | 'INSTITUCIONAL'

export type EstadoContrato =
  | 'COTIZACION'
  | 'CONFIRMADO'
  | 'PLANIFICADO'
  | 'EN_COMPRA'
  | 'INSUMOS_ENTREGADOS'
  | 'EN_PRODUCCION'
  | 'SERVIDO'
  | 'LIQUIDADO'
  | 'CANCELADO'

export type TipoPago = 'ANTICIPO' | 'SALDO' | 'ADICIONAL' | 'DEVOLUCION'

export interface Cliente {
  id: string
  nombre: string
  ci?: string | null
  nit?: string | null
  razonSocial?: string | null
  telefono: string
  email?: string | null
  tipo: TipoCliente
  creadoEn?: string
  _count?: { contratos: number }
  contratos?: {
    id: string
    codigo: string
    fechaEvento: string
    estado: EstadoContrato
    precioTotal: string
  }[]
}

export interface ContratoItem {
  id: string
  itemId: string
  item?: { id: string; codigo: string; nombre: string; precioVenta: string }
  cantidad: number
  precioUnitario: string
  subtotal: string
}

export interface Pago {
  id: string
  contratoId: string
  tipo: TipoPago
  monto: string
  metodo: string
  fecha: string
  comprobante?: string | null
}

export interface ResumenContrato {
  anticipoPorcentaje: number
  anticipoEsperado: number
  abonado: number
  saldo: number
  garzonesSugeridos: number
}

export interface Contrato {
  id: string
  codigo: string
  clienteId: string
  cliente?: { id?: string; nombre: string; telefono?: string; tipo?: TipoCliente }
  registradoPorId?: string
  registradoPor?: { nombre: string }
  tipoEvento: string
  fechaEvento: string
  horaServicio: string
  lugar: string
  direccion?: string | null
  numeroPlatos: number
  numeroPlatosFinal?: number | null
  fechaConfirmacion?: string | null
  garzonesIncluidos: number
  precioTotal: string
  estado: EstadoContrato
  requisitosEspeciales?: string | null
  observaciones?: string | null
  creadoEn?: string
  actualizadoEn?: string
  items?: ContratoItem[]
  pagos?: Pago[]
  resumen?: ResumenContrato
  _count?: { items: number }
}

// ---------------------------------------------------------------------
// Proveedores
// ---------------------------------------------------------------------

export type CondicionPago = 'CONTADO' | 'CREDITO_7' | 'CREDITO_15' | 'CREDITO_30'

export interface Proveedor {
  id: string
  razonSocial: string
  nombreContacto?: string | null
  nitOCi?: string | null
  telefono?: string | null
  whatsapp?: string | null
  direccion?: string | null
  ubicacionMercado?: string | null
  condicionPago: CondicionPago
  emiteFactura: boolean
  calificacion?: number | null
  observaciones?: string | null
  activo: boolean
  creadoEn?: string
  insumos?: ProveedorInsumo[]
  _count?: { insumos: number; compras: number }
}

export interface ProveedorInsumo {
  id: string
  proveedorId: string
  proveedor?: { id: string; razonSocial: string; activo: boolean }
  insumoId: string
  insumo?: { id: string; nombre: string; unidadBaseCodigo?: string; categoriaId?: number }
  precioUnitario: string
  fecha: string
}

// ---------------------------------------------------------------------
// Solicitud de insumos (F-001)
// ---------------------------------------------------------------------

export type EstadoSolicitud =
  | 'BORRADOR'
  | 'APROBADA'
  | 'EN_COMPRA'
  | 'ENTREGADA_PARCIAL'
  | 'ENTREGADA'
  | 'ANULADA'

export type OrigenInsumo = 'COMPRAR' | 'STOCK' | 'A_CRITERIO'

export interface SolicitudItem {
  id: string
  solicitudId: string
  insumoId: string
  insumo?: Insumo
  cantidadCalculada?: string | null
  cantidad?: string | null
  unidadCodigo: string
  unidad?: UnidadMedida
  especificacion?: string | null
  marca?: string | null
  marcaObligatoria: boolean
  origen: OrigenInsumo
  observacion?: string | null
}

export interface SolicitudInsumos {
  id: string
  folio: string
  contratoId: string
  contrato?: {
    codigo: string
    tipoEvento?: string
    fechaEvento?: string
    horaServicio?: string
    numeroPlatos?: number
    numeroPlatosFinal?: number | null
    estado?: EstadoContrato
    cliente?: { nombre: string }
  }
  version: number
  platosBase: number
  creadaPorId?: string
  creadaPor?: { nombre: string }
  fechaHoraSolicitud: string
  fechaHoraRequerida: string
  aprobadaPor?: { nombre: string } | null
  aprobadaPorId?: string | null
  fechaHoraAprobacion?: string | null
  estado: EstadoSolicitud
  observaciones?: string | null
  items?: SolicitudItem[]
  avisos?: string[]
  _count?: { items: number }
}

// ---------------------------------------------------------------------
// Inventario (existencias y kardex)
// ---------------------------------------------------------------------

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE'

export type MotivoMovimiento =
  | 'COMPRA'
  | 'DEVOLUCION'
  | 'ENTREGA'
  | 'MERMA'
  | 'VENCIMIENTO'
  | 'CONSUMO_INTERNO'
  | 'INVENTARIO_INICIAL'
  | 'CONTEO_FISICO'
  | 'CORRECCION'
  | 'OTRO'

export interface ExistenciaInventario {
  id: string
  nombre: string
  categoria: { id: number; nombre: string }
  unidadBaseCodigo: string
  unidadBase: { codigo: string; nombre: string }
  stockActual: number
  stockMinimo: number
  bajoMinimo: boolean
  perecible: boolean
  requiereFrio: boolean
}

export interface MovimientoInventario {
  id: string
  insumoId: string
  insumo?: {
    id: string
    nombre: string
    unidadBaseCodigo: string
    categoria?: { nombre: string }
  }
  tipo: TipoMovimiento
  motivo: MotivoMovimiento
  cantidad: string
  saldo: string
  costoUnitario?: string | null
  contratoId?: string | null
  contrato?: { codigo: string } | null
  referenciaTipo?: string | null
  referenciaId?: string | null
  observacion?: string | null
  registradoPor?: { nombre: string }
  registradoPorId?: string
  fechaHora: string
}

export interface ResumenInventario {
  insumosActivos: number
  bajoMinimo: number
  movimientosMes: number
}
