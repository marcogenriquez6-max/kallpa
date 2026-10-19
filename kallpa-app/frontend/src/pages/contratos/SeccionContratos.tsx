import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ContratosApi } from '../../lib/api'
import { aBs, botonPrimario, campo } from '../../lib/catalogo'
import { ESTADOS_CONTRATO, ESTADO_COLOR, ESTADO_ETIQUETA, fechaCorta } from '../../lib/contratos'
import type { Contrato, EstadoContrato } from '../../types'
import { Alerta, Cargando, Etiqueta, Tarjeta } from '../../components/ui'

function abonado(c: Contrato): number {
  return (c.pagos ?? []).reduce(
    (s, p) => s + (p.tipo === 'DEVOLUCION' ? -Number(p.monto) : Number(p.monto)),
    0,
  )
}

export function SeccionContratos({ puedeEditar }: { puedeEditar: boolean }) {
  const navegar = useNavigate()
  const [contratos, setContratos] = useState<Contrato[] | null>(null)
  const [error, setError] = useState('')
  const [estado, setEstado] = useState<EstadoContrato | ''>('')
  const [q, setQ] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const cargar = useCallback(async () => {
    setError('')
    try {
      setContratos(
        await ContratosApi.listar({
          estado: estado || undefined,
          q: q.trim() || undefined,
          desde: desde || undefined,
          hasta: hasta || undefined,
        }),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los contratos.')
    }
  }, [estado, q, desde, hasta])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return (
    <Tarjeta
      titulo="Contratos de eventos"
      acciones={
        puedeEditar ? (
          <button onClick={() => navegar('/contratos/nuevo')} className={botonPrimario}>
            + Nuevo contrato
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {error && <Alerta tipo="error">{error}</Alerta>}

        <div className="grid gap-2 sm:grid-cols-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por código, lugar o cliente…"
            className={`sm:col-span-2 ${campo}`}
          />
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoContrato | '')}
            className={campo}
          >
            <option value="">Todos los estados</option>
            {ESTADOS_CONTRATO.map((e) => (
              <option key={e} value={e}>
                {ESTADO_ETIQUETA[e]}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className={campo}
              title="Desde"
            />
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className={campo}
              title="Hasta"
            />
          </div>
        </div>

        {contratos === null ? (
          <Cargando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4">Código</th>
                  <th className="py-2 pr-4">Cliente</th>
                  <th className="py-2 pr-4">Evento</th>
                  <th className="py-2 pr-4 text-right">Platos</th>
                  <th className="py-2 pr-4 text-right">Total</th>
                  <th className="py-2 pr-4 text-right">Abonado</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-mono text-xs text-slate-500">{c.codigo}</td>
                    <td className="py-2 pr-4 font-medium text-slate-700">
                      {c.cliente?.nombre ?? '—'}
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      <span className="capitalize">{c.tipoEvento}</span>
                      <span className="block text-xs text-slate-400">
                        {fechaCorta(c.fechaEvento)} · {c.horaServicio} · {c.lugar}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {c.numeroPlatosFinal ?? c.numeroPlatos}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{aBs(Number(c.precioTotal))}</td>
                    <td className="py-2 pr-4 text-right tabular-nums text-slate-500">
                      {aBs(abonado(c))}
                    </td>
                    <td className="py-2 pr-4">
                      <Etiqueta className={ESTADO_COLOR[c.estado]}>{ESTADO_ETIQUETA[c.estado]}</Etiqueta>
                    </td>
                    <td className="py-2 text-right">
                      <Link
                        to={`/contratos/${c.id}`}
                        className="text-sm font-medium text-brand hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
                {contratos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-500">
                      No hay contratos que coincidan con el filtro.
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
