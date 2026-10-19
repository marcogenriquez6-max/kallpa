import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ContratosApi, SolicitudesApi } from '../../lib/api'
import { campo, botonPrimario } from '../../lib/catalogo'
import { fechaCorta } from '../../lib/contratos'
import {
  ESTADOS_SOLICITUD,
  ESTADO_SOLICITUD_COLOR,
  ESTADO_SOLICITUD_ETIQUETA,
} from '../../lib/solicitudes'
import { useAuth } from '../../lib/auth'
import type { Contrato, EstadoSolicitud, SolicitudInsumos } from '../../types'
import { Alerta, Cargando, Etiqueta, Tarjeta } from '../../components/ui'

const ESTADOS_PLANIFICABLES: Contrato['estado'][] = ['CONFIRMADO', 'PLANIFICADO']

function GenerarSolicitud({ onSaved }: { onSaved: (s: SolicitudInsumos) => void }) {
  const [contratos, setContratos] = useState<Contrato[] | null>(null)
  const [contratoId, setContratoId] = useState('')
  const [fechaRequerida, setFechaRequerida] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    ContratosApi.listar()
      .then((c) => setContratos(c.filter((x) => ESTADOS_PLANIFICABLES.includes(x.estado))))
      .catch(() => setContratos([]))
  }, [])

  const guardar = async () => {
    setError('')
    if (!contratoId) return setError('Selecciona el contrato.')
    setEnviando(true)
    try {
      const s = await SolicitudesApi.generar({
        contratoId,
        fechaHoraRequerida: fechaRequerida ? new Date(fechaRequerida).toISOString() : undefined,
        observaciones: observaciones.trim() || undefined,
      })
      onSaved(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700">Generar solicitud de insumos</h3>
      {error && <Alerta tipo="error">{error}</Alerta>}
      <p className="text-xs text-slate-500">
        El sistema calcula las cantidades a partir de las fichas técnicas vigentes del menú y los
        platos contratados.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Contrato
          <select
            value={contratoId}
            onChange={(e) => setContratoId(e.target.value)}
            className={`mt-1 ${campo}`}
          >
            <option value="">Selecciona un contrato confirmado…</option>
            {(contratos ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo} · {c.tipoEvento} · {fechaCorta(c.fechaEvento)} ({c.numeroPlatosFinal ?? c.numeroPlatos} platos)
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Requerido en cocina
          <input
            type="datetime-local"
            value={fechaRequerida}
            onChange={(e) => setFechaRequerida(e.target.value)}
            className={`mt-1 ${campo}`}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Observaciones
          <input
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className={`mt-1 ${campo}`}
          />
        </label>
      </div>
      {contratos && contratos.length === 0 && (
        <p className="text-xs text-amber-700">
          No hay contratos confirmados. Confirma un contrato (registrando el anticipo) para poder
          generar su solicitud.
        </p>
      )}
      <div className="flex justify-end">
        <button type="button" onClick={guardar} className={botonPrimario} disabled={enviando}>
          {enviando ? 'Generando…' : 'Generar'}
        </button>
      </div>
    </div>
  )
}

export function Compras() {
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const puedeEditar = usuario?.rol === 'GERENTE' || usuario?.rol === 'GERENTE_GASTRONOMICO'

  const [solicitudes, setSolicitudes] = useState<SolicitudInsumos[] | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)

  const cargar = useCallback(async () => {
    setError('')
    try {
      const estado = (filtroEstado || undefined) as EstadoSolicitud | undefined
      setSolicitudes(await SolicitudesApi.listar({ estado }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las solicitudes.')
    }
  }, [filtroEstado])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return (
    <div className="space-y-5">
      <Tarjeta
        titulo="Compras y solicitudes"
        acciones={
          puedeEditar && !mostrarForm ? (
            <button
              onClick={() => {
                setOk('')
                setMostrarForm(true)
              }}
              className={botonPrimario}
            >
              + Generar solicitud
            </button>
          ) : undefined
        }
      >
        <p className="mb-4 text-sm text-slate-500">
          Solicitud de insumos (F-001) por evento. La recepción de compras se habilitará en una
          próxima versión.
        </p>

        {error && <Alerta tipo="error">{error}</Alerta>}
        {ok && <Alerta tipo="ok">{ok}</Alerta>}

        <div className="space-y-4">
          {mostrarForm && (
            <GenerarSolicitud
              onSaved={(s) => {
                setMostrarForm(false)
                setOk(`Solicitud ${s.folio} generada.`)
                navegar(`/compras/${s.id}`)
              }}
            />
          )}

          <div className="grid gap-2 sm:grid-cols-[1fr_200px]">
            <span />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={campo}
            >
              <option value="">Todos los estados</option>
              {ESTADOS_SOLICITUD.map((e) => (
                <option key={e} value={e}>
                  {ESTADO_SOLICITUD_ETIQUETA[e]}
                </option>
              ))}
            </select>
          </div>

          {solicitudes === null ? (
            <Cargando />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-4">Folio</th>
                    <th className="py-2 pr-4">Evento</th>
                    <th className="py-2 pr-4">Estado</th>
                    <th className="py-2 pr-4 text-center">Versión</th>
                    <th className="py-2 pr-4 text-right">Platos</th>
                    <th className="py-2 pr-4">Requerido</th>
                    <th className="py-2 pr-4 text-right">Insumos</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {solicitudes.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-mono text-slate-700">{s.folio}</td>
                      <td className="py-2 pr-4 text-slate-600">
                        <span className="font-medium text-slate-700">
                          {s.contrato?.codigo ?? '—'}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {s.contrato?.tipoEvento} · {s.contrato ? fechaCorta(s.contrato.fechaEvento ?? '') : ''}
                        </span>
                      </td>
                      <td className="py-2 pr-4">
                        <Etiqueta className={ESTADO_SOLICITUD_COLOR[s.estado]}>
                          {ESTADO_SOLICITUD_ETIQUETA[s.estado]}
                        </Etiqueta>
                      </td>
                      <td className="py-2 pr-4 text-center text-slate-500">#{s.version}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-slate-600">
                        {s.platosBase}
                      </td>
                      <td className="py-2 pr-4 text-slate-500">{fechaCorta(s.fechaHoraRequerida)}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-slate-600">
                        {s._count?.items ?? 0}
                      </td>
                      <td className="py-2">
                        <Link
                          to={`/compras/${s.id}`}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {solicitudes.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500">
                        No hay solicitudes que coincidan con el filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Tarjeta>
    </div>
  )
}
