import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { UsuariosApi } from '../lib/api'
import { ROLES, ROL_COLOR, etiquetaRol } from '../lib/roles'
import type { Rol, Usuario } from '../types'
import { Alerta, Cargando, Etiqueta, Tarjeta } from '../components/ui'

export function Usuarios() {
  const [lista, setLista] = useState<Usuario[] | null>(null)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarNuevo, setMostrarNuevo] = useState(false)

  const cargar = useCallback(async () => {
    setError('')
    try {
      setLista(await UsuariosApi.listar())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la lista.')
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const filtrada = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!lista) return []
    if (!q) return lista
    return lista.filter(
      (u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [lista, busqueda])

  const alternarActivo = async (u: Usuario) => {
    setError('')
    setOk('')
    try {
      await UsuariosApi.actualizar(u.id, { activo: !(u.activo ?? true) })
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar.')
    }
  }

  const cambiarRol = async (u: Usuario, rol: Rol) => {
    setError('')
    setOk('')
    try {
      await UsuariosApi.actualizar(u.id, { rol })
      await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el rol.')
    }
  }

  return (
    <div className="space-y-5">
      {error && <Alerta tipo="error">{error}</Alerta>}
      {ok && <Alerta tipo="ok">{ok}</Alerta>}

      <Tarjeta
        titulo="Personal con acceso"
        acciones={
          <div className="flex gap-2">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand sm:w-56"
            />
            <button
              onClick={() => setMostrarNuevo((v) => !v)}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              {mostrarNuevo ? 'Cerrar' : 'Nuevo'}
            </button>
          </div>
        }
      >
        {mostrarNuevo && (
          <FormNuevo
            onCreado={() => {
              setMostrarNuevo(false)
              setOk('Usuario creado correctamente.')
              void cargar()
            }}
            onError={setError}
          />
        )}

        {!lista ? (
          <Cargando />
        ) : filtrada.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">Sin resultados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Nombre</th>
                  <th className="py-2 pr-3 font-semibold">Rol</th>
                  <th className="py-2 pr-3 font-semibold">Estado</th>
                  <th className="py-2 pr-3 font-semibold">Clave</th>
                  <th className="py-2 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtrada.map((u) => (
                  <tr key={u.id} className="align-middle">
                    <td className="py-3 pr-3">
                      <p className="font-medium text-slate-800">{u.nombre}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <select
                        value={u.rol}
                        onChange={(e) => cambiarRol(u, e.target.value as Rol)}
                        className={`rounded-lg border-0 px-2 py-1 text-xs font-semibold ${ROL_COLOR[u.rol]}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {etiquetaRol(r)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-3">
                      {(u.activo ?? true) ? (
                        <Etiqueta className="bg-emerald-100 text-emerald-800">Activo</Etiqueta>
                      ) : (
                        <Etiqueta className="bg-slate-200 text-slate-600">Inactivo</Etiqueta>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {u.debeCambiarPassword ? (
                        <Etiqueta className="bg-amber-100 text-amber-800">Temporal</Etiqueta>
                      ) : (
                        <Etiqueta className="bg-slate-100 text-slate-600">Definida</Etiqueta>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <RestablecerBoton u={u} onHecho={cargar} onError={setError} />
                        <button
                          onClick={() => alternarActivo(u)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300"
                        >
                          {(u.activo ?? true) ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  )
}

function FormNuevo({
  onCreado,
  onError,
}: {
  onCreado: () => void
  onError: (m: string) => void
}) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<Rol>('LOGISTICA')
  const [passwordTemporal, setPasswordTemporal] = useState('')

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    onError('')
    if (!nombre.trim() || !email.trim()) return onError('Nombre y correo son obligatorios.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return onError('Correo inválido.')
    if (passwordTemporal.length < 8) return onError('La contraseña temporal debe tener 8+ caracteres.')
    try {
      await UsuariosApi.crear({ nombre: nombre.trim(), email: email.trim(), rol, passwordTemporal })
      onCreado()
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo crear el usuario.')
    }
  }

  const input =
    'mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand'
  return (
    <form
      onSubmit={async (e) => {
        await enviar(e)
      }}
      className="mb-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"
      noValidate
    >
      <label className="text-sm font-medium text-slate-700">
        Nombre completo
        <input className={input} value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Correo
        <input
          type="email"
          className={input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nombre@kallpa.bo"
        />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Rol
        <select className={input} value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {etiquetaRol(r)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Contraseña temporal
        <input
          className={input}
          value={passwordTemporal}
          onChange={(e) => setPasswordTemporal(e.target.value)}
          placeholder="Mínimo 8 caracteres"
        />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Crear usuario
        </button>
      </div>
    </form>
  )
}

function RestablecerBoton({
  u,
  onHecho,
  onError,
}: {
  u: Usuario
  onHecho: () => Promise<void> | void
  onError: (m: string) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [clave, setClave] = useState('')
  const [enviando, setEnviando] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (clave.length < 8) return onError('La contraseña debe tener al menos 8 caracteres.')
    setEnviando(true)
    try {
      await UsuariosApi.restablecer(u.id, clave)
      setAbierto(false)
      setClave('')
      await onHecho()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo restablecer.')
    } finally {
      setEnviando(false)
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300"
      >
        Restablecer clave
      </button>
    )
  }

  return (
    <form onSubmit={enviar} className="flex items-center gap-1">
      <input
        autoFocus
        value={clave}
        onChange={(e) => setClave(e.target.value)}
        placeholder="Clave temporal"
        className="w-36 rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-brand"
      />
      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
      >
        OK
      </button>
      <button
        type="button"
        onClick={() => setAbierto(false)}
        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-500"
      >
        ✕
      </button>
    </form>
  )
}
