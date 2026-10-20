import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alerta, Tarjeta } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { botonPrimario, botonSecundario, campo } from '../../lib/catalogo'
import { fechaCorta } from '../../lib/contratos'
import { bs, FinanzasApi, hoyISO, inicioMesISO, type Gasto, type Liquidacion, type TipoGasto } from '../../lib/operaciones'
import { pdfLiquidacion } from '../../lib/pdf'
import { Campo, Kpi, mensajeError, SelectorContrato, Tabla, useContratos, Vacio } from './comun'

export function Finanzas() {
  const { usuario } = useAuth()
  const esGerente = usuario?.rol === 'GERENTE'
  const [params, setParams] = useSearchParams()
  const contratoId = params.get('contrato') ?? ''
  const contratos = useContratos()
  const [liq, setLiq] = useState<Liquidacion | null>(null)
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [rango, setRango] = useState({ desde: inicioMesISO(), hasta: hoyISO() })
  const [g, setG] = useState({ tipo: 'EVENTO' as TipoGasto, categoria: '', descripcion: '', monto: '', fecha: hoyISO(), contratoId: '' })
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const cargarLiq = useCallback(() => {
    if (!contratoId) return setLiq(null)
    FinanzasApi.liquidacion(contratoId).then(setLiq).catch(() => setLiq(null))
  }, [contratoId])
  const cargarGastos = useCallback(() => {
    FinanzasApi.gastos(rango).then(setGastos).catch(() => setGastos([]))
  }, [rango])
  useEffect(cargarLiq, [cargarLiq])
  useEffect(cargarGastos, [cargarGastos])

  const guardarGasto = async () => {
    setMsg(null)
    try {
      await FinanzasApi.crearGasto({
        tipo: g.tipo, categoria: g.categoria, descripcion: g.descripcion || undefined, monto: Number(g.monto),
        fecha: g.fecha, contratoId: g.tipo === 'EVENTO' ? g.contratoId || undefined : undefined,
      })
      setG({ ...g, categoria: '', descripcion: '', monto: '' })
      setMsg({ tipo: 'ok', texto: 'Gasto registrado.' })
      cargarGastos(); cargarLiq()
    } catch (e) { setMsg({ tipo: 'error', texto: mensajeError(e) }) }
  }
  const liquidar = async () => {
    if (!confirm('¿Liquidar el contrato? Quedará cerrado.')) return
    setMsg(null)
    try { await FinanzasApi.liquidar(contratoId); setMsg({ tipo: 'ok', texto: 'Contrato liquidado.' }); cargarLiq() }
    catch (e) { setMsg({ tipo: 'error', texto: mensajeError(e) }) }
  }
  const r = liq?.resumen
  const totalGastos = gastos.reduce((s, x) => s + Number(x.monto), 0)

  return (
    <div className="space-y-5">
      {msg && <Alerta tipo={msg.tipo}>{msg.texto}</Alerta>}
      <Tarjeta
        titulo="Liquidación por evento"
        acciones={liq && (
          <div className="flex gap-2">
            <button className={botonSecundario} onClick={() => pdfLiquidacion(liq)}>Descargar PDF</button>
            {esGerente && liq.contrato.estado === 'SERVIDO' && <button className={botonPrimario} onClick={liquidar}>Liquidar contrato</button>}
          </div>
        )}
      >
        <SelectorContrato contratos={contratos} valor={contratoId} onCambio={(id) => setParams(id ? { contrato: id } : {})} />
        {r && liq && (
          <div className="mt-5 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi etiqueta="Venta" valor={bs(r.precioTotal)} />
              <Kpi etiqueta={`Cobrado · saldo ${bs(r.saldo)}`} valor={bs(r.ingresos)} tono="bueno" />
              <Kpi etiqueta="Costos totales" valor={bs(r.costos)} tono="malo" />
              <Kpi etiqueta={`Utilidad${r.margen == null ? '' : ` · ${r.margen}%`}`} valor={bs(r.utilidad)} tono="marca" />
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Kpi etiqueta="Insumos comprados" valor={bs(r.costoInsumos)} />
              <Kpi etiqueta="Gastos del evento" valor={bs(r.costoGastos)} />
              <Kpi etiqueta="Remuneraciones" valor={bs(r.costoPersonal)} />
              <Kpi etiqueta="Costo por plato" valor={r.costoPorPlato == null ? '—' : bs(r.costoPorPlato)} />
            </div>
            {r.remuneracionesPendientes > 0 && <Alerta tipo="info">Hay {r.remuneracionesPendientes} remuneración(es) sin pagar en este evento.</Alerta>}
            <Tabla cabecera={['Compras', 'Proveedor', 'Fecha', 'Total']} derecha={[3]}>
              {liq.compras.length === 0 && <Vacio columnas={4} texto="Sin compras registradas." />}
              {liq.compras.map((k) => (
                <tr key={k.id}><td className="px-2 py-2">{k.folio}</td><td className="px-2 py-2">{k.proveedor}</td><td className="px-2 py-2">{fechaCorta(k.fecha)}</td><td className="px-2 py-2 text-right tabular-nums">{bs(k.total)}</td></tr>
              ))}
            </Tabla>
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Gastos" acciones={<span className="text-sm text-texto-2">Total del periodo: <b className="text-grafito">{bs(totalGastos)}</b></span>}>
        {esGerente && (
          <div className="mb-5 space-y-3 rounded-xl border border-linea bg-fondo/60 p-4">
            <div className="grid gap-3 sm:grid-cols-[150px_1fr_1fr_130px_150px_auto] sm:items-end">
              <Campo etiqueta="Tipo">
                <select className={campo} value={g.tipo} onChange={(e) => setG({ ...g, tipo: e.target.value as TipoGasto })}>
                  <option value="EVENTO">Del evento</option><option value="FIJO">Fijo</option>
                </select>
              </Campo>
              <Campo etiqueta="Categoría"><input className={campo} value={g.categoria} placeholder={g.tipo === 'EVENTO' ? 'Garrafas, vajilla, transporte…' : 'Luz, alquiler, publicidad…'} onChange={(e) => setG({ ...g, categoria: e.target.value })} /></Campo>
              <Campo etiqueta="Descripción"><input className={campo} value={g.descripcion} onChange={(e) => setG({ ...g, descripcion: e.target.value })} /></Campo>
              <Campo etiqueta="Monto (Bs)"><input className={campo} type="number" min="0" step="0.01" value={g.monto} onChange={(e) => setG({ ...g, monto: e.target.value })} /></Campo>
              <Campo etiqueta="Fecha"><input className={campo} type="date" value={g.fecha} onChange={(e) => setG({ ...g, fecha: e.target.value })} /></Campo>
              <button className={botonPrimario} onClick={guardarGasto}>Agregar</button>
            </div>
            {g.tipo === 'EVENTO' && <SelectorContrato contratos={contratos} valor={g.contratoId} onCambio={(id) => setG({ ...g, contratoId: id })} vacio="Contrato del gasto…" />}
          </div>
        )}
        <div className="mb-3 flex flex-wrap gap-3">
          <Campo etiqueta="Desde"><input type="date" className={campo} value={rango.desde} onChange={(e) => setRango({ ...rango, desde: e.target.value })} /></Campo>
          <Campo etiqueta="Hasta"><input type="date" className={campo} value={rango.hasta} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} /></Campo>
        </div>
        <Tabla cabecera={['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Contrato', 'Monto']} derecha={[5]}>
          {gastos.length === 0 && <Vacio columnas={6} />}
          {gastos.map((x) => (
            <tr key={x.id}>
              <td className="px-2 py-2.5">{fechaCorta(x.fecha)}</td>
              <td className="px-2 py-2.5">{x.tipo === 'EVENTO' ? 'Evento' : 'Fijo'}</td>
              <td className="px-2 py-2.5 font-medium">{x.categoria}</td>
              <td className="px-2 py-2.5 text-texto-2">{x.descripcion ?? '—'}</td>
              <td className="px-2 py-2.5">{x.contrato?.codigo ?? '—'}</td>
              <td className="px-2 py-2.5 text-right tabular-nums">{bs(x.monto)}</td>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
    </div>
  )
}
