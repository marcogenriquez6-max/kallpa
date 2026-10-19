import { useCallback, useEffect, useState } from 'react'
import { CategoriasApi, InsumosApi, UnidadesApi } from '../../lib/api'
import type { DatosInsumo } from '../../lib/api'
import { botonPrimario, botonSecundario, campo, etiquetaTipo } from '../../lib/catalogo'
import type { CategoriaInsumo, Insumo, UnidadMedida } from '../../types'
import { Alerta, Cargando, Etiqueta, Tarjeta } from '../../components/ui'

function InsumoForm({
  inicial,
  categorias,
  unidades,
  onCancel,
  onSaved,
}: {
  inicial: Insumo | null
  categorias: CategoriaInsumo[]
  unidades: UnidadMedida[]
  onCancel: () => void
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [categoriaId, setCategoriaId] = useState(String(inicial?.categoriaId ?? categorias[0]?.id ?? ''))
  const [unidadBase, setUnidadBase] = useState(inicial?.unidadBaseCodigo ?? '')
  const [unidadCompra, setUnidadCompra] = useState(inicial?.unidadCompraCodigo ?? '')
  const [peso, setPeso] = useState(inicial?.pesoUnitarioGramos ?? '')
  const [especificacion, setEspecificacion] = useState(inicial?.especificacionHabitual ?? '')
  const [marca, setMarca] = useState(inicial?.marcaPreferida ?? '')
  const [perecible, setPerecible] = useState(inicial?.perecible ?? false)
  const [requiereFrio, setRequiereFrio] = useState(inicial?.requiereFrio ?? false)
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const guardar = async () => {
    setError('')
    if (!nombre.trim()) return setError('El nombre es obligatorio.')
    if (!categoriaId) return setError('Selecciona una categoría.')
    if (!unidadBase) return setError('Selecciona la unidad base.')
    setEnviando(true)
    try {
      const body: DatosInsumo = {
        nombre: nombre.trim(),
        categoriaId: Number(categoriaId),
        unidadBaseCodigo: unidadBase,
        unidadCompraCodigo: unidadCompra || undefined,
        pesoUnitarioGramos: peso === '' ? undefined : Number(peso),
        especificacionHabitual: especificacion.trim() || undefined,
        marcaPreferida: marca.trim() || undefined,
        perecible,
        requiereFrio,
        activo,
      }
      if (inicial) await InsumosApi.actualizar(inicial.id, body)
      else await InsumosApi.crear(body)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el insumo.')
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
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Nombre
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={`mt-1 ${campo}`} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Categoría
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className={`mt-1 ${campo}`}
          >
            <option value="">Selecciona…</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Unidad base
          <select
            value={unidadBase}
            onChange={(e) => setUnidadBase(e.target.value)}
            className={`mt-1 ${campo}`}
          >
            <option value="">Selecciona…</option>
            {unidades.map((u) => (
              <option key={u.codigo} value={u.codigo}>
                {u.codigo} — {u.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Unidad de compra (opcional)
          <select
            value={unidadCompra}
            onChange={(e) => setUnidadCompra(e.target.value)}
            className={`mt-1 ${campo}`}
          >
            <option value="">—</option>
            {unidades.map((u) => (
              <option key={u.codigo} value={u.codigo}>
                {u.codigo} — {u.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Peso unitario (g)
          <input
            type="number"
            min={0}
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className={`mt-1 ${campo}`}
            placeholder="opcional"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Marca preferida
          <input value={marca} onChange={(e) => setMarca(e.target.value)} className={`mt-1 ${campo}`} />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Especificación habitual
          <input
            value={especificacion}
            onChange={(e) => setEspecificacion(e.target.value)}
            className={`mt-1 ${campo}`}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={perecible} onChange={(e) => setPerecible(e.target.checked)} />
          Perecible
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={requiereFrio}
            onChange={(e) => setRequiereFrio(e.target.checked)}
          />
          Requiere frío
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Activo
        </label>
      </div>
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

export function SeccionInsumos({ puedeEditar }: { puedeEditar: boolean }) {
  const [insumos, setInsumos] = useState<Insumo[] | null>(null)
  const [categorias, setCategorias] = useState<CategoriaInsumo[]>([])
  const [unidades, setUnidades] = useState<UnidadMedida[]>([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Insumo | null>(null)

  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('true')
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    try {
      setInsumos(
        await InsumosApi.listar({
          categoriaId: filtroCategoria ? Number(filtroCategoria) : undefined,
          activo: filtroActivo === '' ? undefined : filtroActivo === 'true',
          q: busqueda.trim() || undefined,
        }),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los insumos.')
    }
  }, [filtroCategoria, filtroActivo, busqueda])

  const cargarCatalogos = useCallback(async () => {
    try {
      const [cs, us] = await Promise.all([CategoriasApi.listar(), UnidadesApi.listar()])
      setCategorias(cs)
      setUnidades(us)
    } catch {
      /* el formulario mostrará listas vacías */
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    void cargarCatalogos()
  }, [cargarCatalogos])

  const cerrar = () => {
    setMostrarForm(false)
    setEditando(null)
  }

  const exito = (mensaje: string) => {
    setOk(mensaje)
    cerrar()
    void cargar()
  }

  return (
    <Tarjeta
      titulo="Insumos"
      acciones={
        puedeEditar && !mostrarForm && !editando ? (
          <button onClick={() => setMostrarForm(true)} className={botonPrimario}>
            + Nuevo insumo
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {error && <Alerta tipo="error">{error}</Alerta>}
        {ok && <Alerta tipo="ok">{ok}</Alerta>}

        {(mostrarForm || editando) && (
          <InsumoForm
            inicial={editando}
            categorias={categorias}
            unidades={unidades}
            onCancel={cerrar}
            onSaved={() => exito(editando ? 'Insumo actualizado.' : 'Insumo creado.')}
          />
        )}

        <div className="grid gap-2 sm:grid-cols-4">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre…"
            className={`sm:col-span-2 ${campo}`}
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
          <select value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)} className={campo}>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
            <option value="">Todos</option>
          </select>
        </div>

        {insumos === null ? (
          <Cargando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4">Insumo</th>
                  <th className="py-2 pr-4">Categoría</th>
                  <th className="py-2 pr-4">Unidad</th>
                  <th className="py-2 pr-4">Flags</th>
                  {puedeEditar && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {insumos.map((i) => (
                  <tr key={i.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">
                      <span className="font-medium text-slate-700">{i.nombre}</span>
                      {!i.activo && (
                        <span className="ml-2 text-xs font-medium text-slate-400">(inactivo)</span>
                      )}
                      {i.marcaPreferida && (
                        <span className="block text-xs text-slate-400">{i.marcaPreferida}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">{i.categoria?.nombre ?? '—'}</td>
                    <td className="py-2 pr-4 font-mono text-slate-600">
                      {i.unidadBaseCodigo}
                      {i.unidadCompraCodigo ? ` / ${i.unidadCompraCodigo}` : ''}
                    </td>
                    <td className="py-2 pr-4">
                      <span className="flex flex-wrap gap-1">
                        {i.perecible && <Etiqueta className="bg-amber-100 text-amber-700">Perecible</Etiqueta>}
                        {i.requiereFrio && (
                          <Etiqueta className="bg-sky-100 text-sky-700">Frío</Etiqueta>
                        )}
                        {!i.activo && (
                          <Etiqueta className="bg-slate-200 text-slate-600">Inactivo</Etiqueta>
                        )}
                      </span>
                    </td>
                    {puedeEditar && (
                      <td className="py-2 text-right">
                        <button
                          onClick={() => {
                            setMostrarForm(false)
                            setEditando(i)
                          }}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {insumos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No hay insumos que coincidan con el filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <p className={`text-xs text-slate-400`}>
          <span className={etiquetaTipo}>Tip</span> Los precios de compra se registran por proveedor
          en el módulo de compras.
        </p>
      </div>
    </Tarjeta>
  )
}
