import { useCallback, useEffect, useState } from 'react'
import { InsumosApi, ProveedoresApi } from '../../lib/api'
import { botonPrimario, campo } from '../../lib/catalogo'
import { CONDICION_PAGO_ETIQUETA, estrellas } from '../../lib/proveedores'
import { useAuth } from '../../lib/auth'
import type { Insumo, Proveedor } from '../../types'
import { Alerta, Cargando, Etiqueta, Tarjeta } from '../../components/ui'
import { ProveedorForm } from './ProveedorForm'
import { ProveedorDetalle } from './ProveedorDetalle'

export function Proveedores() {
  const { usuario } = useAuth()
  const puedeEditar = usuario?.rol === 'GERENTE' || usuario?.rol === 'LOGISTICA'

  const [proveedores, setProveedores] = useState<Proveedor[] | null>(null)
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [q, setQ] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('true')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Proveedor | null>(null)
  const [seleccionado, setSeleccionado] = useState<Proveedor | null>(null)

  const cargar = useCallback(async () => {
    setError('')
    try {
      const activo = filtroActivo === '' ? undefined : filtroActivo === 'true'
      setProveedores(await ProveedoresApi.listar({ q: q.trim() || undefined, activo }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los proveedores.')
    }
  }, [q, filtroActivo])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    InsumosApi.listar({ activo: true })
      .then(setInsumos)
      .catch(() => setInsumos([]))
  }, [])

  const verDetalle = useCallback(async (id: string) => {
    try {
      setSeleccionado(await ProveedoresApi.obtener(id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el proveedor.')
    }
  }, [])

  const cerrarForm = () => {
    setMostrarForm(false)
    setEditando(null)
  }

  const guardado = (proveedor: Proveedor) => {
    setOk(editando ? 'Proveedor actualizado.' : 'Proveedor creado.')
    const eraEdicion = Boolean(editando)
    cerrarForm()
    void cargar()
    if (eraEdicion && seleccionado?.id === proveedor.id) void verDetalle(proveedor.id)
  }

  const recargarDetalle = () => {
    if (seleccionado) void verDetalle(seleccionado.id)
  }

  return (
    <div className="space-y-5">
      {error && <Alerta tipo="error">{error}</Alerta>}
      {ok && <Alerta tipo="ok">{ok}</Alerta>}

      <Tarjeta
        titulo="Proveedores"
        acciones={
          puedeEditar && !mostrarForm && !editando ? (
            <button
              onClick={() => {
                setOk('')
                setMostrarForm(true)
              }}
              className={botonPrimario}
            >
              + Nuevo proveedor
            </button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          {(mostrarForm || editando) && (
            <ProveedorForm inicial={editando} onCancel={cerrarForm} onSaved={guardado} />
          )}

          <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, contacto, NIT o teléfono…"
              className={campo}
            />
            <select
              value={filtroActivo}
              onChange={(e) => setFiltroActivo(e.target.value)}
              className={campo}
            >
              <option value="true">Solo activos</option>
              <option value="false">Solo inactivos</option>
              <option value="">Todos</option>
            </select>
          </div>

          {proveedores === null ? (
            <Cargando />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="py-2 pr-4">Proveedor</th>
                    <th className="py-2 pr-4">Contacto</th>
                    <th className="py-2 pr-4">Condición</th>
                    <th className="py-2 pr-4">Insumos</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map((p) => (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-100 ${
                        seleccionado?.id === p.id ? 'bg-brand-100/30' : ''
                      }`}
                    >
                      <td className="py-2 pr-4">
                        <span className="font-medium text-slate-700">{p.razonSocial}</span>
                        {!p.activo && (
                          <Etiqueta className="ml-2 bg-slate-200 text-slate-600">inactivo</Etiqueta>
                        )}
                        <span className="block text-xs text-amber-500">
                          {estrellas(p.calificacion)}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-slate-600">
                        {p.nombreContacto && <span className="block">{p.nombreContacto}</span>}
                        {(p.telefono || p.whatsapp) && (
                          <span className="block text-xs text-slate-400 tabular-nums">
                            {p.telefono}
                            {p.whatsapp && ` · ${p.whatsapp}`}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-slate-600">
                        {CONDICION_PAGO_ETIQUETA[p.condicionPago]}
                      </td>
                      <td className="py-2 pr-4 tabular-nums text-slate-500">
                        {p._count?.insumos ?? 0}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => void verDetalle(p.id)}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                  {proveedores.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No hay proveedores que coincidan con el filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Tarjeta>

      {seleccionado && (
        <Tarjeta
          titulo={seleccionado.razonSocial}
          acciones={
            <button
              type="button"
              onClick={() => setSeleccionado(null)}
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Cerrar
            </button>
          }
        >
          <ProveedorDetalle
            proveedor={seleccionado}
            insumos={insumos}
            puedeEditar={puedeEditar}
            onEditar={() => {
              setOk('')
              setEditando(seleccionado)
              setMostrarForm(false)
            }}
            onPrecioGuardado={() => {
              setOk('Precio registrado.')
              recargarDetalle()
            }}
          />
        </Tarjeta>
      )}
    </div>
  )
}
