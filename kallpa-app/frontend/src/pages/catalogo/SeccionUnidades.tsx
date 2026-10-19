import { useCallback, useEffect, useState } from 'react'
import { UnidadesApi } from '../../lib/api'
import type { DatosUnidad } from '../../lib/api'
import {
  TIPOS_UNIDAD,
  TIPO_UNIDAD_ETIQUETA,
  botonPrimario,
  botonSecundario,
  campo,
} from '../../lib/catalogo'
import type { TipoUnidad, UnidadMedida } from '../../types'
import { Alerta, Cargando, Tarjeta } from '../../components/ui'

function UnidadForm({
  inicial,
  onCancel,
  onSaved,
}: {
  inicial: UnidadMedida | null
  onCancel: () => void
  onSaved: () => void
}) {
  const [codigo, setCodigo] = useState(inicial?.codigo ?? '')
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [tipo, setTipo] = useState<TipoUnidad>(inicial?.tipo ?? 'MASA')
  const [factor, setFactor] = useState(inicial?.factorBase ?? '1')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const guardar = async () => {
    setError('')
    if (!codigo.trim() || !nombre.trim()) return setError('Código y nombre son obligatorios.')
    setEnviando(true)
    try {
      const body: DatosUnidad = { nombre: nombre.trim(), tipo, factorBase: Number(factor) }
      if (!inicial) body.codigo = codigo.trim().toUpperCase()
      if (inicial) await UnidadesApi.actualizar(inicial.codigo, body)
      else await UnidadesApi.crear(body)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la unidad.')
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
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="text-sm font-medium text-slate-700">
          Código
          <input
            value={codigo}
            disabled={!!inicial}
            onChange={(e) => setCodigo(e.target.value)}
            className={`mt-1 ${campo} disabled:bg-slate-100`}
            placeholder="kg"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Nombre
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={`mt-1 ${campo}`}
            placeholder="Kilogramo"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Tipo
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoUnidad)}
            className={`mt-1 ${campo}`}
          >
            {TIPOS_UNIDAD.map((t) => (
              <option key={t} value={t}>
                {TIPO_UNIDAD_ETIQUETA[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Factor a base
          <input
            type="number"
            min={0}
            step="0.000001"
            value={factor}
            onChange={(e) => setFactor(e.target.value)}
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

export function SeccionUnidades({ puedeEditar }: { puedeEditar: boolean }) {
  const [unidades, setUnidades] = useState<UnidadMedida[] | null>(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<UnidadMedida | null>(null)

  const cargar = useCallback(async () => {
    try {
      setUnidades(await UnidadesApi.listar())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las unidades.')
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
      titulo="Unidades de medida"
      acciones={
        puedeEditar && !mostrarForm && !editando ? (
          <button onClick={() => setMostrarForm(true)} className={botonPrimario}>
            + Nueva unidad
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {error && <Alerta tipo="error">{error}</Alerta>}
        {ok && <Alerta tipo="ok">{ok}</Alerta>}

        {(mostrarForm || editando) && (
          <UnidadForm
            inicial={editando}
            onCancel={cerrar}
            onSaved={() => exito(editando ? 'Unidad actualizada.' : 'Unidad creada.')}
          />
        )}

        <p className="text-xs text-slate-500">
          El «factor a base» indica cuántas unidades base contiene (ej.: 1 kg = 1000 g).
        </p>

        {unidades === null ? (
          <Cargando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Factor</th>
                  {puedeEditar && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {unidades.map((u) => (
                  <tr key={u.codigo} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-mono text-slate-700">{u.codigo}</td>
                    <td className="py-2 pr-4">{u.nombre}</td>
                    <td className="py-2 pr-4">{TIPO_UNIDAD_ETIQUETA[u.tipo]}</td>
                    <td className="py-2 pr-4 tabular-nums">{u.factorBase}</td>
                    {puedeEditar && (
                      <td className="py-2 text-right">
                        <button
                          onClick={() => {
                            setMostrarForm(false)
                            setEditando(u)
                          }}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {unidades.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Sin unidades registradas.
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
