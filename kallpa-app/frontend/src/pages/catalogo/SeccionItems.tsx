import { useCallback, useEffect, useState } from 'react'
import { CatalogoApi, InsumosApi, UnidadesApi } from '../../lib/api'
import type { DatosItem } from '../../lib/api'
import {
  LINEAS,
  LINEA_ETIQUETA,
  TIPOS_ITEM,
  TIPO_ITEM_ETIQUETA,
  aBs,
  botonPrimario,
  botonSecundario,
  campo,
} from '../../lib/catalogo'
import type {
  CostoFicha,
  FichaTecnica,
  Insumo,
  ItemCatalogo,
  LineaCatalogo,
  TipoItemCatalogo,
  UnidadMedida,
} from '../../types'
import { Alerta, Cargando, Etiqueta, Tarjeta } from '../../components/ui'
import { FichaEditor } from './FichaEditor'

function ItemForm({
  inicial,
  onCancel,
  onSaved,
}: {
  inicial: ItemCatalogo | null
  onCancel: () => void
  onSaved: () => void
}) {
  const [codigo, setCodigo] = useState(inicial?.codigo ?? '')
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '')
  const [tipo, setTipo] = useState<TipoItemCatalogo>(inicial?.tipo ?? 'PLATO_FONDO')
  const [linea, setLinea] = useState<LineaCatalogo | ''>(inicial?.linea ?? '')
  const [precio, setPrecio] = useState(inicial?.precioVenta ?? '0')
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const guardar = async () => {
    setError('')
    if (!codigo.trim() || !nombre.trim()) return setError('Código y nombre son obligatorios.')
    setEnviando(true)
    try {
      const body: DatosItem = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        tipo,
        linea: linea || undefined,
        precioVenta: Number(precio) || 0,
        activo,
      }
      if (inicial) await CatalogoApi.actualizarItem(inicial.id, body)
      else await CatalogoApi.crearItem({ ...body, codigo: codigo.trim().toUpperCase() })
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el ítem.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="rounded-xl border border-brand/30 bg-brand-100/30 p-4">
      {error && (
        <div className="mb-3">
          <Alerta tipo="error">{error}</Alerta>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Código
          <input
            value={codigo}
            disabled={!!inicial}
            onChange={(e) => setCodigo(e.target.value)}
            className={`mt-1 ${campo} disabled:bg-slate-100`}
            placeholder="P-001"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={`mt-1 ${campo}`} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Tipo
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoItemCatalogo)}
            className={`mt-1 ${campo}`}
          >
            {TIPOS_ITEM.map((t) => (
              <option key={t} value={t}>
                {TIPO_ITEM_ETIQUETA[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Línea (opcional)
          <select
            value={linea}
            onChange={(e) => setLinea(e.target.value as LineaCatalogo | '')}
            className={`mt-1 ${campo}`}
          >
            <option value="">—</option>
            {LINEAS.map((l) => (
              <option key={l} value={l}>
                {LINEA_ETIQUETA[l]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Precio de venta (Bs)
          <input
            type="number"
            min={0}
            step="0.01"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className={`mt-1 ${campo}`}
          />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-3">
          Descripción
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className={`mt-1 ${campo}`}
            placeholder="opcional"
          />
        </label>
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        Activo
      </label>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={botonSecundario} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" onClick={guardar} className={botonPrimario} disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

export function SeccionItems({ puedeEditar }: { puedeEditar: boolean }) {
  const [items, setItems] = useState<ItemCatalogo[] | null>(null)
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [unidades, setUnidades] = useState<UnidadMedida[]>([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<ItemCatalogo | null>(null)

  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroLinea, setFiltroLinea] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [seleccionado, setSeleccionado] = useState<ItemCatalogo | null>(null)
  const [fichas, setFichas] = useState<FichaTecnica[] | null>(null)
  const [fichaVista, setFichaVista] = useState<FichaTecnica | null>(null)
  const [costo, setCosto] = useState<CostoFicha | null>(null)
  const [editor, setEditor] = useState<{ base: FichaTecnica | null } | null>(null)

  const cargar = useCallback(async () => {
    try {
      setItems(
        await CatalogoApi.listarItems({
          tipo: (filtroTipo || undefined) as TipoItemCatalogo | undefined,
          linea: (filtroLinea || undefined) as LineaCatalogo | undefined,
          q: busqueda.trim() || undefined,
        }),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los ítems.')
    }
  }, [filtroTipo, filtroLinea, busqueda])

  const cargarCatalogos = useCallback(async () => {
    try {
      const [ins, uns] = await Promise.all([InsumosApi.listar({ activo: true }), UnidadesApi.listar()])
      setInsumos(ins)
      setUnidades(uns)
    } catch {
      /* el editor lo indicará */
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    void cargarCatalogos()
  }, [cargarCatalogos])

  const cerrarForm = () => {
    setMostrarForm(false)
    setEditando(null)
  }

  const verFicha = useCallback(async (id: string) => {
    try {
      const f = await CatalogoApi.obtenerFicha(id)
      setFichaVista(f)
      try {
        setCosto(await CatalogoApi.costoFicha(id))
      } catch {
        setCosto(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la ficha.')
    }
  }, [])

  const seleccionarItem = useCallback(
    async (item: ItemCatalogo) => {
      setSeleccionado(item)
      setEditor(null)
      setCosto(null)
      setFichaVista(null)
      setFichas(null)
      try {
        const fs = await CatalogoApi.listarFichas(item.id)
        setFichas(fs)
        if (fs.length) void verFicha(fs[0].id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudieron cargar las fichas.')
      }
    },
    [verFicha],
  )

  const recargarFichas = useCallback(async () => {
    if (!seleccionado) return
    try {
      const fs = await CatalogoApi.listarFichas(seleccionado.id)
      setFichas(fs)
      if (fs.length) void verFicha(fs[0].id)
      else {
        setFichaVista(null)
        setCosto(null)
      }
    } catch {
      /* silencioso */
    }
  }, [seleccionado, verFicha])

  const exitoItem = (mensaje: string) => {
    setOk(mensaje)
    cerrarForm()
    void cargar()
  }

  const fichaGuardada = () => {
    setEditor(null)
    setOk('Ficha guardada como versión vigente.')
    void cargar()
    void recargarFichas()
  }

  const abrirNuevaFicha = () => {
    if (insumos.length === 0) {
      setError('Crea al menos un insumo antes de definir una ficha técnica.')
      return
    }
    setOk('')
    setEditor({ base: null })
  }

  return (
    <div className="space-y-5">
      <Tarjeta
        titulo="Ítems del catálogo"
        acciones={
          puedeEditar && !mostrarForm && !editando ? (
            <button onClick={() => setMostrarForm(true)} className={botonPrimario}>
              + Nuevo ítem
            </button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          {error && <Alerta tipo="error">{error}</Alerta>}
          {ok && <Alerta tipo="ok">{ok}</Alerta>}

          {(mostrarForm || editando) && (
            <ItemForm
              inicial={editando}
              onCancel={cerrarForm}
              onSaved={() => exitoItem(editando ? 'Ítem actualizado.' : 'Ítem creado.')}
            />
          )}

          <div className="grid gap-2 sm:grid-cols-4">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o código…"
              className={`sm:col-span-2 ${campo}`}
            />
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={campo}>
              <option value="">Todos los tipos</option>
              {TIPOS_ITEM.map((t) => (
                <option key={t} value={t}>
                  {TIPO_ITEM_ETIQUETA[t]}
                </option>
              ))}
            </select>
            <select
              value={filtroLinea}
              onChange={(e) => setFiltroLinea(e.target.value)}
              className={campo}
            >
              <option value="">Todas las líneas</option>
              {LINEAS.map((l) => (
                <option key={l} value={l}>
                  {LINEA_ETIQUETA[l]}
                </option>
              ))}
            </select>
          </div>

          {items === null ? (
            <Cargando />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-4">Código</th>
                    <th className="py-2 pr-4">Ítem</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4 text-right">Precio</th>
                    <th className="py-2 pr-4">Ficha</th>
                    {puedeEditar && <th className="py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr
                      key={it.id}
                      className={`border-b border-slate-100 ${
                        seleccionado?.id === it.id ? 'bg-brand-100/40' : ''
                      }`}
                    >
                      <td className="py-2 pr-4 font-mono text-slate-600">{it.codigo}</td>
                      <td className="py-2 pr-4">
                        <button
                          onClick={() => void seleccionarItem(it)}
                          className="font-medium text-slate-800 hover:text-brand hover:underline"
                        >
                          {it.nombre}
                        </button>
                      </td>
                      <td className="py-2 pr-4">
                        <span className="text-slate-600">{TIPO_ITEM_ETIQUETA[it.tipo]}</span>
                        {it.linea && (
                          <span className="ml-2 text-xs text-slate-400">{LINEA_ETIQUETA[it.linea]}</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">{aBs(Number(it.precioVenta))}</td>
                      <td className="py-2 pr-4">
                        {it.fichaVigente ? (
                          <Etiqueta className="bg-emerald-100 text-emerald-700">
                            v{it.fichaVigente.version}
                          </Etiqueta>
                        ) : (
                          <Etiqueta className="bg-slate-100 text-slate-500">sin ficha</Etiqueta>
                        )}
                      </td>
                      {puedeEditar && (
                        <td className="py-2 text-right">
                          <button
                            onClick={() => {
                              setMostrarForm(false)
                              setEditando(it)
                            }}
                            className="text-sm font-medium text-brand hover:underline"
                          >
                            Editar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No hay ítems que coincidan con el filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Tarjeta>

      {seleccionado && (
        <Tarjeta
          titulo={`Ficha técnica · ${seleccionado.codigo} — ${seleccionado.nombre}`}
          acciones={
            puedeEditar && !editor ? (
              <button type="button" onClick={abrirNuevaFicha} className={botonPrimario}>
                + Nueva versión
              </button>
            ) : undefined
          }
        >
          <div className="space-y-4">
            {editor && (
              <FichaEditor
                item={seleccionado}
                base={editor.base}
                insumos={insumos}
                unidades={unidades}
                onCancel={() => setEditor(null)}
                onSaved={fichaGuardada}
              />
            )}

            {fichas === null ? (
              <Cargando />
            ) : fichas.length === 0 ? (
              <p className="py-4 text-center text-slate-500">
                Este ítem todavía no tiene ficha técnica.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <div className="space-y-1">
                  {fichas.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => void verFicha(f.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                        fichaVista?.id === f.id ? 'bg-brand text-white' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <span>Versión {f.version}</span>
                      {f.vigente && (
                        <span
                          className={`text-xs ${
                            fichaVista?.id === f.id ? 'text-white/80' : 'text-emerald-600'
                          }`}
                        >
                          vigente
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {fichaVista && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                          <tr className="border-b border-slate-200">
                            <th className="py-2 pr-4">Insumo</th>
                            <th className="py-2 pr-4 text-right">Cantidad</th>
                            <th className="py-2 pr-4">Unidad</th>
                            <th className="py-2 pr-4 text-right">Merma</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(fichaVista.lineas ?? []).map((l) => (
                            <tr key={l.id} className="border-b border-slate-100">
                              <td className="py-2 pr-4">
                                {l.insumo?.nombre ?? '—'}
                                {l.aCriterio && (
                                  <span className="ml-2 text-xs text-amber-600">a criterio</span>
                                )}
                                {l.especificacion && (
                                  <span className="block text-xs text-slate-400">{l.especificacion}</span>
                                )}
                              </td>
                              <td className="py-2 pr-4 text-right tabular-nums">
                                {l.aCriterio ? 'a criterio' : aBs(Number(l.cantidadPorPorcion))}
                              </td>
                              <td className="py-2 pr-4 font-mono text-slate-600">{l.unidadCodigo}</td>
                              <td className="py-2 pr-4 text-right tabular-nums text-slate-500">
                                {Number(l.porcentajeMerma) > 0 ? `${l.porcentajeMerma}%` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {(fichaVista.porcionGramos || fichaVista.procedimiento) && (
                      <p className="text-xs text-slate-500">
                        {fichaVista.porcionGramos && <>Porción: <strong>{fichaVista.porcionGramos} g</strong>. </>}
                        {fichaVista.procedimiento}
                      </p>
                    )}

                    {costo ? (
                      <div className="rounded-xl border border-slate-200 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-700">
                            Costeo de la versión {costo.version}
                          </h4>
                          {!costo.completo && (
                            <Etiqueta className="bg-amber-100 text-amber-700">
                              faltan precios
                            </Etiqueta>
                          )}
                        </div>
                        <table className="w-full text-sm">
                          <tbody>
                            {costo.detalle.map((d) => (
                              <tr key={d.insumoId} className="border-b border-slate-100">
                                <td className="py-1 pr-4">{d.insumo}</td>
                                <td className="py-1 pr-4 text-right tabular-nums text-slate-500">
                                  {d.cantidad === null ? '—' : `${d.cantidad} ${d.unidad}`}
                                </td>
                                <td className="py-1 text-right tabular-nums">
                                  {d.costo === null ? (
                                    <span className="text-amber-600">{d.motivo ?? 'sin precio'}</span>
                                  ) : (
                                    `Bs ${aBs(d.costo)}`
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                          <div>
                            <p className="text-xs text-slate-500">Costo porción</p>
                            <p className="font-semibold tabular-nums">Bs {aBs(costo.costoPorcion)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Precio venta</p>
                            <p className="font-semibold tabular-nums">Bs {aBs(costo.precioVenta)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Margen</p>
                            <p className="font-semibold tabular-nums">Bs {aBs(costo.margen)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Margen %</p>
                            <p className="font-semibold tabular-nums">
                              {costo.margenPorcentaje === null ? '—' : `${costo.margenPorcentaje}%`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">No se pudo calcular el costeo de esta versión.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Tarjeta>
      )}
    </div>
  )
}
