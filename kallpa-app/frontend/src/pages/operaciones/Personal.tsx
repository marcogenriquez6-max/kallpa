import { useCallback, useEffect, useState } from 'react'
import { Alerta, Etiqueta, Tarjeta } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { botonPrimario, botonSecundario, campo } from '../../lib/catalogo'
import { fechaCorta } from '../../lib/contratos'
import {
  bs, MODALIDAD_ETIQUETA, PersonalApi, TIPO_PERSONA_ETIQUETA, type ModalidadPago, type Persona, type Remuneracion, type TipoPersona,
} from '../../lib/operaciones'
import { Campo, mensajeError, SelectorContrato, Tabla, useContratos, Vacio } from './comun'

export function Personal() {
  const { usuario } = useAuth()
  const puede = usuario?.rol === 'GERENTE'
  const contratos = useContratos()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [rems, setRems] = useState<Remuneracion[]>([])
  const [p, setP] = useState({ nombre: '', ci: '', telefono: '', tipo: 'PASANTE' as TipoPersona, carnet: '' })
  const [r, setR] = useState({ contratoId: '', personaId: '', concepto: '', modalidad: 'POR_DIA' as ModalidadPago, cantidad: '1', tarifa: '' })
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const cargar = useCallback(() => {
    PersonalApi.personas().then(setPersonas).catch(() => setPersonas([]))
    PersonalApi.remuneraciones().then(setRems).catch(() => setRems([]))
  }, [])
  useEffect(cargar, [cargar])

  const accion = async (fn: () => Promise<unknown>, ok: string) => {
    setMsg(null)
    try { await fn(); setMsg({ tipo: 'ok', texto: ok }); cargar() } catch (e) { setMsg({ tipo: 'error', texto: mensajeError(e) }) }
  }
  const pendiente = rems.filter((x) => !x.pagado).reduce((s, x) => s + Number(x.monto), 0)
  const hoy = new Date()

  return (
    <div className="space-y-5">
      {msg && <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>}
      <Tarjeta titulo="Personas">
        {puede && (
          <div className="mb-5 grid gap-3 rounded-xl border border-linea bg-fondo/60 p-4 sm:grid-cols-[1fr_130px_130px_170px_150px_auto] sm:items-end">
            <Campo etiqueta="Nombre"><input className={campo} value={p.nombre} onChange={(e) => setP({ ...p, nombre: e.target.value })} /></Campo>
            <Campo etiqueta="CI"><input className={campo} value={p.ci} onChange={(e) => setP({ ...p, ci: e.target.value })} /></Campo>
            <Campo etiqueta="Teléfono"><input className={campo} value={p.telefono} onChange={(e) => setP({ ...p, telefono: e.target.value })} /></Campo>
            <Campo etiqueta="Tipo">
              <select className={campo} value={p.tipo} onChange={(e) => setP({ ...p, tipo: e.target.value as TipoPersona })}>
                {Object.entries(TIPO_PERSONA_ETIQUETA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Campo>
            <Campo etiqueta="Carnet sanitario vence"><input type="date" className={campo} value={p.carnet} onChange={(e) => setP({ ...p, carnet: e.target.value })} /></Campo>
            <button className={botonPrimario} onClick={() => accion(async () => {
              await PersonalApi.crearPersona({ nombre: p.nombre, ci: p.ci, telefono: p.telefono || undefined, tipo: p.tipo, carnetSanitarioVence: p.carnet || undefined })
              setP({ ...p, nombre: '', ci: '', telefono: '', carnet: '' })
            }, 'Persona registrada.')}>Agregar</button>
          </div>
        )}
        <Tabla cabecera={['Nombre', 'CI', 'Teléfono', 'Tipo', 'Carnet sanitario', 'Estado', '']}>
          {personas.length === 0 && <Vacio columnas={7} />}
          {personas.map((x) => {
            const vence = x.carnetSanitarioVence ? new Date(x.carnetSanitarioVence) : null
            const vencido = vence && vence < hoy
            return (
              <tr key={x.id} className={x.activo ? '' : 'opacity-50'}>
                <td className="px-2 py-2.5 font-medium">{x.nombre}</td>
                <td className="px-2 py-2.5">{x.ci}</td>
                <td className="px-2 py-2.5">{x.telefono ?? '—'}</td>
                <td className="px-2 py-2.5">{TIPO_PERSONA_ETIQUETA[x.tipo]}</td>
                <td className="px-2 py-2.5">{vence ? <Etiqueta className={vencido ? 'bg-kallpa-100 text-kallpa-700' : 'bg-exito-suave text-exito'}>{vencido ? 'Vencido ' : 'Vigente '}{fechaCorta(x.carnetSanitarioVence!)}</Etiqueta> : '—'}</td>
                <td className="px-2 py-2.5">{x.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="px-2 py-2.5 text-right">{puede && <button className={botonSecundario} onClick={() => accion(() => PersonalApi.actualizarPersona(x.id, { activo: !x.activo }), 'Estado actualizado.')}>{x.activo ? 'Desactivar' : 'Activar'}</button>}</td>
              </tr>
            )
          })}
        </Tabla>
      </Tarjeta>

      <Tarjeta titulo="Remuneraciones por evento" acciones={<span className="text-sm text-texto-2">Pendiente de pago: <b className="text-brand">{bs(pendiente)}</b></span>}>
        {puede && (
          <div className="mb-5 space-y-3 rounded-xl border border-linea bg-fondo/60 p-4">
            <SelectorContrato contratos={contratos} valor={r.contratoId} onCambio={(id) => setR({ ...r, contratoId: id })} />
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_150px_100px_120px_auto] sm:items-end">
              <Campo etiqueta="Persona">
                <select className={campo} value={r.personaId} onChange={(e) => setR({ ...r, personaId: e.target.value })}>
                  <option value="">Seleccione…</option>
                  {personas.filter((x) => x.activo).map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}
                </select>
              </Campo>
              <Campo etiqueta="Concepto"><input className={campo} value={r.concepto} placeholder="Chef principal, pasante…" onChange={(e) => setR({ ...r, concepto: e.target.value })} /></Campo>
              <Campo etiqueta="Modalidad">
                <select className={campo} value={r.modalidad} onChange={(e) => setR({ ...r, modalidad: e.target.value as ModalidadPago })}>
                  {Object.entries(MODALIDAD_ETIQUETA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Campo>
              <Campo etiqueta={r.modalidad === 'POR_PLATO' ? 'Platos' : r.modalidad === 'POR_DIA' ? 'Días' : 'Cantidad'}><input className={campo} type="number" min="0" step="any" value={r.cantidad} onChange={(e) => setR({ ...r, cantidad: e.target.value })} /></Campo>
              <Campo etiqueta="Tarifa (Bs)"><input className={campo} type="number" min="0" step="0.01" value={r.tarifa} onChange={(e) => setR({ ...r, tarifa: e.target.value })} /></Campo>
              <button className={botonPrimario} onClick={() => accion(async () => {
                await PersonalApi.crearRemuneracion({ contratoId: r.contratoId, personaId: r.personaId, concepto: r.concepto, modalidad: r.modalidad, cantidad: Number(r.cantidad), tarifa: Number(r.tarifa) })
                setR({ ...r, concepto: '', tarifa: '' })
              }, 'Remuneración registrada.')}>Agregar</button>
            </div>
            <p className="text-xs text-texto-2">Monto: <b>{bs(Number(r.cantidad || 0) * Number(r.tarifa || 0))}</b></p>
          </div>
        )}
        <Tabla cabecera={['Contrato', 'Persona', 'Concepto', 'Modalidad', 'Cantidad × tarifa', 'Monto', 'Estado', '']} derecha={[5]}>
          {rems.length === 0 && <Vacio columnas={8} />}
          {rems.map((x) => (
            <tr key={x.id}>
              <td className="px-2 py-2.5">{x.contrato.codigo}<span className="block text-xs text-texto-2">{fechaCorta(x.contrato.fechaEvento)}</span></td>
              <td className="px-2 py-2.5 font-medium">{x.persona.nombre}</td>
              <td className="px-2 py-2.5">{x.concepto}</td>
              <td className="px-2 py-2.5">{MODALIDAD_ETIQUETA[x.modalidad]}</td>
              <td className="px-2 py-2.5 tabular-nums">{Number(x.cantidad)} × {bs(x.tarifa)}</td>
              <td className="px-2 py-2.5 text-right font-semibold tabular-nums">{bs(x.monto)}</td>
              <td className="px-2 py-2.5"><Etiqueta className={x.pagado ? 'bg-exito-suave text-exito' : 'bg-atencion-suave text-atencion'}>{x.pagado ? 'Pagado' : 'Pendiente'}</Etiqueta></td>
              <td className="px-2 py-2.5 text-right">{puede && !x.pagado && <button className={botonSecundario} onClick={() => accion(() => PersonalApi.pagar(x.id), 'Pago registrado.')}>Marcar pagado</button>}</td>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
    </div>
  )
}
