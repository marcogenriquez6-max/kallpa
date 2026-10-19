import { useState } from 'react'
import { ProveedoresApi } from '../../lib/api'
import type { DatosProveedor } from '../../lib/api'
import { botonPrimario, botonSecundario, campo } from '../../lib/catalogo'
import { CONDICIONES_PAGO, CONDICION_PAGO_ETIQUETA } from '../../lib/proveedores'
import type { CondicionPago, Proveedor } from '../../types'
import { Alerta } from '../../components/ui'

export function ProveedorForm({
  inicial,
  onCancel,
  onSaved,
}: {
  inicial: Proveedor | null
  onCancel: () => void
  onSaved: (proveedor: Proveedor) => void
}) {
  const [razonSocial, setRazonSocial] = useState(inicial?.razonSocial ?? '')
  const [nombreContacto, setNombreContacto] = useState(inicial?.nombreContacto ?? '')
  const [nitOCi, setNitOCi] = useState(inicial?.nitOCi ?? '')
  const [telefono, setTelefono] = useState(inicial?.telefono ?? '')
  const [whatsapp, setWhatsapp] = useState(inicial?.whatsapp ?? '')
  const [direccion, setDireccion] = useState(inicial?.direccion ?? '')
  const [ubicacionMercado, setUbicacionMercado] = useState(inicial?.ubicacionMercado ?? '')
  const [condicionPago, setCondicionPago] = useState<CondicionPago>(inicial?.condicionPago ?? 'CONTADO')
  const [emiteFactura, setEmiteFactura] = useState(inicial?.emiteFactura ?? false)
  const [calificacion, setCalificacion] = useState(String(inicial?.calificacion ?? ''))
  const [observaciones, setObservaciones] = useState(inicial?.observaciones ?? '')
  const [activo, setActivo] = useState(inicial?.activo ?? true)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const guardar = async () => {
    setError('')
    if (razonSocial.trim().length < 2) return setError('La razón social es obligatoria.')
    setEnviando(true)
    try {
      const body: DatosProveedor = {
        razonSocial: razonSocial.trim(),
        nombreContacto: nombreContacto.trim() || undefined,
        nitOCi: nitOCi.trim() || undefined,
        telefono: telefono.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        direccion: direccion.trim() || undefined,
        ubicacionMercado: ubicacionMercado.trim() || undefined,
        condicionPago,
        emiteFactura,
        calificacion: calificacion ? Number(calificacion) : undefined,
        observaciones: observaciones.trim() || undefined,
        activo,
      }
      const guardado = inicial
        ? await ProveedoresApi.actualizar(inicial.id, body)
        : await ProveedoresApi.crear(body)
      onSaved(guardado)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el proveedor.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="rounded-xl border border-brand/30 bg-brand-100/30 p-4">
      {error && (
        <div className="mb-3">
          <Alerta tipo="error">{error}</Alerta>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Razón social / nombre
          <input
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            className={`mt-1 ${campo}`}
            placeholder="Distribuidora Andina S.R.L."
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Condición de pago
          <select
            value={condicionPago}
            onChange={(e) => setCondicionPago(e.target.value as CondicionPago)}
            className={`mt-1 ${campo}`}
          >
            {CONDICIONES_PAGO.map((c) => (
              <option key={c} value={c}>
                {CONDICION_PAGO_ETIQUETA[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Nombre de contacto
          <input
            value={nombreContacto}
            onChange={(e) => setNombreContacto(e.target.value)}
            className={`mt-1 ${campo}`}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          NIT / CI
          <input value={nitOCi} onChange={(e) => setNitOCi(e.target.value)} className={`mt-1 ${campo}`} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Calificación
          <select
            value={calificacion}
            onChange={(e) => setCalificacion(e.target.value)}
            className={`mt-1 ${campo}`}
          >
            <option value="">Sin calificar</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)}
                {n} / 5
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Teléfono
          <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={`mt-1 ${campo}`} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          WhatsApp
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={`mt-1 ${campo}`} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Ubicación / mercado
          <input
            value={ubicacionMercado}
            onChange={(e) => setUbicacionMercado(e.target.value)}
            className={`mt-1 ${campo}`}
            placeholder="Mercado 25 de Mayo, puesto 12"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-3">
          Dirección
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className={`mt-1 ${campo}`} />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-3">
          Observaciones
          <input
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className={`mt-1 ${campo}`}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={emiteFactura}
            onChange={(e) => setEmiteFactura(e.target.checked)}
          />
          Emite factura
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Proveedor activo
        </label>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={botonSecundario} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" onClick={guardar} className={botonPrimario} disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
