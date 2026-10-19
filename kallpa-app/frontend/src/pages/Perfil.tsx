import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { ROL_COLOR, etiquetaRol } from '../lib/roles'
import { Tarjeta } from '../components/ui'

export function Perfil() {
  const { usuario } = useAuth()
  if (!usuario) return null

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-deep text-xl font-bold text-white">
              {usuario.nombre.charAt(0).toUpperCase()}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{usuario.nombre}</h2>
              <p className="text-sm text-slate-500">{usuario.email}</p>
            </div>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ROL_COLOR[usuario.rol]}`}>
            {etiquetaRol(usuario.rol)}
          </span>
        </div>
      </section>

      <Tarjeta titulo="Datos de la cuenta">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Nombre</dt>
            <dd className="font-medium text-slate-800">{usuario.nombre}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Correo</dt>
            <dd className="font-medium text-slate-800">{usuario.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Rol</dt>
            <dd className="font-medium text-slate-800">{etiquetaRol(usuario.rol)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Contraseña</dt>
            <dd className="font-medium text-slate-800">
              {usuario.debeCambiarPassword ? 'Temporal — pendiente de cambio' : 'Actualizada'}
            </dd>
          </div>
        </dl>
      </Tarjeta>

      <Tarjeta titulo="Seguridad">
        <p className="mb-4 text-sm text-slate-500">
          Te recomendamos cambiar tu contraseña periódicamente y no compartirla.
        </p>
        <Link
          to="/cambiar-password"
          className="inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          Cambiar contraseña
        </Link>
      </Tarjeta>
    </div>
  )
}
