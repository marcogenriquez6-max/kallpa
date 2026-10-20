import { useCallback, useEffect, useState } from 'react'
import { Alerta, Tarjeta } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { botonPrimario, campo } from '../../lib/catalogo'
import { ETAPA_ETIQUETA, fechaHoraCorta, ProduccionApi, type EtapaProduccion, type RegistroProduccion } from '../../lib/operaciones'
import { Campo, mensajeError, SelectorContrato, useContratos } from './comun'

const ETAPAS = Object.keys(ETAPA_ETIQUETA) as EtapaProduccion[]

export function Produccion() {
  const { usuario } = useAuth()
  const puede = ['GERENTE', 'GERENTE_GASTRONOMICO', 'COCINA'].includes(usuario?.rol ?? '')
  const contratos = useContratos(['PLANIFICADO', 'EN_COMPRA', 'INSUMOS_ENTREGADOS', 'EN_PRODUCCION', 'SERVIDO'])
  const [contratoId, setContratoId] = useState('')
  const [registros, setRegistros] = useState<RegistroProduccion[]>([])
  const [etapa, setEtapa] = useState<EtapaProduccion>('MISE_EN_PLACE')
  const [observacion, setObservacion] = useState('')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const cargar = useCallback(() => {
    if (!contratoId) return setRegistros([])
    ProduccionApi.listar(contratoId).then((r) => {
      setRegistros(r)
      const hechas = new Set(r.map((x) => x.etapa))
      setEtapa(ETAPAS.find((e) => !hechas.has(e)) ?? 'SERVICIO')
    }).catch(() => setRegistros([]))
  }, [contratoId])
  useEffect(cargar, [cargar])

  const registrar = async () => {
    setMsg(null)
    try {
      await ProduccionApi.crear({ contratoId, etapa, observacion: observacion || undefined })
      setObservacion('')
      setMsg({ tipo: 'ok', texto: `Etapa «${ETAPA_ETIQUETA[etapa]}» registrada.${etapa === 'SERVICIO' ? ' El contrato quedó como servido.' : ''}` })
      cargar()
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeError(e) })
    }
  }

  const hechas = new Map(registros.map((r) => [r.etapa, r]))
  return (
    <div className="space-y-5">
      <Tarjeta titulo="Producción del evento">
        <SelectorContrato contratos={contratos} valor={contratoId} onCambio={setContratoId} />
        {contratoId && (
          <ol className="mt-6 grid gap-3 sm:grid-cols-5">
            {ETAPAS.map((e, i) => {
              const r = hechas.get(e)
              return (
                <li key={e} className={`rounded-xl border p-4 transition ${r ? 'border-exito/30 bg-exito-suave' : 'border-linea bg-white'}`}>
                  <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${r ? 'bg-exito text-white' : 'bg-fondo text-texto-2'}`}>{r ? '✓' : i + 1}</span>
                  <p className="mt-2 font-semibold text-grafito">{ETAPA_ETIQUETA[e]}</p>
                  <p className="text-xs text-texto-2">{r ? `${fechaHoraCorta(r.fechaHora)} · ${r.responsable.nombre}` : 'Pendiente'}</p>
                  {r?.observacion && <p className="mt-1 text-xs text-grafito">{r.observacion}</p>}
                </li>
              )
            })}
          </ol>
        )}
      </Tarjeta>
      {contratoId && puede && (
        <Tarjeta titulo="Registrar avance">
          <div className="grid gap-3 sm:grid-cols-[220px_1fr_auto] sm:items-end">
            <Campo etiqueta="Etapa">
              <select className={campo} value={etapa} onChange={(e) => setEtapa(e.target.value as EtapaProduccion)}>
                {ETAPAS.map((e) => <option key={e} value={e}>{ETAPA_ETIQUETA[e]}</option>)}
              </select>
            </Campo>
            <Campo etiqueta="Observación"><input className={campo} value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Opcional" /></Campo>
            <button className={botonPrimario} onClick={registrar}>Registrar</button>
          </div>
          {msg && <div className="mt-4"><Alerta tipo={msg.tipo}>{msg.texto}</Alerta></div>}
        </Tarjeta>
      )}
    </div>
  )
}
