import { useState } from 'react'
import { ProveedoresApi } from '../../lib/api'
import { aBs, botonPrimario, campo } from '../../lib/catalogo'
import { CONDICION_PAGO_ETIQUETA, estrellas } from '../../lib/proveedores'
import { fechaCorta } from '../../lib/contratos'
import type { Insumo, Proveedor } from '../../types'
import { Alerta, Etiqueta } from '../../components/ui'

function RegistrarPrecio({
  proveedorId,
  insumos,
  onSaved,
}: {
  proveedorId: string
  insumos: Insumo[]
  onSaved: () => void
}) {
  const [insumoId, setInsumoId] = useState('')
  const [precio, setPrecio] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const guardar = async () => {
    setError('')
    if (!insumoId) return setError('Selecciona un insumo.')
    const n = Number(precio)
    if (!n || n <= 0) return setError('Ingresa un precio válido.')
    setEnviando(true)
    try {
      await ProveedoresApi.registrarPrecio(proveedorId, { insumoId, precioUnitario: n })
      setInsumoId('')
      setPrecio('')
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar el precio.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <h4 className="mb-2 text-sm font-semibold text-slate-700">Registrar precio de insumo</h4>
      {error && (
        <div className="mb-2">
          <Alerta tipo="error">{error}</Alerta>
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
        <select value={insumoId} onChange={(e) => setInsumoId(e.target.value)} className={campo}>
          <option value="">Selecciona un insumo…</option>
          {insumos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre} ({i.unidadBaseCodigo})
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          step="0.01"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className={campo}
          placeholder="Precio por unidad"
        />
        <button type="button" onClick={guardar} className={botonPrimario} disabled={enviando}>
          {enviando ? 'Guardando…' : 'Registrar'}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Precio por unidad base del insumo. Alimenta el costeo de las fichas técnicas.
      </p>
    </div>
  )
}

export function ProveedorDetalle({
  proveedor,
  insumos,
  puedeEditar,
  onEditar,
  onPrecioGuardado,
}: {
  proveedor: Proveedor
  insumos: Insumo[]
  puedeEditar: boolean
  onEditar: () => void
  onPrecioGuardado: () => void
}) {
  const campos: { etiqueta: string; valor?: string | null }[] = [
    { etiqueta: 'Contacto', valor: proveedor.nombreContacto },
    { etiqueta: 'NIT / CI', valor: proveedor.nitOCi },
    { etiqueta: 'Teléfono', valor: proveedor.telefono },
    { etiqueta: 'WhatsApp', valor: proveedor.whatsapp },
    { etiqueta: 'Ubicación', valor: proveedor.ubicacionMercado },
    { etiqueta: 'Dirección', valor: proveedor.direccion },
    { etiqueta: 'Observaciones', valor: proveedor.observaciones },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Etiqueta className={proveedor.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}>
          {proveedor.activo ? 'Activo' : 'Inactivo'}
        </Etiqueta>
        <Etiqueta className="bg-slate-100 text-slate-600">
          {CONDICION_PAGO_ETIQUETA[proveedor.condicionPago]}
        </Etiqueta>
        {proveedor.emiteFactura && (
          <Etiqueta className="bg-sky-100 text-sky-800">Emite factura</Etiqueta>
        )}
        <span className="text-sm text-amber-500">{estrellas(proveedor.calificacion)}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {campos
          .filter((c) => c.valor)
          .map((c) => (
            <div key={c.etiqueta}>
              <p className="text-xs text-slate-500">{c.etiqueta}</p>
              <p className="text-slate-700">{c.valor}</p>
            </div>
          ))}
      </div>

      {puedeEditar && (
        <div className="flex gap-2">
          <button type="button" onClick={onEditar} className={botonPrimario}>
            Editar proveedor
          </button>
        </div>
      )}

      {puedeEditar && (
        <RegistrarPrecio proveedorId={proveedor.id} insumos={insumos} onSaved={onPrecioGuardado} />
      )}

      <div>
        <h4 className="mb-2 text-sm font-semibold text-slate-700">Historial de precios</h4>
        {proveedor.insumos && proveedor.insumos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4">Insumo</th>
                  <th className="py-2 pr-4">Unidad</th>
                  <th className="py-2 pr-4 text-right">Precio</th>
                  <th className="py-2 pr-4">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {proveedor.insumos.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 text-slate-700">{p.insumo?.nombre ?? p.insumoId}</td>
                    <td className="py-2 pr-4 font-mono text-slate-500">
                      {p.insumo?.unidadBaseCodigo ?? '—'}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">
                      {aBs(Number(p.precioUnitario))}
                    </td>
                    <td className="py-2 pr-4 text-slate-500">{fechaCorta(p.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">Sin precios registrados.</p>
        )}
      </div>
    </div>
  )
}
