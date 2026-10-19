import type {
  BitacoraEntrada,
  CategoriaInsumo,
  Cliente,
  CondicionPago,
  Contrato,
  CostoFicha,
  CrearUsuario,
  EstadoContrato,
  ExistenciaInventario,
  FichaTecnica,
  Insumo,
  ItemCatalogo,
  LineaCatalogo,
  LoginRespuesta,
  MotivoMovimiento,
  MovimientoInventario,
  OrigenInsumo,
  Pago,
  ResumenInventario,
  TipoMovimiento,
  Parametro,
  Proveedor,
  ProveedorInsumo,
  Rol,
  SolicitudInsumos,
  SolicitudItem,
  EstadoSolicitud,
  TipoCliente,
  TipoItemCatalogo,
  TipoPago,
  TipoUnidad,
  UnidadMedida,
  Usuario,
} from '../types'

const BASE = '/api'
const K_TOKEN = 'kallpa.token'

export function getToken(): string | null {
  return localStorage.getItem(K_TOKEN)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(K_TOKEN, token)
  else localStorage.removeItem(K_TOKEN)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

interface Opciones {
  method?: string
  body?: unknown
  auth?: boolean
}

function extraerMensaje(datos: unknown): string | null {
  if (datos && typeof datos === 'object' && 'message' in datos) {
    const m = (datos as { message: unknown }).message
    if (Array.isArray(m)) return m.join('. ')
    if (typeof m === 'string') return m
  }
  return null
}

export async function api<T = unknown>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opciones
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let res: Response
  try {
    res = await fetch(BASE + ruta, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor.')
  }

  let datos: unknown = null
  try {
    datos = await res.json()
  } catch {
    datos = null
  }

  if (!res.ok) {
    throw new ApiError(res.status, extraerMensaje(datos) ?? `Error ${res.status}`)
  }
  return datos as T
}

export const AuthApi = {
  login: (email: string, password: string) =>
    api<LoginRespuesta>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  perfil: () => api<Usuario>('/auth/perfil'),
  cambiarPassword: (passwordActual: string, passwordNueva: string) =>
    api<{ mensaje: string }>('/auth/cambiar-password', {
      method: 'POST',
      body: { passwordActual, passwordNueva },
    }),
}

export const UsuariosApi = {
  listar: () => api<Usuario[]>('/usuarios'),
  crear: (body: CrearUsuario) => api<Usuario>('/usuarios', { method: 'POST', body }),
  actualizar: (id: string, body: { nombre?: string; rol?: Rol; activo?: boolean }) =>
    api<Usuario>(`/usuarios/${id}`, { method: 'PATCH', body }),
  restablecer: (id: string, passwordTemporal: string) =>
    api<{ mensaje: string }>(`/usuarios/${id}/restablecer-password`, {
      method: 'POST',
      body: { passwordTemporal },
    }),
}

export const ParametrosApi = {
  listar: () => api<Parametro[]>('/parametros'),
  actualizar: (clave: string, valor: number) =>
    api<Parametro>(`/parametros/${clave}`, { method: 'PATCH', body: { valor } }),
}

export const BitacoraApi = {
  listar: (filtro: { entidad?: string; entidadId?: string; limite?: number } = {}) => {
    const qs = new URLSearchParams()
    if (filtro.entidad) qs.set('entidad', filtro.entidad)
    if (filtro.entidadId) qs.set('entidadId', filtro.entidadId)
    if (filtro.limite) qs.set('limite', String(filtro.limite))
    const q = qs.toString()
    return api<BitacoraEntrada[]>('/bitacora' + (q ? `?${q}` : ''))
  },
}

export const SaludApi = {
  estado: () => api<unknown>('/salud', { auth: false }),
}

// ---------------------------------------------------------------------
// Catálogo y fichas técnicas
// ---------------------------------------------------------------------

export interface DatosUnidad {
  codigo?: string
  nombre?: string
  tipo?: TipoUnidad
  factorBase?: number
}

export interface DatosInsumo {
  nombre?: string
  categoriaId?: number
  unidadBaseCodigo?: string
  unidadCompraCodigo?: string
  pesoUnitarioGramos?: number
  especificacionHabitual?: string
  marcaPreferida?: string
  perecible?: boolean
  requiereFrio?: boolean
  stockMinimo?: number
  activo?: boolean
}

export interface DatosItem {
  codigo?: string
  nombre?: string
  descripcion?: string
  tipo?: TipoItemCatalogo
  linea?: LineaCatalogo
  precioVenta?: number
  activo?: boolean
}

export interface LineaFichaBody {
  insumoId: string
  cantidadPorPorcion: number
  unidadCodigo: string
  porcentajeMerma?: number
  aCriterio?: boolean
  especificacion?: string
}

export interface DatosFicha {
  porcionGramos?: number
  procedimiento?: string
  lineas: LineaFichaBody[]
}

function query(filtro: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams()
  for (const [clave, valor] of Object.entries(filtro)) {
    if (valor !== undefined && valor !== '') qs.set(clave, String(valor))
  }
  const q = qs.toString()
  return q ? `?${q}` : ''
}

export const UnidadesApi = {
  listar: () => api<UnidadMedida[]>('/unidades'),
  crear: (body: DatosUnidad) => api<UnidadMedida>('/unidades', { method: 'POST', body }),
  actualizar: (codigo: string, body: DatosUnidad) =>
    api<UnidadMedida>(`/unidades/${codigo}`, { method: 'PATCH', body }),
}

export const CategoriasApi = {
  listar: () => api<CategoriaInsumo[]>('/categorias'),
  crear: (body: { nombre: string; orden?: number }) =>
    api<CategoriaInsumo>('/categorias', { method: 'POST', body }),
  actualizar: (id: number, body: { nombre?: string; orden?: number }) =>
    api<CategoriaInsumo>(`/categorias/${id}`, { method: 'PATCH', body }),
}

export const InsumosApi = {
  listar: (filtro: { categoriaId?: number; activo?: boolean; q?: string } = {}) =>
    api<Insumo[]>(`/insumos${query(filtro)}`),
  obtener: (id: string) => api<Insumo>(`/insumos/${id}`),
  crear: (body: DatosInsumo) => api<Insumo>('/insumos', { method: 'POST', body }),
  actualizar: (id: string, body: DatosInsumo) =>
    api<Insumo>(`/insumos/${id}`, { method: 'PATCH', body }),
}

export const CatalogoApi = {
  listarItems: (
    filtro: { tipo?: TipoItemCatalogo; linea?: LineaCatalogo; activo?: boolean; q?: string } = {},
  ) => api<ItemCatalogo[]>(`/catalogo/items${query(filtro)}`),
  obtenerItem: (id: string) => api<ItemCatalogo>(`/catalogo/items/${id}`),
  crearItem: (body: DatosItem) => api<ItemCatalogo>('/catalogo/items', { method: 'POST', body }),
  actualizarItem: (id: string, body: DatosItem) =>
    api<ItemCatalogo>(`/catalogo/items/${id}`, { method: 'PATCH', body }),
  listarFichas: (itemId: string) => api<FichaTecnica[]>(`/catalogo/items/${itemId}/fichas`),
  obtenerFicha: (id: string) => api<FichaTecnica>(`/catalogo/fichas/${id}`),
  crearFicha: (itemId: string, body: DatosFicha) =>
    api<FichaTecnica>(`/catalogo/items/${itemId}/fichas`, { method: 'POST', body }),
  costoFicha: (id: string) => api<CostoFicha>(`/catalogo/fichas/${id}/costo`),
}

// ---------------------------------------------------------------------
// Clientes y contratos
// ---------------------------------------------------------------------

export interface DatosCliente {
  nombre?: string
  ci?: string
  nit?: string
  razonSocial?: string
  telefono?: string
  email?: string
  tipo?: TipoCliente
}

export interface ItemContratoBody {
  itemId: string
  cantidad: number
}

export interface DatosContrato {
  clienteId?: string
  tipoEvento?: string
  fechaEvento?: string
  horaServicio?: string
  lugar?: string
  direccion?: string
  numeroPlatos?: number
  requisitosEspeciales?: string
  observaciones?: string
  items?: ItemContratoBody[]
}

export interface DatosPago {
  tipo: TipoPago
  monto: number
  metodo: string
  comprobante?: string
}

export const ClientesApi = {
  listar: (q?: string) => api<Cliente[]>(`/clientes${query({ q })}`),
  obtener: (id: string) => api<Cliente>(`/clientes/${id}`),
  crear: (body: DatosCliente) => api<Cliente>('/clientes', { method: 'POST', body }),
  actualizar: (id: string, body: DatosCliente) =>
    api<Cliente>(`/clientes/${id}`, { method: 'PATCH', body }),
}

export const ContratosApi = {
  listar: (
    filtro: { estado?: EstadoContrato; clienteId?: string; desde?: string; hasta?: string; q?: string } = {},
  ) => api<Contrato[]>(`/contratos${query(filtro)}`),
  obtener: (id: string) => api<Contrato>(`/contratos/${id}`),
  crear: (body: DatosContrato) => api<Contrato>('/contratos', { method: 'POST', body }),
  actualizar: (id: string, body: DatosContrato) =>
    api<Contrato>(`/contratos/${id}`, { method: 'PATCH', body }),
  reemplazarItems: (id: string, items: ItemContratoBody[]) =>
    api<Contrato>(`/contratos/${id}/items`, { method: 'PUT', body: { items } }),
  registrarPago: (id: string, body: DatosPago) =>
    api<Pago>(`/contratos/${id}/pagos`, { method: 'POST', body }),
  confirmarPlatos: (id: string, numeroPlatosFinal: number) =>
    api<Contrato>(`/contratos/${id}/confirmar-platos`, {
      method: 'POST',
      body: { numeroPlatosFinal },
    }),
  cambiarEstado: (id: string, body: { estado: EstadoContrato; motivo?: string }) =>
    api<Contrato>(`/contratos/${id}/estado`, { method: 'PATCH', body }),
}

// ---------------------------------------------------------------------
// Proveedores
// ---------------------------------------------------------------------

export interface DatosProveedor {
  razonSocial?: string
  nombreContacto?: string
  nitOCi?: string
  telefono?: string
  whatsapp?: string
  direccion?: string
  ubicacionMercado?: string
  condicionPago?: CondicionPago
  emiteFactura?: boolean
  calificacion?: number
  observaciones?: string
  activo?: boolean
}

export interface DatosPrecioProveedor {
  insumoId: string
  precioUnitario: number
}

export const ProveedoresApi = {
  listar: (filtro: { activo?: boolean; q?: string } = {}) =>
    api<Proveedor[]>(`/proveedores${query(filtro)}`),
  obtener: (id: string) => api<Proveedor>(`/proveedores/${id}`),
  crear: (body: DatosProveedor) => api<Proveedor>('/proveedores', { method: 'POST', body }),
  actualizar: (id: string, body: DatosProveedor) =>
    api<Proveedor>(`/proveedores/${id}`, { method: 'PATCH', body }),
  registrarPrecio: (id: string, body: DatosPrecioProveedor) =>
    api<ProveedorInsumo>(`/proveedores/${id}/precios`, { method: 'POST', body }),
  preciosPorInsumo: (insumoId: string) =>
    api<ProveedorInsumo[]>(`/proveedores/precios-insumo/${insumoId}`),
}

// ---------------------------------------------------------------------
// Solicitud de insumos (F-001)
// ---------------------------------------------------------------------

export interface DatosSolicitud {
  contratoId: string
  fechaHoraRequerida?: string
  observaciones?: string
}

export interface DatosItemSolicitud {
  insumoId?: string
  cantidad?: number
  unidadCodigo?: string
  origen?: OrigenInsumo
  especificacion?: string
  marca?: string
  marcaObligatoria?: boolean
  observacion?: string
}

export const SolicitudesApi = {
  listar: (filtro: { contratoId?: string; estado?: EstadoSolicitud } = {}) =>
    api<SolicitudInsumos[]>(`/solicitudes${query(filtro)}`),
  obtener: (id: string) => api<SolicitudInsumos>(`/solicitudes/${id}`),
  generar: (body: DatosSolicitud) =>
    api<SolicitudInsumos>('/solicitudes', { method: 'POST', body }),
  agregarItem: (id: string, body: DatosItemSolicitud) =>
    api<SolicitudItem>(`/solicitudes/${id}/items`, { method: 'POST', body }),
  actualizarItem: (id: string, itemId: string, body: DatosItemSolicitud) =>
    api<SolicitudItem>(`/solicitudes/${id}/items/${itemId}`, { method: 'PATCH', body }),
  eliminarItem: (id: string, itemId: string) =>
    api<{ eliminado: boolean }>(`/solicitudes/${id}/items/${itemId}`, { method: 'DELETE' }),
  aprobar: (id: string) => api<SolicitudInsumos>(`/solicitudes/${id}/aprobar`, { method: 'POST' }),
  anular: (id: string, motivo?: string) =>
    api<SolicitudInsumos>(`/solicitudes/${id}/anular`, { method: 'POST', body: { motivo } }),
}

// ---------------------------------------------------------------------
// Inventario (existencias y kardex)
// ---------------------------------------------------------------------

export interface DatosMovimiento {
  insumoId: string
  tipo: TipoMovimiento
  motivo: MotivoMovimiento
  /** Con signo, en unidad base: positiva en entradas, negativa en salidas. */
  cantidad: number
  costoUnitario?: number
  contratoId?: string
  referenciaTipo?: string
  referenciaId?: string
  observacion?: string
}

export const InventarioApi = {
  existencias: (filtro: { categoriaId?: number; q?: string; bajoMinimo?: boolean } = {}) =>
    api<ExistenciaInventario[]>(`/inventario/existencias${query(filtro)}`),
  resumen: () => api<ResumenInventario>('/inventario/resumen'),
  movimientos: (
    filtro: {
      insumoId?: string
      tipo?: TipoMovimiento
      motivo?: MotivoMovimiento
      contratoId?: string
      limite?: number
    } = {},
  ) => api<MovimientoInventario[]>(`/inventario/movimientos${query(filtro)}`),
  movimientosDeInsumo: (insumoId: string, limite?: number) =>
    api<MovimientoInventario[]>(
      `/inventario/insumos/${insumoId}/movimientos${query({ limite })}`,
    ),
  registrar: (body: DatosMovimiento) =>
    api<MovimientoInventario>('/inventario/movimientos', { method: 'POST', body }),
}
