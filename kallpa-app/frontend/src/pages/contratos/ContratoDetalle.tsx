import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ContratosApi } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { aBs, botonPrimario, botonSecundario, campo } from '../../lib/catalogo'
import {
  ESTADO_COLOR,
  ESTADO_ETIQUETA,
  TIPOS_PAGO,
  TIPO_PAGO_ETIQUETA,
  TRANSICIONES,
  fechaCorta,
} from '../../lib/contratos'
import type { Contrato, TipoPago } from '../../types'
import { Alerta, Cargando, Etiqueta, Tarjeta } from '../../components/ui'

function PagoForm({
  contratoId,
  onCancel,
  onSaved,
}: {
  contratoId: string
  onCancel: () => void
  onSaved: () => void
}) {
  const [tipo, setTipo] = useState<TipoPago>('ANTICIPO')
  const [monto, setMonto] = useState('')
  const [metodo, setMetodo] = useState('Efectivo')
  const [comprobante, setComprobante] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const guardar = async () => {
    setError('')
    const n = Number(monto)
    if (!n || n <= 0) return setError('Indica un monto válido.')
    if (!metodo.trim()) return setError('Indica el método de pago.')
    setEnviando(true)
    try {
      await ContratosApi.registrarPago(contratoId, {
        tipo,
        monto: n,
        metodo: metodo.trim(),
        comprobante: comprobante.trim() || undefined,
      })
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el pago.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alerta tipo="error">{error}</Alerta>}
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="text-sm font-medium text-slate-700">
          Tipo
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoPago)}
            className={`mt-1 ${campo}`}
          >
            {TIPOS_PAGO.map((t) => (
              <option key={t} value={t}>
                {TIPO_PAGO_ETIQUETA[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Monto (Bs)
          <input
            type="number"
            min={0}
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className={`mt-1 ${campo}`}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Método
          <input
            value={metodo}
            onChange={(e) => setMetodo(e.target.value)}
            className={`mt-1 ${campo}`}
            placeholder="Efectivo, transferencia, QR…"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Comprobante (opcional)
          <input
            value={comprobante}
            onChange={(e) => setComprobante(e.target.value)}
            className={`mt-1 ${campo}`}
          />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={botonSecundario} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" onClick={guardar} className={botonPrimario} disabled={enviando}>
          {enviando ? 'Registrando…' : 'Registrar pago'}
        </button>
      </div>
    </div>
  )
}

export function ContratoDetalle() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { usuario } = useAuth()
  const puedeEditar = usuario?.rol === 'GERENTE' || usuario?.rol === 'GERENTE_GASTRONOMICO'

  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [mostrarPago, setMostrarPago] = useState(false)
  const [platosFinales, setPlatosFinales] = useState('')

  const cargar = useCallback(async () => {
    if (!id) return
    setError('')
    try {
      const c = await ContratosApi.obtener(id)
      setContrato(c)
      setPlatosFinales(String(c.numeroPlatosFinal ?? c.numeroPlatos))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el contrato.')
    }
  }, [id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  if (!id) return null
  if (error) return <Alerta tipo="error">{error}</Alerta>
  if (!contrato) return <Cargando />

  const resumen = contrato.resumen
  const cambios = TRANSICIONES[contrato.estado]

  const cambiarEstado = async (estado: Contrato['estado']) => {
    if (estado === 'CANCELADO' && !confirm('¿Seguro que deseas cancelar este contrato?')) return
    setError('')
    try {
      await ContratosApi.cambiarEstado(id, { estado })
      setOk(`Estado actualizado a ${ESTADO_ETIQUETA[estado]}.`)
      void cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado.')
    }
  }

  const confirmarPlatos = async () => {
    const n = Number(platosFinales)
    if (!Number.isInteger(n) || n < 1) return setError('Número final de platos inválido.')
    setError('')
    try {
      await ContratosApi.confirmarPlatos(id, n)
      setOk('Número final de platos confirmado.')
      void cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo confirmar los platos.')
    }
  }

  return (
    <div className="space-y-5">
      {error && <Alerta tipo="error">{error}</Alerta>}
      {ok && <Alerta tipo="ok">{ok}</Alerta>}

      <Tarjeta
        titulo={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm text-slate-500">{contrato.codigo}</span>
            <Etiqueta className={ESTADO_COLOR[contrato.estado]}>
              {ESTADO_ETIQUETA[contrato.estado]}
            </Etiqueta>
          </span>
        }
        acciones={
          puedeEditar && contrato.estado === 'COTIZACION' ? (
            <button
              onClick={() => navegar(`/contratos/${id}/editar`)}
              className={botonSecundario}
            >
              Editar contrato
            </button>
          ) : undefined
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Cliente</p>
            <p className="font-medium text-slate-800">{contrato.cliente?.nombre ?? '—'}</p>
            {contrato.cliente?.telefono && (
              <p className="text-sm text-slate-500 tabular-nums">{contrato.cliente.telefono}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400">Evento</p>
            <p className="font-medium capitalize text-slate-800">{contrato.tipoEvento}</p>
            <p className="text-sm text-slate-600">
              {fechaCorta(contrato.fechaEvento)} · {contrato.horaServicio}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Lugar</p>
            <p className="text-slate-700">{contrato.lugar}</p>
            {contrato.direccion && <p className="text-xs text-slate-400">{contrato.direccion}</p>}
          </div>
          <div>
            <p className="text-xs text-slate-500">Platos</p>
            <p className="text-slate-700">
              {contrato.numeroPlatosFinal ?? contrato.numeroPlatos}
              {contrato.numeroPlatosFinal ? (
                <span className="ml-2 text-xs text-emerald-600">confirmado</span>
              ) : (
                <span className="ml-2 text-xs text-slate-400">contratado</span>
              )}
            </p>
            <p className="text-xs text-slate-400">{contrato.garzonesIncluidos} garzones incluidos</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Total del contrato</p>
            <p className="text-lg font-semibold text-slate-800">Bs {aBs(Number(contrato.precioTotal))}</p>
            <p className="text-xs text-slate-400">
              Registrado por {contrato.registradoPor?.nombre ?? '—'}
            </p>
          </div>
          {resumen && (
            <div>
              <p className="text-xs text-slate-500">Anticipo esperado ({resumen.anticipoPorcentaje}%)</p>
              <p className="text-slate-700">Bs {aBs(resumen.anticipoEsperado)}</p>
              <p className="text-xs text-slate-400">
                Abonado Bs {aBs(resumen.abonado)} · Saldo Bs {aBs(resumen.saldo)}
              </p>
            </div>
          )}
        </div>

        {(contrato.requisitosEspeciales || contrato.observaciones) && (
          <div className="mt-4 space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
            {contrato.requisitosEspeciales && (
              <p>
                <span className="font-medium text-slate-600">Requisitos: </span>
                <span className="text-slate-700">{contrato.requisitosEspeciales}</span>
              </p>
            )}
            {contrato.observaciones && (
              <p>
                <span className="font-medium text-slate-600">Observaciones: </span>
                <span className="text-slate-700">{contrato.observaciones}</span>
              </p>
            )}
          </div>
        )}

        {puedeEditar && (
          <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
            {(contrato.estado === 'CONFIRMADO' || contrato.estado === 'PLANIFICADO') && (
              <div className="flex items-end gap-2">
                <label className="text-sm font-medium text-slate-700">
                  Confirmar platos finales
                  <input
                    type="number"
                    min={1}
                    value={platosFinales}
                    onChange={(e) => setPlatosFinales(e.target.value)}
                    className={`mt-1 w-28 ${campo}`}
                  />
                </label>
                <button type="button" onClick={confirmarPlatos} className={botonSecundario}>
                  Confirmar
                </button>
              </div>
            )}
            {cambios.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-500">Cambiar estado a:</span>
                {cambios.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => cambiarEstado(e)}
                    className={botonSecundario}
                  >
                    {ESTADO_ETIQUETA[e]}
                  </button>
                ))}
              </div>
            )}
            {mostrarPago ? null : (
              <button
                type="button"
                onClick={() => setMostrarPago(true)}
                className={botonPrimario}
              >
                + Registrar pago
              </button>
            )}
          </div>
        )}
      </Tarjeta>

      {mostrarPago && (
        <Tarjeta titulo="Registrar pago">
          <PagoForm
            contratoId={contrato.id}
            onCancel={() => setMostrarPago(false)}
            onSaved={() => {
              setMostrarPago(false)
              setOk('Pago registrado.')
              void cargar()
            }}
          />
        </Tarjeta>
      )}

      <Tarjeta titulo="Menú contratado">
        {contrato.items && contrato.items.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4">Ítem</th>
                <th className="py-2 pr-4 text-right">Cantidad</th>
                <th className="py-2 pr-4 text-right">Precio</th>
                <th className="py-2 pr-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {contrato.items.map((i) => (
                <tr key={i.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-slate-700">
                    {i.item ? `${i.item.codigo} · ${i.item.nombre}` : i.itemId}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">{i.cantidad}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {aBs(Number(i.precioUnitario))}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {aBs(Number(i.subtotal))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500">Este contrato todavía no tiene menú.</p>
        )}
      </Tarjeta>

      <Tarjeta titulo="Pagos">
        {contrato.pagos && contrato.pagos.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Método</th>
                <th className="py-2 pr-4">Comprobante</th>
                <th className="py-2 pr-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {contrato.pagos.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 text-slate-600">{fechaCorta(p.fecha)}</td>
                  <td className="py-2 pr-4">
                    <Etiqueta
                      className={
                        p.tipo === 'DEVOLUCION'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }
                    >
                      {TIPO_PAGO_ETIQUETA[p.tipo]}
                    </Etiqueta>
                  </td>
                  <td className="py-2 pr-4 text-slate-600">{p.metodo}</td>
                  <td className="py-2 pr-4 text-slate-500">{p.comprobante ?? '—'}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {aBs(Number(p.monto))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-slate-500">Sin pagos registrados.</p>
        )}
      </Tarjeta>

      <Link
        to="/contratos"
        className="inline-block text-sm font-medium text-brand hover:underline"
      >
        ← Volver a contratos
      </Link>
    </div>
  )
}
