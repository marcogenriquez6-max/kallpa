import { useCallback, useEffect, useState } from 'react'
import { BitacoraApi } from '../lib/api'
import type { BitacoraEntrada } from '../types'
import { Alerta, Cargando, Etiqueta, Tarjeta } from '../components/ui'
import { etiquetaRol } from '../lib/roles'

const LIMITES = [25, 50, 100, 200]

function fecha(v: string): string {
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' })
}

export function Bitacora() {
  const [items, setItems] = useState<BitacoraEntrada[] | null>(null)
  const [error, setError] = useState('')
  const [entidad, setEntidad] = useState('')
  const [entidadId, setEntidadId] = useState('')
  const [limite, setLimite] = useState(50)

  const cargar = useCallback(async () => {
    setError('')
    setItems(null)
    try {
      setItems(
        await BitacoraApi.listar({
          entidad: entidad.trim() || undefined,
          entidadId: entidadId.trim() || undefined,
          limite,
        }),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la bitácora.')
    }
  }, [entidad, entidadId, limite])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return (
    <div className="space-y-5">
      {error && <Alerta tipo="error">{error}</Alerta>}

      <Tarjeta titulo="Historial de cambios">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium text-slate-700">
            Entidad
            <input
              value={entidad}
              onChange={(e) => setEntidad(e.target.value)}
              placeholder="usuario, parametro…"
              className="mt-1.5 block w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            ID de entidad
            <input
              value={entidadId}
              onChange={(e) => setEntidadId(e.target.value)}
              placeholder="opcional"
              className="mt-1.5 block w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Mostrar
            <select
              value={limite}
              onChange={(e) => setLimite(Number(e.target.value))}
              className="mt-1.5 block rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              {LIMITES.map((n) => (
                <option key={n} value={n}>
                  {n} registros
                </option>
              ))}
            </select>
          </label>
        </div>

        {!items ? (
          <Cargando />
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Sin registros para este filtro.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((it) => (
              <li key={it.id} className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Etiqueta className="bg-brand/10 text-brand">{it.accion}</Etiqueta>
                  <span className="font-mono text-xs text-slate-500">
                    {it.entidad}
                    {it.entidadId ? `#${it.entidadId}` : ''}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">{fecha(it.fechaHora)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {it.usuario ? `${it.usuario.nombre} · ${etiquetaRol(it.usuario.rol)}` : '—'}
                </p>
                {(it.estadoAnterior || it.estadoNuevo) && (
                  <p className="mt-1 text-sm text-slate-600">
                    {it.estadoAnterior && <code className="text-slate-500">{it.estadoAnterior}</code>}
                    {it.estadoAnterior && it.estadoNuevo && <span className="mx-2 text-slate-400">→</span>}
                    {it.estadoNuevo && <code className="text-slate-800">{it.estadoNuevo}</code>}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </div>
  )
}
