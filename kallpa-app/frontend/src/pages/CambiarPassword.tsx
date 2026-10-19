import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthApi } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Alerta } from '../components/ui'

function valida(p: string): string | null {
  if (p.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres.'
  if (!/[a-zA-Z]/.test(p) || !/\d/.test(p)) return 'Debe combinar letras y números.'
  return null
}

export function CambiarPassword() {
  const { usuario, logout, refrescar } = useAuth()
  const navegar = useNavigate()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [enviando, setEnviando] = useState(false)

  const obligatorio = !!usuario?.debeCambiarPassword

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setOk('')
    const v = valida(nueva)
    if (!actual) return setError('Ingresa tu contraseña actual.')
    if (v) return setError(v)
    if (nueva !== repetir) return setError('Las contraseñas nuevas no coinciden.')
    if (nueva === actual) return setError('La nueva contraseña debe ser distinta a la actual.')

    setEnviando(true)
    try {
      await AuthApi.cambiarPassword(actual, nueva)
      await refrescar()
      setOk('Contraseña actualizada correctamente.')
      setActual('')
      setNueva('')
      setRepetir('')
      if (obligatorio) navegar('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-bold text-slate-800">Cambiar contraseña</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">
          {obligatorio
            ? 'Por seguridad, debes cambiar tu contraseña antes de continuar.'
            : 'Elige una nueva contraseña para tu cuenta.'}
        </p>

        <form onSubmit={enviar} className="space-y-4" noValidate>
          <label className="block text-sm font-medium text-slate-700">
            Contraseña actual
            <input
              type="password"
              autoComplete="current-password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Nueva contraseña
            <input
              type="password"
              autoComplete="new-password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
            <span className="mt-1 block text-xs text-slate-400">
              Mínimo 8 caracteres, con letras y números.
            </span>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Repetir nueva contraseña
            <input
              type="password"
              autoComplete="new-password"
              value={repetir}
              onChange={(e) => setRepetir(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
            />
          </label>

          {error && <Alerta tipo="error">{error}</Alerta>}
          {ok && <Alerta tipo="ok">{ok}</Alerta>}

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {enviando ? 'Guardando…' : 'Guardar contraseña'}
            </button>
            {!obligatorio && (
              <button
                type="button"
                onClick={() => navegar('/')}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-300"
              >
                Cancelar
              </button>
            )}
            {obligatorio && (
              <button
                type="button"
                onClick={() => {
                  logout()
                  navegar('/login', { replace: true })
                }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:border-slate-300"
              >
                Cerrar sesión
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
