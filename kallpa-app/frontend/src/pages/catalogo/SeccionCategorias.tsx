import { useCallback, useEffect, useState } from 'react'
import { CategoriasApi } from '../../lib/api'
import { botonPrimario, botonSecundario, campo } from '../../lib/catalogo'
import type { CategoriaInsumo } from '../../types'
import { Alerta, Cargando, Tarjeta } from '../../components/ui'

function CategoriaForm({
  inicial,
  onCancel,
  onSaved,
}: {
  inicial: CategoriaInsumo | null
  onCancel: () => void
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [orden, setOrden] = useState(String(inicial?.orden ?? 0))
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const guardar = async () => {
    setError('')
    if (!nombre.trim()) return setError('El nombre es obligatorio.')
    setEnviando(true)
    try {
      const body = { nombre: nombre.trim(), orden: Number(orden) || 0 }
      if (inicial) await CategoriasApi.actualizar(inicial.id, body)
      else await CategoriasApi.crear(body)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la categoría.')
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
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Nombre
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={`mt-1 ${campo}`}
            placeholder="Carnes y aves"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Orden
          <input
            type="number"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className={`mt-1 ${campo}`}
          />
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

export function SeccionCategorias({ puedeEditar }: { puedeEditar: boolean }) {
  const [categorias, setCategorias] = useState<CategoriaInsumo[] | null>(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<CategoriaInsumo | null>(null)

  const cargar = useCallback(async () => {
    try {
      setCategorias(await CategoriasApi.listar())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las categorías.')
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

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
      titulo="Categorías de insumos"
      acciones={
        puedeEditar && !mostrarForm && !editando ? (
          <button onClick={() => setMostrarForm(true)} className={botonPrimario}>
            + Nueva categoría
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {error && <Alerta tipo="error">{error}</Alerta>}
        {ok && <Alerta tipo="ok">{ok}</Alerta>}

        {(mostrarForm || editando) && (
          <CategoriaForm
            inicial={editando}
            onCancel={cerrar}
            onSaved={() => exito(editando ? 'Categoría actualizada.' : 'Categoría creada.')}
          />
        )}

        {categorias === null ? (
          <Cargando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4">Orden</th>
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Insumos</th>
                  {puedeEditar && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {categorias.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 tabular-nums text-slate-500">{c.orden}</td>
                    <td className="py-2 pr-4 font-medium text-slate-700">{c.nombre}</td>
                    <td className="py-2 pr-4 tabular-nums">{c._count?.insumos ?? '—'}</td>
                    {puedeEditar && (
                      <td className="py-2 text-right">
                        <button
                          onClick={() => {
                            setMostrarForm(false)
                            setEditando(c)
                          }}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {categorias.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      Sin categorías registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Tarjeta>
  )
}
