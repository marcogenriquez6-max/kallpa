import { useCallback, useEffect, useState } from 'react'
import { Alerta, Etiqueta, Tarjeta } from '../../components/ui'
import { ProveedoresApi } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { botonPrimario, botonSecundario, campo, campoCompacto } from '../../lib/catalogo'
import {
  bs, COMPROBANTE_ETIQUETA, ComprasApi, CONFORMIDAD_COLOR, CONFORMIDAD_ETIQUETA, EntregasApi, fechaHoraCorta,
  type Compra, type Conformidad, type Entrega, type TipoComprobante,
} from '../../lib/operaciones'
import { pdfEntrega } from '../../lib/pdf'
import type { Proveedor, SolicitudInsumos } from '../../types'
import { Campo, mensajeError, Tabla, Vacio } from '../operaciones/comun'

const ACTIVA = ['APROBADA', 'EN_COMPRA', 'ENTREGADA_PARCIAL']

/** Compras registradas sobre la solicitud y formulario para registrar una nueva. */
export function PanelCompras({ solicitud, onCambio }: { solicitud: SolicitudInsumos; onCambio: () => void }) {
  const { usuario } = useAuth()
  const puede = usuario?.rol === 'GERENTE' || usuario?.rol === 'LOGISTICA'
  const [compras, setCompras] = useState<Compra[]>([])
  const [abierto, setAbierto] = useState(false)
  const cargar = useCallback(() => {
    ComprasApi.listar({ solicitudId: solicitud.id }).then(setCompras).catch(() => setCompras([]))
  }, [solicitud.id])
  useEffect(cargar, [cargar])

  const total = compras.reduce((s, c) => s + Number(c.total), 0)
  return (
    <Tarjeta
      titulo="Compras"
      acciones={puede && ACTIVA.includes(solicitud.estado) && !abierto ? (
        <button className={botonPrimario} onClick={() => setAbierto(true)}>+ Registrar compra</button>
      ) : undefined}
    >
      {abierto && (
        <FormCompra solicitud={solicitud} onCerrar={() => setAbierto(false)} onGuardado={() => { setAbierto(false); cargar(); onCambio() }} />
      )}
      <Tabla cabecera={['Fecha', 'Proveedor', 'Comprobante', 'Insumos', 'Registró', 'Total']} derecha={[5]}>
        {compras.length === 0 && <Vacio columnas={6} texto="Aún no se registraron compras para esta solicitud." />}
        {compras.map((c) => (
          <tr key={c.id}>
            <td className="px-2 py-2.5 whitespace-nowrap">{fechaHoraCorta(c.fechaHora)}</td>
            <td className="px-2 py-2.5 font-medium">{c.proveedor.razonSocial}</td>
            <td className="px-2 py-2.5">{COMPROBANTE_ETIQUETA[c.tipoComprobante]}</td>
            <td className="px-2 py-2.5 text-texto-2">{c.items.map((i) => i.solicitudItem.insumo.nombre).join(', ')}</td>
            <td className="px-2 py-2.5">{c.compradoPor.nombre}</td>
            <td className="px-2 py-2.5 text-right font-semibold tabular-nums">{bs(c.total)}</td>
          </tr>
        ))}
      </Tabla>
      {compras.length > 0 && <p className="mt-3 text-right text-sm text-texto-2">Total comprado: <b className="text-grafito">{bs(total)}</b></p>}
    </Tarjeta>
  )
}

function FormCompra({ solicitud, onCerrar, onGuardado }: { solicitud: SolicitudInsumos; onCerrar: () => void; onGuardado: () => void }) {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [proveedorId, setProveedorId] = useState('')
  const [comprobante, setComprobante] = useState<TipoComprobante>('RECIBO')
  const items = (solicitud.items ?? []).filter((i) => i.origen !== 'STOCK')
  const [filas, setFilas] = useState(() =>
    Object.fromEntries(items.map((i) => [i.id, { usar: i.origen === 'COMPRAR', cantidad: i.cantidad ?? '', precio: '' }])),
  )
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  useEffect(() => { ProveedoresApi.listar({ activo: true }).then(setProveedores).catch(() => setProveedores([])) }, [])

  const elegidas = items.filter((i) => filas[i.id]?.usar)
  const total = elegidas.reduce((s, i) => s + Number(filas[i.id].cantidad || 0) * Number(filas[i.id].precio || 0), 0)
  const set = (id: string, cambio: Partial<{ usar: boolean; cantidad: string; precio: string }>) =>
    setFilas((f) => ({ ...f, [id]: { ...f[id], ...cambio } }))

  const guardar = async () => {
    setError('')
    if (!proveedorId) return setError('Elija el proveedor.')
    if (!elegidas.length) return setError('Marque al menos un insumo comprado.')
    for (const i of elegidas) {
      if (!(Number(filas[i.id].cantidad) > 0) || filas[i.id].precio === '') return setError(`Complete cantidad y precio de «${i.insumo?.nombre}».`)
    }
    setEnviando(true)
    try {
      await ComprasApi.crear({
        solicitudId: solicitud.id, proveedorId, tipoComprobante: comprobante,
        items: elegidas.map((i) => ({ solicitudItemId: i.id, cantidad: Number(filas[i.id].cantidad), precioUnitario: Number(filas[i.id].precio) })),
      })
      onGuardado()
    } catch (e) {
      setError(mensajeError(e, 'No se pudo registrar la compra.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mb-5 space-y-4 rounded-xl border border-brand/25 bg-kallpa-50/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo etiqueta="Proveedor">
          <select className={campo} value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
            <option value="">Seleccione…</option>
            {proveedores.map((p) => <option key={p.id} value={p.id}>{p.razonSocial}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Comprobante">
          <select className={campo} value={comprobante} onChange={(e) => setComprobante(e.target.value as TipoComprobante)}>
            {Object.entries(COMPROBANTE_ETIQUETA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Campo>
      </div>
      <Tabla cabecera={['', 'Insumo', 'Pedido', 'Cantidad comprada', 'Precio por unidad (Bs)', 'Subtotal']} derecha={[5]}>
        {items.map((i) => {
          const f = filas[i.id]
          return (
            <tr key={i.id} className={f.usar ? '' : 'opacity-55'}>
              <td className="px-2 py-2"><input type="checkbox" className="accent-[#7a1e2c]" checked={f.usar} onChange={(e) => set(i.id, { usar: e.target.checked })} /></td>
              <td className="px-2 py-2 font-medium">{i.insumo?.nombre}</td>
              <td className="px-2 py-2 text-texto-2 whitespace-nowrap">{i.cantidad ?? 'a criterio'} {i.unidadCodigo}</td>
              <td className="px-2 py-2"><input className={`${campoCompacto} w-28`} type="number" min="0" step="any" value={f.cantidad} disabled={!f.usar} onChange={(e) => set(i.id, { cantidad: e.target.value })} /> <span className="text-xs text-texto-2">{i.unidadCodigo}</span></td>
              <td className="px-2 py-2"><input className={`${campoCompacto} w-28`} type="number" min="0" step="0.01" value={f.precio} disabled={!f.usar} placeholder="0,00" onChange={(e) => set(i.id, { precio: e.target.value })} /></td>
              <td className="px-2 py-2 text-right tabular-nums">{f.usar ? bs(Number(f.cantidad || 0) * Number(f.precio || 0)) : '—'}</td>
            </tr>
          )
        })}
      </Tabla>
      {error && <Alerta tipo="error">{error}</Alerta>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-texto-2">Total de la compra: <b className="font-title text-lg text-grafito">{bs(total)}</b></p>
        <div className="flex gap-2">
          <button className={botonSecundario} onClick={onCerrar}>Cancelar</button>
          <button className={botonPrimario} disabled={enviando} onClick={guardar}>{enviando ? 'Guardando…' : 'Guardar compra'}</button>
        </div>
      </div>
      <p className="text-xs text-texto-2">Al guardar, los insumos entran al inventario y el precio queda en el historial del proveedor.</p>
    </div>
  )
}

/** Actas de entrega en cocina de la solicitud. */
export function PanelEntregas({ solicitud, onCambio }: { solicitud: SolicitudInsumos; onCambio: () => void }) {
  const { usuario } = useAuth()
  const puede = ['GERENTE', 'LOGISTICA', 'COCINA'].includes(usuario?.rol ?? '')
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [abierto, setAbierto] = useState(false)
  const cargar = useCallback(() => {
    EntregasApi.listar({ solicitudId: solicitud.id }).then(setEntregas).catch(() => setEntregas([]))
  }, [solicitud.id])
  useEffect(cargar, [cargar])

  return (
    <Tarjeta
      titulo="Entrega en cocina"
      acciones={puede && ACTIVA.includes(solicitud.estado) && !abierto ? (
        <button className={botonPrimario} onClick={() => setAbierto(true)}>+ Registrar entrega</button>
      ) : undefined}
    >
      {abierto && (
        <FormEntrega solicitud={solicitud} onCerrar={() => setAbierto(false)} onGuardado={() => { setAbierto(false); cargar(); onCambio() }} />
      )}
      <Tabla cabecera={['Fecha', 'Lugar', 'Entregó', 'Recibió', 'Conformidad', '']}>
        {entregas.length === 0 && <Vacio columnas={6} texto="Todavía no se entregaron insumos en cocina." />}
        {entregas.map((e) => (
          <tr key={e.id}>
            <td className="px-2 py-2.5 whitespace-nowrap">{fechaHoraCorta(e.fechaHora)}</td>
            <td className="px-2 py-2.5">{e.lugar}</td>
            <td className="px-2 py-2.5">{e.entregadoPor.nombre}</td>
            <td className="px-2 py-2.5">{e.recibidoPor.nombre}</td>
            <td className="px-2 py-2.5"><Etiqueta className={CONFORMIDAD_COLOR[e.conformidad]}>{CONFORMIDAD_ETIQUETA[e.conformidad]}</Etiqueta></td>
            <td className="px-2 py-2.5 text-right"><button className={botonSecundario} onClick={() => pdfEntrega(e)}>PDF</button></td>
          </tr>
        ))}
      </Tabla>
    </Tarjeta>
  )
}

function FormEntrega({ solicitud, onCerrar, onGuardado }: { solicitud: SolicitudInsumos; onCerrar: () => void; onGuardado: () => void }) {
  const [receptores, setReceptores] = useState<{ id: string; nombre: string }[]>([])
  const [recibidoPorId, setRecibidoPorId] = useState('')
  const [lugar, setLugar] = useState('Cocina central')
  const [conformidad, setConformidad] = useState<Conformidad>('CONFORME')
  const [observaciones, setObservaciones] = useState('')
  const items = (solicitud.items ?? []).filter((i) => i.cantidad != null)
  const [filas, setFilas] = useState(() =>
    Object.fromEntries(items.map((i) => [i.id, { cantidad: i.cantidad ?? '', conformidad: 'CONFORME' as Conformidad, observacion: '' }])),
  )
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  useEffect(() => { EntregasApi.receptores().then(setReceptores).catch(() => setReceptores([])) }, [])
  const set = (id: string, c: Partial<{ cantidad: string; conformidad: Conformidad; observacion: string }>) =>
    setFilas((f) => ({ ...f, [id]: { ...f[id], ...c } }))

  const guardar = async () => {
    setError('')
    if (!recibidoPorId) return setError('Indique quién recibe en cocina.')
    setEnviando(true)
    try {
      await EntregasApi.crear({
        solicitudId: solicitud.id, recibidoPorId, lugar, conformidad, observaciones: observaciones || undefined,
        items: items.map((i) => ({
          solicitudItemId: i.id, cantidadRecibida: Number(filas[i.id].cantidad || 0),
          conformidad: filas[i.id].conformidad, observacion: filas[i.id].observacion || undefined,
        })),
      })
      onGuardado()
    } catch (e) {
      setError(mensajeError(e, 'No se pudo registrar la entrega.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mb-5 space-y-4 rounded-xl border border-brand/25 bg-kallpa-50/60 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo etiqueta="Recibe en cocina">
          <select className={campo} value={recibidoPorId} onChange={(e) => setRecibidoPorId(e.target.value)}>
            <option value="">Seleccione…</option>
            {receptores.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
        </Campo>
        <Campo etiqueta="Lugar"><input className={campo} value={lugar} onChange={(e) => setLugar(e.target.value)} /></Campo>
        <Campo etiqueta="Conformidad general">
          <select className={campo} value={conformidad} onChange={(e) => setConformidad(e.target.value as Conformidad)}>
            {Object.entries(CONFORMIDAD_ETIQUETA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Campo>
      </div>
      <Tabla cabecera={['Insumo', 'Solicitado', 'Recibido', 'Conformidad', 'Observación']}>
        {items.map((i) => (
          <tr key={i.id}>
            <td className="px-2 py-2 font-medium">{i.insumo?.nombre}</td>
            <td className="px-2 py-2 text-texto-2 whitespace-nowrap">{i.cantidad} {i.unidadCodigo}</td>
            <td className="px-2 py-2"><input className={`${campoCompacto} w-24`} type="number" min="0" step="any" value={filas[i.id].cantidad} onChange={(e) => set(i.id, { cantidad: e.target.value })} /></td>
            <td className="px-2 py-2">
              <select className={campoCompacto} value={filas[i.id].conformidad} onChange={(e) => set(i.id, { conformidad: e.target.value as Conformidad })}>
                {Object.entries(CONFORMIDAD_ETIQUETA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </td>
            <td className="px-2 py-2"><input className={`${campoCompacto} w-full`} placeholder="Ej.: faltó 1 kg" value={filas[i.id].observacion} onChange={(e) => set(i.id, { observacion: e.target.value })} /></td>
          </tr>
        ))}
      </Tabla>
      <Campo etiqueta="Observaciones (calidad y cantidad)"><textarea className={campo} rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} /></Campo>
      {error && <Alerta tipo="error">{error}</Alerta>}
      <div className="flex justify-end gap-2">
        <button className={botonSecundario} onClick={onCerrar}>Cancelar</button>
        <button className={botonPrimario} disabled={enviando} onClick={guardar}>{enviando ? 'Guardando…' : 'Guardar acta'}</button>
      </div>
      <p className="text-xs text-texto-2">Lo recibido se descuenta del inventario. Los insumos rechazados no se descuentan.</p>
    </div>
  )
}
