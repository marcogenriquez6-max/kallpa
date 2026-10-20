import { PanelCompras, PanelEntregas } from './Operaciones'
import { pdfSolicitud } from '../../lib/pdf'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { InsumosApi, SolicitudesApi } from '../../lib/api'
import { botonPrimario, botonSecundario, campo, campoCompacto } from '../../lib/catalogo'
import { fechaCorta } from '../../lib/contratos'
import {
  ESTADO_SOLICITUD_COLOR,
  ESTADO_SOLICITUD_ETIQUETA,
  ORIGENES,
  ORIGEN_COLOR,
  ORIGEN_ETIQUETA,
} from '../../lib/solicitudes'
import { useAuth } from '../../lib/auth'
import type { EstadoSolicitud, Insumo, OrigenInsumo, SolicitudInsumos, SolicitudItem } from '../../types'
import { Alerta, Cargando, Etiqueta, Tarjeta } from '../../components/ui'

const ANULABLES: EstadoSolicitud[] = ['BORRADOR', 'APROBADA', 'EN_COMPRA', 'ENTREGADA_PARCIAL']

function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function FilaInsumo({
  solicitudId,
  item,
  editable,
  onSaved,
  onRemoved,
}: {
  solicitudId: string
  item: SolicitudItem
  editable: boolean
  onSaved: (m: string) => void
  onRemoved: (m: string) => void
}) {
  const [cantidad, setCantidad] = useState(item.cantidad ?? '')
  const [origen, setOrigen] = useState<OrigenInsumo>(item.origen)
  const [marca, setMarca] = useState(item.marca ?? '')
  const [especificacion, setEspecificacion] = useState(item.especificacion ?? '')
  const [observacion, setObservacion] = useState(item.observacion ?? '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cambio =
    cantidad !== (item.cantidad ?? '') ||
    origen !== item.origen ||
    marca !== (item.marca ?? '') ||
    especificacion !== (item.especificacion ?? '') ||
    observacion !== (item.observacion ?? '')

  const guardar = async () => {
    setError('')
    setGuardando(true)
    try {
      const n = cantidad.trim() === '' ? undefined : Number(cantidad)
      await SolicitudesApi.actualizarItem(solicitudId, item.id, {
        cantidad: origen === 'A_CRITERIO' ? undefined : n,
        origen,
        marca: marca.trim(),
        especificacion: especificacion.trim(),
        observacion: observacion.trim(),
      })
      onSaved(`Insumo ${item.insumo?.nombre ?? ''} actualizado.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const quitar = async () => {
    setError('')
    try {
      await SolicitudesApi.eliminarItem(solicitudId, item.id)
      onRemoved(`Insumo ${item.insumo?.nombre ?? ''} quitado.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo quitar.')
    }
  }

  const celda = 'px-2 py-2 align-top'
  if (!editable) {
    return (
      <tr className="border-b border-slate-100">
        <td className={`${celda} text-slate-700`}>
          {item.insumo?.nombre ?? item.insumoId}
          {item.insumo?.categoria && (
            <span className="block text-xs text-slate-400">{item.insumo.categoria.nombre}</span>
          )}
        </td>
        <td className={`${celda} font-mono text-slate-500`}>{item.unidadCodigo}</td>
        <td className={`${celda} text-right tabular-nums text-slate-500`}>
          {item.cantidadCalculada ?? '—'}
        </td>
        <td className={`${celda} text-right tabular-nums text-slate-700`}>{item.cantidad ?? '—'}</td>
        <td className={celda}>
          <Etiqueta className={ORIGEN_COLOR[item.origen]}>{ORIGEN_ETIQUETA[item.origen]}</Etiqueta>
        </td>
        <td className={`${celda} text-slate-600`}>{item.marca ?? '—'}</td>
        <td className={`${celda} text-slate-600`}>{item.especificacion ?? '—'}</td>
        <td className={`${celda} text-slate-600`}>{item.observacion ?? '—'}</td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-slate-100">
      <td className={`${celda} text-slate-700`}>
        {item.insumo?.nombre ?? item.insumoId}
        {item.insumo?.categoria && (
          <span className="block text-xs text-slate-400">{item.insumo.categoria.nombre}</span>
        )}
        {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
      </td>
      <td className={`${celda} font-mono text-slate-500`}>{item.unidadCodigo}</td>
      <td className={`${celda} text-right tabular-nums text-slate-400`}>
        {item.cantidadCalculada ?? '—'}
      </td>
      <td className={celda}>
        <input
          type="number"
          min={0}
          step="0.001"
          value={origen === 'A_CRITERIO' ? '' : cantidad}
          disabled={origen === 'A_CRITERIO'}
          onChange={(e) => setCantidad(e.target.value)}
          className={`${campoCompacto} w-24 text-right disabled:bg-slate-100`}
        />
      </td>
      <td className={celda}>
        <select
          value={origen}
          onChange={(e) => setOrigen(e.target.value as OrigenInsumo)}
          className={campoCompacto}
        >
          {ORIGENES.map((o) => (
            <option key={o} value={o}>
              {ORIGEN_ETIQUETA[o]}
            </option>
          ))}
        </select>
      </td>
      <td className={celda}>
        <input
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          className={`${campoCompacto} w-28`}
        />
      </td>
      <td className={celda}>
        <input
          value={especificacion}
          onChange={(e) => setEspecificacion(e.target.value)}
          className={`${campoCompacto} w-32`}
        />
      </td>
      <td className={celda}>
        <input
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          className={`${campoCompacto} w-32`}
        />
      </td>
      <td className={`${celda} whitespace-nowrap`}>
        <button
          type="button"
          onClick={guardar}
          disabled={!cambio || guardando}
          className="mr-2 rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-40"
        >
          {guardando ? '…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={quitar}
          className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
        >
          Quitar
        </button>
      </td>
    </tr>
  )
}

function AgregarInsumo({
  solicitudId,
  insumos,
  onSaved,
}: {
  solicitudId: string
  insumos: Insumo[]
  onSaved: (m: string) => void
}) {
  const [insumoId, setInsumoId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [origen, setOrigen] = useState<OrigenInsumo>('COMPRAR')
  const [marca, setMarca] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const guardar = async () => {
    setError('')
    if (!insumoId) return setError('Selecciona un insumo.')
    setEnviando(true)
    try {
      await SolicitudesApi.agregarItem(solicitudId, {
        insumoId,
        cantidad: cantidad.trim() === '' ? undefined : Number(cantidad),
        origen,
        marca: marca.trim() || undefined,
      })
      setInsumoId('')
      setCantidad('')
      setMarca('')
      setOrigen('COMPRAR')
      onSaved('Insumo agregado.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agregar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-3">
      {error && (
        <div className="mb-2">
          <Alerta tipo="error">{error}</Alerta>
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-[1fr_120px_150px_1fr_auto]">
        <select value={insumoId} onChange={(e) => setInsumoId(e.target.value)} className={campo}>
          <option value="">Agregar insumo…</option>
          {insumos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre} ({i.unidadBaseCodigo})
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          step="0.001"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className={campo}
          placeholder="Cantidad"
        />
        <select
          value={origen}
          onChange={(e) => setOrigen(e.target.value as OrigenInsumo)}
          className={campo}
        >
          {ORIGENES.map((o) => (
            <option key={o} value={o}>
              {ORIGEN_ETIQUETA[o]}
            </option>
          ))}
        </select>
        <input
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          className={campo}
          placeholder="Marca (opcional)"
        />
        <button type="button" onClick={guardar} className={botonPrimario} disabled={enviando}>
          Agregar
        </button>
      </div>
    </div>
  )
}

export function SolicitudDetalle() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const puedeEditar = usuario?.rol === 'GERENTE' || usuario?.rol === 'GERENTE_GASTRONOMICO'

  const [solicitud, setSolicitud] = useState<SolicitudInsumos | null>(null)
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const cargar = useCallback(async () => {
    if (!id) return
    setError('')
    try {
      setSolicitud(await SolicitudesApi.obtener(id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la solicitud.')
    }
  }, [id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    InsumosApi.listar({ activo: true })
      .then(setInsumos)
      .catch(() => setInsumos([]))
  }, [])

  if (!id) return null
  if (!solicitud) return error ? <Alerta tipo="error">{error}</Alerta> : <Cargando />

  const editable = solicitud.estado === 'BORRADOR' && (puedeEditar)
  const items = solicitud.items ?? []
  const resumen = {
    comprar: items.filter((i) => i.origen === 'COMPRAR').length,
    stock: items.filter((i) => i.origen === 'STOCK').length,
    criterio: items.filter((i) => i.origen === 'A_CRITERIO').length,
  }

  const aprobar = async () => {
    if (!confirm('¿Aprobar la solicitud? El contrato pasará a PLANIFICADO.')) return
    try {
      await SolicitudesApi.aprobar(id)
      setOk('Solicitud aprobada.')
      void cargar()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo aprobar.')
    }
  }

  const anular = async () => {
    const motivo = prompt('Motivo de anulación (opcional):') ?? undefined
    try {
      await SolicitudesApi.anular(id, motivo || undefined)
      setOk('Solicitud anulada.')
      void cargar()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo anular.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navegar(-1)} className="text-slate-500 hover:text-slate-700">
          ← Volver
        </button>
      </div>

      {error && <Alerta tipo="error">{error}</Alerta>}
      {ok && <Alerta tipo="ok">{ok}</Alerta>}
      {solicitud.avisos && solicitud.avisos.length > 0 && (
        <Alerta tipo="info">
          <p className="font-medium">Avisos de la explosión de insumos:</p>
          <ul className="mt-1 list-disc pl-5">
            {solicitud.avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Alerta>
      )}

      <Tarjeta
        titulo={
          <span className="flex items-center gap-3">
            <span className="font-mono">{solicitud.folio}</span>
            <Etiqueta className={ESTADO_SOLICITUD_COLOR[solicitud.estado]}>
              {ESTADO_SOLICITUD_ETIQUETA[solicitud.estado]}
            </Etiqueta>
          </span>
        }
        acciones={
          <div className="flex gap-2">
            <button type="button" onClick={() => pdfSolicitud(solicitud)} className={botonSecundario}>
              Descargar PDF
            </button>
            {puedeEditar && (solicitud.estado === 'BORRADOR' || ANULABLES.includes(solicitud.estado)) && (
            <>
              {solicitud.estado === 'BORRADOR' && (
                <button type="button" onClick={aprobar} className={botonPrimario}>
                  Aprobar
                </button>
              )}
              <button type="button" onClick={anular} className={botonSecundario}>
                Anular
              </button>
            </>
            )}
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Contrato</p>
            <Link to={`/contratos/${solicitud.contratoId}`} className="text-brand hover:underline">
              {solicitud.contrato?.codigo} · {solicitud.contrato?.tipoEvento}
            </Link>
            {solicitud.contrato?.cliente && (
              <span className="block text-xs text-slate-400">{solicitud.contrato.cliente.nombre}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">Evento</p>
            <p className="text-slate-700">
              {solicitud.contrato ? fechaCorta(solicitud.contrato.fechaEvento ?? '') : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Versión / platos base</p>
            <p className="text-slate-700">
              #{solicitud.version} · {solicitud.platosBase} platos
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Requerido en cocina</p>
            <p className="text-slate-700">{fechaHora(solicitud.fechaHoraRequerida)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Creada por</p>
            <p className="text-slate-700">
              {solicitud.creadaPor?.nombre ?? '—'}
              <span className="block text-xs text-slate-400">
                {fechaHora(solicitud.fechaHoraSolicitud)}
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Aprobada por</p>
            {solicitud.aprobadaPor ? (
              <p className="text-slate-700">
                {solicitud.aprobadaPor.nombre}
                {solicitud.fechaHoraAprobacion && (
                  <span className="block text-xs text-slate-400">
                    {fechaHora(solicitud.fechaHoraAprobacion)}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-slate-400">Pendiente</p>
            )}
          </div>
          {solicitud.observaciones && (
            <div className="sm:col-span-3">
              <p className="text-xs text-slate-500">Observaciones</p>
              <p className="text-slate-700">{solicitud.observaciones}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Etiqueta className="bg-rose-100 text-rose-800">{resumen.comprar} por comprar</Etiqueta>
          <Etiqueta className="bg-slate-100 text-slate-600">{resumen.stock} en stock</Etiqueta>
          <Etiqueta className="bg-amber-100 text-amber-800">{resumen.criterio} a criterio</Etiqueta>
          <Etiqueta className="bg-slate-100 text-slate-600">{items.length} insumos</Etiqueta>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Insumos requeridos">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="px-2 py-2">Insumo</th>
                <th className="px-2 py-2">Unidad</th>
                <th className="px-2 py-2 text-right">Calculada</th>
                <th className="px-2 py-2 text-right">Cantidad</th>
                <th className="px-2 py-2">Origen</th>
                <th className="px-2 py-2">Marca</th>
                <th className="px-2 py-2">Especificación</th>
                <th className="px-2 py-2">Observación</th>
                {editable && <th className="px-2 py-2" />}
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <FilaInsumo
                  key={it.id}
                  solicitudId={id}
                  item={it}
                  editable={editable}
                  onSaved={(m) => {
                    setOk(m)
                    void cargar()
                  }}
                  onRemoved={(m) => {
                    setOk(m)
                    void cargar()
                  }}
                />
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={editable ? 9 : 8} className="py-6 text-center text-slate-500">
                    La solicitud no tiene insumos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {editable && (
          <div className="mt-4">
            <AgregarInsumo
              solicitudId={id}
              insumos={insumos}
              onSaved={(m) => {
                setOk(m)
                void cargar()
              }}
            />
          </div>
        )}
      </Tarjeta>
    {solicitud.estado !== 'BORRADOR' && solicitud.estado !== 'ANULADA' && (
        <>
          <PanelCompras solicitud={solicitud} onCambio={() => void cargar()} />
          <PanelEntregas solicitud={solicitud} onCambio={() => void cargar()} />
        </>
      )}
    </div>
  )
}
