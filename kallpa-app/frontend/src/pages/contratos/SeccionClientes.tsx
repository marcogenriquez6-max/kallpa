import { useCallback, useEffect, useState } from 'react'
import { ClientesApi } from '../../lib/api'
import type { DatosCliente } from '../../lib/api'
import { botonPrimario, botonSecundario, campo } from '../../lib/catalogo'
import { TIPOS_CLIENTE, TIPO_CLIENTE_ETIQUETA } from '../../lib/contratos'
import type { Cliente, TipoCliente } from '../../types'
import { Alerta, Cargando, Etiqueta, Tarjeta } from '../../components/ui'

function ClienteForm({
  inicial,
  onCancel,
  onSaved,
}: {
  inicial: Cliente | null
  onCancel: () => void
  onSaved: () => void
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [tipo, setTipo] = useState<TipoCliente>(inicial?.tipo ?? 'SOCIAL')
  const [telefono, setTelefono] = useState(inicial?.telefono ?? '')
  const [ci, setCi] = useState(inicial?.ci ?? '')
  const [nit, setNit] = useState(inicial?.nit ?? '')
  const [razonSocial, setRazonSocial] = useState(inicial?.razonSocial ?? '')
  const [email, setEmail] = useState(inicial?.email ?? '')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const guardar = async () => {
    setError('')
    if (!nombre.trim()) return setError('El nombre es obligatorio.')
    if (telefono.trim().length < 5) return setError('El teléfono es obligatorio.')
    setEnviando(true)
    try {
      const body: DatosCliente = {
        nombre: nombre.trim(),
        tipo,
        telefono: telefono.trim(),
        ci: ci.trim() || undefined,
        nit: nit.trim() || undefined,
        razonSocial: razonSocial.trim() || undefined,
        email: email.trim() || undefined,
      }
      if (inicial) await ClientesApi.actualizar(inicial.id, body)
      else await ClientesApi.crear(body)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el cliente.')
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
          Nombre
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={`mt-1 ${campo}`}
            placeholder="Nombre o razón social"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Tipo de cliente
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCliente)}
            className={`mt-1 ${campo}`}
          >
            {TIPOS_CLIENTE.map((t) => (
              <option key={t} value={t}>
                {TIPO_CLIENTE_ETIQUETA[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Teléfono
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className={`mt-1 ${campo}`}
            placeholder="77712345"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          CI (opcional)
          <input value={ci} onChange={(e) => setCi(e.target.value)} className={`mt-1 ${campo}`} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          NIT (opcional)
          <input value={nit} onChange={(e) => setNit(e.target.value)} className={`mt-1 ${campo}`} />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Razón social (opcional)
          <input
            value={razonSocial}
            onChange={(e) => setRazonSocial(e.target.value)}
            className={`mt-1 ${campo}`}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Correo (opcional)
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1 ${campo}`}
          />
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

export function SeccionClientes({ puedeEditar }: { puedeEditar: boolean }) {
  const [clientes, setClientes] = useState<Cliente[] | null>(null)
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)

  const cargar = useCallback(async () => {
    setError('')
    try {
      setClientes(await ClientesApi.listar(q.trim() || undefined))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los clientes.')
    }
  }, [q])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const cerrar = () => {
    setMostrarForm(false)
    setEditando(null)
  }

  const exito = (mensaje: string) => {
    setOk(mensaje)
    cerrar()
    void cargar()
  }

  return (
    <Tarjeta
      titulo="Clientes"
      acciones={
        puedeEditar && !mostrarForm && !editando ? (
          <button onClick={() => setMostrarForm(true)} className={botonPrimario}>
            + Nuevo cliente
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {error && <Alerta tipo="error">{error}</Alerta>}
        {ok && <Alerta tipo="ok">{ok}</Alerta>}

        {(mostrarForm || editando) && (
          <ClienteForm
            inicial={editando}
            onCancel={cerrar}
            onSaved={() => exito(editando ? 'Cliente actualizado.' : 'Cliente creado.')}
          />
        )}

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, CI, NIT o teléfono…"
          className={campo}
        />

        {clientes === null ? (
          <Cargando />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4">Cliente</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Contacto</th>
                  <th className="py-2 pr-4 text-right">Contratos</th>
                  {puedeEditar && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-700">{c.nombre}</td>
                    <td className="py-2 pr-4">
                      <Etiqueta className="bg-slate-100 text-slate-600">
                        {TIPO_CLIENTE_ETIQUETA[c.tipo]}
                      </Etiqueta>
                    </td>
                    <td className="py-2 pr-4 text-slate-600">
                      <span className="tabular-nums">{c.telefono}</span>
                      {c.email && <span className="block text-xs text-slate-400">{c.email}</span>}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{c._count?.contratos ?? 0}</td>
                    {puedeEditar && (
                      <td className="py-2 text-right">
                        <button
                          onClick={() => {
                            setMostrarForm(false)
                            setEditando(c)
                          }}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No hay clientes registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Tarjeta>
  )
}
