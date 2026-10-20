import { useCallback, useEffect, useState } from 'react'
import { Alerta, Etiqueta, Tarjeta } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { botonPrimario, campo } from '../../lib/catalogo'
import {
  CalidadApi, fechaHoraCorta, PUNTO_ETIQUETA, PUNTO_RANGO, type ControlTemperatura, type PuntoControl,
} from '../../lib/operaciones'
import { Campo, mensajeError, SelectorContrato, Tabla, useContratos, Vacio } from './comun'

export function Calidad() {
  const { usuario } = useAuth()
  const puede = usuario?.rol !== 'CONSULTA'
  const contratos = useContratos()
  const [contratoId, setContratoId] = useState('')
  const [soloFuera, setSoloFuera] = useState(false)
  const [lista, setLista] = useState<ControlTemperatura[]>([])
  const [f, setF] = useState({ punto: 'COCCION' as PuntoControl, alimento: '', temperatura: '', accion: '' })
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const cargar = useCallback(() => {
    CalidadApi.listar({ contratoId: contratoId || undefined, soloFuera: soloFuera || undefined }).then(setLista).catch(() => setLista([]))
  }, [contratoId, soloFuera])
  useEffect(cargar, [cargar])

  const registrar = async () => {
    setMsg(null)
    if (!contratoId) return setMsg({ tipo: 'error', texto: 'Elija el contrato.' })
    try {
      const r = await CalidadApi.crear({ contratoId, punto: f.punto, alimento: f.alimento, temperaturaC: Number(f.temperatura), accionCorrectiva: f.accion || undefined })
      setMsg(r.fueraDeRango
        ? { tipo: 'error', texto: `Fuera de rango (${PUNTO_RANGO[f.punto]}). Registre la acción correctiva.` }
        : { tipo: 'ok', texto: 'Temperatura dentro del rango seguro.' })
      setF({ ...f, alimento: '', temperatura: '', accion: '' })
      cargar()
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeError(e) })
    }
  }

  return (
    <div className="space-y-5">
      <Tarjeta titulo="Control de temperaturas">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <SelectorContrato contratos={contratos} valor={contratoId} onCambio={setContratoId} vacio="Todos los contratos" />
          <label className="flex items-center gap-2 text-sm text-texto-2">
            <input type="checkbox" className="accent-[#7a1e2c]" checked={soloFuera} onChange={(e) => setSoloFuera(e.target.checked)} /> Solo fuera de rango
          </label>
        </div>
        {puede && contratoId && (
          <div className="mt-5 grid gap-3 rounded-xl border border-linea bg-fondo/60 p-4 sm:grid-cols-[180px_1fr_120px_1fr_auto] sm:items-end">
            <Campo etiqueta="Punto de control">
              <select className={campo} value={f.punto} onChange={(e) => setF({ ...f, punto: e.target.value as PuntoControl })}>
                {Object.entries(PUNTO_ETIQUETA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Campo>
            <Campo etiqueta="Alimento"><input className={campo} value={f.alimento} onChange={(e) => setF({ ...f, alimento: e.target.value })} placeholder="Ej.: pollo al horno" /></Campo>
            <Campo etiqueta={`°C (${PUNTO_RANGO[f.punto]})`}><input className={campo} type="number" step="0.1" value={f.temperatura} onChange={(e) => setF({ ...f, temperatura: e.target.value })} /></Campo>
            <Campo etiqueta="Acción correctiva"><input className={campo} value={f.accion} onChange={(e) => setF({ ...f, accion: e.target.value })} placeholder="Si corresponde" /></Campo>
            <button className={botonPrimario} onClick={registrar}>Registrar</button>
          </div>
        )}
        {msg && <div className="mt-4"><Alerta tipo={msg.tipo}>{msg.texto}</Alerta></div>}
      </Tarjeta>
      <Tarjeta titulo="Registros">
        <Tabla cabecera={['Fecha', 'Contrato', 'Punto', 'Alimento', 'Temp.', 'Resultado', 'Acción', 'Responsable']} derecha={[4]}>
          {lista.length === 0 && <Vacio columnas={8} />}
          {lista.map((t) => (
            <tr key={t.id} className={t.fueraDeRango ? 'bg-kallpa-50/60' : ''}>
              <td className="px-2 py-2.5 whitespace-nowrap">{fechaHoraCorta(t.fechaHora)}</td>
              <td className="px-2 py-2.5">{t.contrato.codigo}</td>
              <td className="px-2 py-2.5">{PUNTO_ETIQUETA[t.punto]}</td>
              <td className="px-2 py-2.5">{t.alimento}</td>
              <td className="px-2 py-2.5 text-right font-semibold tabular-nums">{Number(t.temperaturaC).toFixed(1)} °C</td>
              <td className="px-2 py-2.5"><Etiqueta className={t.fueraDeRango ? 'bg-kallpa-100 text-kallpa-700' : 'bg-exito-suave text-exito'}>{t.fueraDeRango ? 'Fuera de rango' : 'Correcto'}</Etiqueta></td>
              <td className="px-2 py-2.5 text-texto-2">{t.accionCorrectiva ?? '—'}</td>
              <td className="px-2 py-2.5">{t.responsable.nombre}</td>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
    </div>
  )
}
