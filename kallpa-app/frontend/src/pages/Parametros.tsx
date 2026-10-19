import { useCallback, useEffect, useState } from 'react'
import { ParametrosApi } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Parametro } from '../types'
import { Alerta, Cargando, Tarjeta } from '../components/ui'

export function Parametros() {
  const { usuario } = useAuth()
  const puedeEditar = usuario?.rol === 'GERENTE'
  const [lista, setLista] = useState<Parametro[] | null>(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const cargar = useCallback(async () => {
    setError('')
    try {
      setLista(await ParametrosApi.listar())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar los parámetros.')
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const guardar = async (clave: string, valor: number) => {
    setError('')
    setOk('')
    try {
      await ParametrosApi.actualizar(clave, valor)
      setOk(`Parámetro «${clave}» actualizado.`)
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.')
    }
  }

  return (
    <div className="space-y-5">
      {error && <Alerta tipo="error">{error}</Alerta>}
      {ok && <Alerta tipo="ok">{ok}</Alerta>}
      <Tarjeta titulo="Parámetros de negocio">
        <p className="mb-4 text-sm text-slate-500">
          Valores numéricos que usa el sistema (márgenes, costos, límites).{' '}
          {puedeEditar ? null : (
            <span className="font-medium text-amber-700">Solo lectura para tu rol.</span>
          )}
        </p>
        {lista ? (
          lista.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No hay parámetros definidos.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lista.map((p) => (
                <FilaParametro
                  key={p.clave}
                  p={p}
                  editable={puedeEditar}
                  onGuardar={(v) => guardar(p.clave, v)}
                />
              ))}
            </ul>
          )
        ) : (
          <Cargando />
        )}
      </Tarjeta>
    </div>
  )
}

function FilaParametro({
  p,
  editable,
  onGuardar,
}: {
  p: Parametro
  editable: boolean
  onGuardar: (valor: number) => void | Promise<void>
}) {
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(p.valor)
  const [enviando, setEnviando] = useState(false)

  const guardar = async () => {
    const n = Number(valor.replace(',', '.'))
    if (Number.isNaN(n)) return
    setEnviando(true)
    await onGuardar(n)
    setEnviando(false)
    setEditando(false)
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className="font-mono text-sm font-medium text-slate-800">{p.clave}</p>
        {p.descripcion && <p className="text-xs text-slate-500">{p.descripcion}</p>}
      </div>
      {editando ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && guardar()}
            className="w-28 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-brand"
          />
          <button
            onClick={guardar}
            disabled={enviando}
            className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {enviando ? '…' : 'Guardar'}
          </button>
          <button
            onClick={() => {
              setValor(p.valor)
              setEditando(false)
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-sm text-slate-800">
            {p.valor}
          </span>
          {editable && (
            <button
              onClick={() => setEditando(true)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-brand hover:text-brand"
            >
              Editar
            </button>
          )}
        </div>
      )}
    </li>
  )
}
