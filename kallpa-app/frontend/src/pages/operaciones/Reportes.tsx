import { useCallback, useEffect, useState } from 'react'
import { Alerta, Etiqueta, Tarjeta } from '../../components/ui'
import { InventarioApi } from '../../lib/api'
import { botonPrimario, botonSecundario, campo } from '../../lib/catalogo'
import { ESTADO_COLOR, ESTADO_ETIQUETA, fechaCorta } from '../../lib/contratos'
import { bs, hoyISO, inicioMesISO, ReportesApi, type ResumenPeriodo } from '../../lib/operaciones'
import { pdfInventario, pdfReporte } from '../../lib/pdf'
import type { EstadoContrato } from '../../types'
import { Campo, Kpi, mensajeError, Tabla, Vacio } from './comun'

export function Reportes() {
  const [rango, setRango] = useState({ desde: inicioMesISO(), hasta: hoyISO() })
  const [r, setR] = useState<ResumenPeriodo | null>(null)
  const [error, setError] = useState('')

  const cargar = useCallback(() => {
    setError('')
    ReportesApi.resumen(rango.desde, rango.hasta).then(setR).catch((e) => setError(mensajeError(e)))
  }, [rango])
  useEffect(cargar, [cargar])

  const atajo = (meses: number) => {
    const h = new Date()
    const d = new Date(h.getFullYear(), h.getMonth() - meses + 1, 1)
    setRango({ desde: d.toISOString().slice(0, 10), hasta: hoyISO() })
  }
  const i = r?.indicadores
  const maxProv = Math.max(1, ...(r?.comprasPorProveedor.map((p) => p.total) ?? [1]))

  return (
    <div className="space-y-5">
      <Tarjeta
        titulo="Reporte de gestión"
        acciones={
          <div className="flex flex-wrap gap-2">
            <button className={botonSecundario} onClick={() => InventarioApi.existencias().then(pdfInventario).catch((e) => setError(mensajeError(e)))}>PDF de inventario</button>
            <button className={botonPrimario} disabled={!r} onClick={() => r && pdfReporte(r)}>Descargar reporte PDF</button>
          </div>
        }
      >
        <div className="flex flex-wrap items-end gap-3">
          <Campo etiqueta="Desde"><input type="date" className={campo} value={rango.desde} onChange={(e) => setRango({ ...rango, desde: e.target.value })} /></Campo>
          <Campo etiqueta="Hasta"><input type="date" className={campo} value={rango.hasta} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} /></Campo>
          <button className={botonSecundario} onClick={() => atajo(1)}>Este mes</button>
          <button className={botonSecundario} onClick={() => atajo(3)}>Últimos 3 meses</button>
          <button className={botonSecundario} onClick={() => atajo(12)}>Último año</button>
        </div>
        {error && <div className="mt-4"><Alerta tipo="error">{error}</Alerta></div>}
        {i && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi etiqueta={`Eventos${i.cancelados ? ` · ${i.cancelados} cancelados` : ''}`} valor={String(i.contratos)} />
            <Kpi etiqueta="Platos" valor={i.platos.toLocaleString('es-BO')} />
            <Kpi etiqueta="Vendido" valor={bs(i.vendido)} />
            <Kpi etiqueta="Cobrado" valor={bs(i.cobrado)} tono="bueno" />
            <Kpi etiqueta="Por cobrar" valor={bs(i.porCobrar)} tono="malo" />
            <Kpi etiqueta="Compras de insumos" valor={bs(i.costoCompras)} />
            <Kpi etiqueta="Gastos + personal" valor={bs(i.gastosEvento + i.gastosFijos + i.costoPersonal)} />
            <Kpi etiqueta="Resultado de caja" valor={bs(i.resultado)} tono="marca" />
          </div>
        )}
      </Tarjeta>

      {r && (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <Tarjeta titulo="Platos más vendidos">
              <Tabla cabecera={['Ítem', 'Cantidad', 'Monto']} derecha={[1, 2]}>
                {r.topItems.length === 0 && <Vacio columnas={3} />}
                {r.topItems.map((t) => (
                  <tr key={t.item}><td className="px-2 py-2">{t.item}</td><td className="px-2 py-2 text-right tabular-nums">{t.cantidad}</td><td className="px-2 py-2 text-right tabular-nums">{bs(t.monto)}</td></tr>
                ))}
              </Tabla>
            </Tarjeta>
            <Tarjeta titulo="Compras por proveedor">
              {r.comprasPorProveedor.length === 0 && <p className="py-6 text-center text-sm text-texto-2">Sin compras en el periodo.</p>}
              <ul className="space-y-3">
                {r.comprasPorProveedor.map((p) => (
                  <li key={p.proveedor}>
                    <div className="flex justify-between text-sm"><span>{p.proveedor}</span><b className="tabular-nums">{bs(p.total)}</b></div>
                    <div className="mt-1 h-2 rounded-full bg-fondo"><div className="h-2 rounded-full bg-brand" style={{ width: `${(p.total / maxProv) * 100}%` }} /></div>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          </div>
          <Tarjeta titulo="Eventos del periodo">
            <Tabla cabecera={['Código', 'Fecha', 'Cliente', 'Evento', 'Platos', 'Estado', 'Total']} derecha={[4, 6]}>
              {r.contratos.length === 0 && <Vacio columnas={7} />}
              {r.contratos.map((c) => (
                <tr key={c.id}>
                  <td className="px-2 py-2.5 font-mono text-xs">{c.codigo}</td>
                  <td className="px-2 py-2.5">{fechaCorta(c.fechaEvento)}</td>
                  <td className="px-2 py-2.5">{c.cliente}</td>
                  <td className="px-2 py-2.5">{c.tipoEvento}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{c.platos}</td>
                  <td className="px-2 py-2.5"><Etiqueta className={ESTADO_COLOR[c.estado as EstadoContrato]}>{ESTADO_ETIQUETA[c.estado as EstadoContrato]}</Etiqueta></td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{bs(c.precioTotal)}</td>
                </tr>
              ))}
            </Tabla>
          </Tarjeta>
        </>
      )}
    </div>
  )
}
