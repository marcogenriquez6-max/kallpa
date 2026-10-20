import { pdfInventario } from '../../lib/pdf'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CategoriasApi, ContratosApi, InventarioApi } from '../../lib/api'
import type { DatosMovimiento } from '../../lib/api'
import { botonPrimario, botonSecundario, campo, etiquetaTipo } from '../../lib/catalogo'
import { useAuth } from '../../lib/auth'
import type {
  CategoriaInsumo,
  Contrato,
  ExistenciaInventario,
  MovimientoInventario,
  MotivoMovimiento,
  ResumenInventario,
  TipoMovimiento,
} from '../../types'
import { Alerta, Cargando, Etiqueta, Tarjeta } from '../../components/ui'
import { fechaCorta } from '../../lib/contratos'
import {
  MOTIVO_ETIQUETA,
  MOTIVO_POR_DEFECTO,
  MOTIVOS_POR_TIPO,
  TIPO_MOVIMIENTO_COLOR,
  TIPO_MOVIMIENTO_ETIQUETA,
  TIPOS_MOVIMIENTO,
  cantidad,
  cantidadConSigno,
} from '../../lib/inventario'

const ESTADOS_EVENTO_ACTIVO: Contrato['estado'][] = [
  'CONFIRMADO',
  'PLANIFICADO',
  'EN_COMPRA',
  'INSUMOS_ENTREGADOS',
  'EN_PRODUCCION',
]

function FormMovimiento({
  existencias,
  insumoInicialId,
  onCancel,
  onSaved,
}: {
  existencias: ExistenciaInventario[]
  insumoInicialId?: string
  onCancel: () => void
  onSaved: () => void
}) {
  const [insumoId, setInsumoId] = useState(insumoInicialId ?? '')
  const [tipo, setTipo] = useState<TipoMovimiento>('ENTRADA')
  const [motivo, setMotivo] = useState<MotivoMovimiento>(MOTIVO_POR_DEFECTO.ENTRADA)
  const [cantidadTxt, setCantidadTxt] = useState('')
  const [stockContadoTxt, setStockContadoTxt] = useState('')
  const [contratoId, setContratoId] = useState('')
  const [observacion, setObservacion] = useState('')
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    ContratosApi.listar()
      .then((cs) => setContratos(cs.filter((c) => ESTADOS_EVENTO_ACTIVO.includes(c.estado))))
      .catch(() => setContratos([]))
  }, [])

  const insumo = existencias.find((e) => e.id === insumoId)

  const cantidadFirmada = useMemo(() => {
    if (!insumo) return 0
    if (tipo === 'AJUSTE') {
      const contado = Number(stockContadoTxt)
      if (stockContadoTxt === '' || Number.isNaN(contado)) return 0
      return Math.round((contado - insumo.stockActual) * 1000) / 1000
    }
    const v = Math.abs(Number(cantidadTxt))
    if (!Number.isFinite(v) || v === 0) return 0
    return tipo === 'ENTRADA' ? v : -v
  }, [insumo, tipo, cantidadTxt, stockContadoTxt])

  const saldoPrevisto = insumo
    ? Math.round((insumo.stockActual + cantidadFirmada) * 1000) / 1000
    : 0

  const cambiarTipo = (t: TipoMovimiento) => {
    setTipo(t)
    setMotivo(MOTIVO_POR_DEFECTO[t])
    setCantidadTxt('')
    setStockContadoTxt('')
  }

  const guardar = async () => {
    setError('')
    if (!insumo) return setError('Selecciona un insumo.')
    if (cantidadFirmada === 0) {
      return setError(
        tipo === 'AJUSTE'
          ? 'Ingresa el stock contado (distinto del actual).'
          : 'Ingresa una cantidad distinta de cero.',
      )
    }
    setEnviando(true)
    try {
      const body: DatosMovimiento = {
        insumoId: insumo.id,
        tipo,
        motivo,
        cantidad: cantidadFirmada,
        contratoId: contratoId || undefined,
        observacion: observacion.trim() || undefined,
      }
      await InventarioApi.registrar(body)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el movimiento.')
    } finally {
      setEnviando(false)
    }
  }

  const unidad = insumo?.unidadBaseCodigo ?? ''

  return (
    <div className="space-y-4 rounded-xl border border-brand/30 bg-brand-100/30 p-4">
      <h3 className="text-sm font-semibold text-slate-700">Registrar movimiento de almacén</h3>
      {error && <Alerta tipo="error">{error}</Alerta>}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Insumo
          <select
            value={insumoId}
            onChange={(e) => setInsumoId(e.target.value)}
            className={`mt-1 ${campo}`}
          >
            <option value="">Selecciona un insumo…</option>
            {existencias.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre} · {cantidad(e.stockActual)} {e.unidadBaseCodigo}
                {e.bajoMinimo ? ' ⚠' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Tipo
          <select
            value={tipo}
            onChange={(e) => cambiarTipo(e.target.value as TipoMovimiento)}
            className={`mt-1 ${campo}`}
          >
            {TIPOS_MOVIMIENTO.map((t) => (
              <option key={t} value={t}>
                {TIPO_MOVIMIENTO_ETIQUETA[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Motivo
          <select
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoMovimiento)}
            className={`mt-1 ${campo}`}
          >
            {MOTIVOS_POR_TIPO[tipo].map((m) => (
              <option key={m} value={m}>
                {MOTIVO_ETIQUETA[m]}
              </option>
            ))}
          </select>
        </label>

        {tipo === 'AJUSTE' ? (
          <label className="text-sm font-medium text-slate-700">
            Stock contado {unidad ? `(${unidad})` : ''}
            <input
              type="number"
              min={0}
              step="0.001"
              value={stockContadoTxt}
              onChange={(e) => setStockContadoTxt(e.target.value)}
              className={`mt-1 ${campo}`}
              placeholder={insumo ? `actual: ${cantidad(insumo.stockActual)}` : '—'}
            />
          </label>
        ) : (
          <label className="text-sm font-medium text-slate-700">
            Cantidad {unidad ? `(${unidad})` : ''}
            <input
              type="number"
              min={0}
              step="0.001"
              value={cantidadTxt}
              onChange={(e) => setCantidadTxt(e.target.value)}
              className={`mt-1 ${campo}`}
              placeholder="0"
            />
          </label>
        )}

        <label className="text-sm font-medium text-slate-700">
          Evento (opcional)
          <select
            value={contratoId}
            onChange={(e) => setContratoId(e.target.value)}
            className={`mt-1 ${campo}`}
          >
            <option value="">—</option>
            {contratos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} · {c.tipoEvento}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Observación
          <input
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            className={`mt-1 ${campo}`}
            placeholder="Detalle del movimiento…"
          />
        </label>
      </div>

      {insumo && cantidadFirmada !== 0 && (
        <p className="text-sm text-slate-600">
          {tipo === 'AJUSTE' ? 'Ajuste' : 'Movimiento'}:{' '}
          <span
            className={`font-semibold ${cantidadFirmada > 0 ? 'text-exito' : 'text-brand'}`}
          >
            {cantidadConSigno(cantidadFirmada)} {unidad}
          </span>{' '}
          · saldo resultante{' '}
          <span className={`font-semibold ${saldoPrevisto < 0 ? 'text-brand' : 'text-slate-700'}`}>
            {cantidad(saldoPrevisto)} {unidad}
          </span>
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={botonSecundario} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" onClick={guardar} className={botonPrimario} disabled={enviando}>
          {enviando ? 'Registrando…' : 'Registrar'}
        </button>
      </div>
    </div>
  )
}

export function Inventario() {
  const { usuario } = useAuth()
  const puedeEditar =
    usuario?.rol === 'GERENTE' ||
    usuario?.rol === 'GERENTE_GASTRONOMICO' ||
    usuario?.rol === 'LOGISTICA'

  const [existencias, setExistencias] = useState<ExistenciaInventario[] | null>(null)
  const [resumen, setResumen] = useState<ResumenInventario | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoInventario[] | null>(null)
  const [categorias, setCategorias] = useState<CategoriaInsumo[]>([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [vista, setVista] = useState<'existencias' | 'movimientos'>('existencias')
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroInsumo, setFiltroInsumo] = useState('')

  const [mostrarForm, setMostrarForm] = useState(false)
  const [insumoForm, setInsumoForm] = useState<string | undefined>(undefined)

  const cargarExistencias = useCallback(async () => {
    try {
      setExistencias(
        await InventarioApi.existencias({
          categoriaId: filtroCategoria ? Number(filtroCategoria) : undefined,
          q: busqueda.trim() || undefined,
          bajoMinimo: soloBajoMinimo || undefined,
        }),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las existencias.')
    }
  }, [filtroCategoria, busqueda, soloBajoMinimo])

  const cargarResumen = useCallback(async () => {
    try {
      setResumen(await InventarioApi.resumen())
    } catch {
      /* el encabezado queda sin indicadores */
    }
  }, [])

  const cargarMovimientos = useCallback(async () => {
    try {
      setMovimientos(
        await InventarioApi.movimientos({
          insumoId: filtroInsumo || undefined,
          tipo: (filtroTipo || undefined) as TipoMovimiento | undefined,
          limite: 150,
        }),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los movimientos.')
    }
  }, [filtroInsumo, filtroTipo])

  useEffect(() => {
    void cargarExistencias()
  }, [cargarExistencias])

  useEffect(() => {
    void cargarResumen()
  }, [cargarResumen])

  useEffect(() => {
    if (vista === 'movimientos') void cargarMovimientos()
  }, [vista, cargarMovimientos])

  useEffect(() => {
    CategoriasApi.listar()
      .then(setCategorias)
      .catch(() => setCategorias([]))
  }, [])

  const recargar = () => {
    void cargarExistencias()
    void cargarResumen()
    if (vista === 'movimientos') void cargarMovimientos()
  }

  const abrirForm = (id?: string) => {
    setOk('')
    setInsumoForm(id)
    setMostrarForm(true)
  }

  const verMovimientosDe = (id: string) => {
    setFiltroInsumo(id)
    setFiltroTipo('')
    setVista('movimientos')
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi etiqueta="Insumos" valor={resumen?.insumosActivos ?? '—'} />
        <Kpi
          etiqueta="Bajo stock mínimo"
          valor={resumen?.bajoMinimo ?? '—'}
          alerta={(resumen?.bajoMinimo ?? 0) > 0}
        />
        <Kpi etiqueta="Movimientos del mes" valor={resumen?.movimientosMes ?? '—'} />
      </div>

      <Tarjeta
        titulo="Inventario"
        acciones={
          <div className="flex flex-wrap gap-2">
            <button onClick={() => existencias && pdfInventario(existencias)} className={botonSecundario}>
              Descargar PDF
            </button>
            {puedeEditar && !mostrarForm && (
              <button onClick={() => abrirForm()} className={botonPrimario}>
                + Registrar movimiento
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {error && <Alerta tipo="error">{error}</Alerta>}
          {ok && <Alerta tipo="ok">{ok}</Alerta>}

          {mostrarForm && (
            <FormMovimiento
              existencias={existencias ?? []}
              insumoInicialId={insumoForm}
              onCancel={() => {
                setMostrarForm(false)
                setInsumoForm(undefined)
              }}
              onSaved={() => {
                setMostrarForm(false)
                setInsumoForm(undefined)
                setOk('Movimiento registrado.')
                recargar()
              }}
            />
          )}

          <div className="flex gap-2 border-b border-linea">
            {(['existencias', 'movimientos'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVista(v)}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold capitalize transition ${
                  vista === v
                    ? 'border-brand text-brand'
                    : 'border-transparent text-texto-2 hover:text-grafito'
                }`}
              >
                {v === 'existencias' ? 'Existencias' : 'Movimientos'}
              </button>
            ))}
          </div>

          {vista === 'existencias' ? (
            <>
              <div className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar insumo…"
                  className={campo}
                />
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className={campo}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={soloBajoMinimo}
                    onChange={(e) => setSoloBajoMinimo(e.target.checked)}
                  />
                  Solo bajo mínimo
                </label>
              </div>

              {existencias === null ? (
                <Cargando />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="py-2 pr-4">Insumo</th>
                        <th className="py-2 pr-4">Categoría</th>
                        <th className="py-2 pr-4 text-right">Stock</th>
                        <th className="py-2 pr-4 text-right">Mínimo</th>
                        <th className="py-2 pr-4">Estado</th>
                        <th className="py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {existencias.map((e) => (
                        <tr key={e.id} className="border-b border-slate-100">
                          <td className="py-2 pr-4">
                            <span className="font-medium text-slate-700">{e.nombre}</span>
                            <span className="block text-xs text-slate-400">
                              {e.requiereFrio ? 'Requiere frío' : e.perecible ? 'Perecible' : 'No perecible'}
                            </span>
                          </td>
                          <td className="py-2 pr-4 text-slate-600">{e.categoria.nombre}</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-slate-700">
                            {cantidad(e.stockActual)}{' '}
                            <span className="text-xs text-slate-400">{e.unidadBaseCodigo}</span>
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums text-slate-500">
                            {e.stockMinimo > 0 ? cantidad(e.stockMinimo) : '—'}
                          </td>
                          <td className="py-2 pr-4">
                            {e.bajoMinimo ? (
                              <Etiqueta className="bg-atencion-suave text-atencion">Bajo mínimo</Etiqueta>
                            ) : (
                              <Etiqueta className="bg-exito-suave text-exito">OK</Etiqueta>
                            )}
                          </td>
                          <td className="py-2 text-right whitespace-nowrap">
                            <button
                              onClick={() => verMovimientosDe(e.id)}
                              className="text-sm font-medium text-slate-500 hover:text-brand hover:underline"
                            >
                              Kardex
                            </button>
                            {puedeEditar && (
                              <button
                                onClick={() => abrirForm(e.id)}
                                className="ml-3 text-sm font-medium text-brand hover:underline"
                              >
                                + Movimiento
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {existencias.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500">
                            No hay insumos que coincidan con el filtro.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
                <select
                  value={filtroInsumo}
                  onChange={(e) => setFiltroInsumo(e.target.value)}
                  className={campo}
                >
                  <option value="">Todos los insumos</option>
                  {(existencias ?? []).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className={campo}
                >
                  <option value="">Todos los tipos</option>
                  {TIPOS_MOVIMIENTO.map((t) => (
                    <option key={t} value={t}>
                      {TIPO_MOVIMIENTO_ETIQUETA[t]}
                    </option>
                  ))}
                </select>
              </div>

              {movimientos === null ? (
                <Cargando />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                      <tr className="border-b border-slate-200">
                        <th className="py-2 pr-4">Fecha</th>
                        <th className="py-2 pr-4">Insumo</th>
                        <th className="py-2 pr-4">Tipo</th>
                        <th className="py-2 pr-4">Motivo</th>
                        <th className="py-2 pr-4 text-right">Cantidad</th>
                        <th className="py-2 pr-4 text-right">Saldo</th>
                        <th className="py-2 pr-4">Evento</th>
                        <th className="py-2 pr-4">Registró</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movimientos.map((m) => {
                        const c = Number(m.cantidad)
                        return (
                          <tr key={m.id} className="border-b border-slate-100">
                            <td className="py-2 pr-4 whitespace-nowrap text-slate-500">
                              {fechaCorta(m.fechaHora)}
                              <span className="block text-xs text-slate-400">
                                {new Date(m.fechaHora).toLocaleTimeString('es-BO', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>
                            <td className="py-2 pr-4 text-slate-700">
                              {m.insumo?.nombre ?? '—'}
                              <span className="block text-xs text-slate-400">
                                {m.insumo?.categoria?.nombre}
                              </span>
                            </td>
                            <td className="py-2 pr-4">
                              <Etiqueta className={TIPO_MOVIMIENTO_COLOR[m.tipo]}>
                                {TIPO_MOVIMIENTO_ETIQUETA[m.tipo]}
                              </Etiqueta>
                            </td>
                            <td className="py-2 pr-4 text-slate-600">{MOTIVO_ETIQUETA[m.motivo]}</td>
                            <td
                              className={`py-2 pr-4 text-right tabular-nums font-semibold ${
                                c > 0 ? 'text-exito' : 'text-brand'
                              }`}
                            >
                              {cantidadConSigno(c)}{' '}
                              <span className="text-xs font-normal text-slate-400">
                                {m.insumo?.unidadBaseCodigo}
                              </span>
                              {m.observacion && (
                                <span className="block text-xs font-normal text-slate-400">
                                  {m.observacion}
                                </span>
                              )}
                            </td>
                            <td className="py-2 pr-4 text-right tabular-nums text-slate-600">
                              {cantidad(m.saldo)}{' '}
                              <span className="text-xs text-slate-400">
                                {m.insumo?.unidadBaseCodigo}
                              </span>
                            </td>
                            <td className="py-2 pr-4 text-slate-500">{m.contrato?.codigo ?? '—'}</td>
                            <td className="py-2 pr-4 text-slate-500">{m.registradoPor?.nombre ?? '—'}</td>
                          </tr>
                        )
                      })}
                      {movimientos.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-slate-500">
                            No hay movimientos que coincidan con el filtro.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          <p className="text-xs text-slate-400">
            <span className={etiquetaTipo}>Nota</span> El stock de cada insumo es la suma de sus
            movimientos. Las entradas por compra y las salidas por entrega a cocina se generarán
            automáticamente al habilitarse esos módulos; aquí se registran mermas, vencimientos,
            conteos físicos y ajustes.
          </p>
        </div>
      </Tarjeta>
    </div>
  )
}

function Kpi({
  etiqueta,
  valor,
  alerta = false,
}: {
  etiqueta: string
  valor: number | string
  alerta?: boolean
}) {
  return (
    <div className="rounded-xl border border-linea bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-texto-2">{etiqueta}</p>
      <p
        className={`mt-1 font-title text-3xl font-semibold ${
          alerta ? 'text-kallpa-700' : 'text-grafito'
        }`}
      >
        {valor}
      </p>
    </div>
  )
}
