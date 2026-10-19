import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Alerta, Cargando } from '../components/ui'

const campoLogin =
  'w-full rounded-md border border-linea bg-white px-3.5 py-2.5 text-grafito outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10'

export function Login() {
  const { usuario, cargando, login } = useAuth()
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando) return <Cargando />
  if (usuario) return <Navigate to={usuario.debeCambiarPassword ? '/cambiar-password' : '/'} replace />

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un correo válido.')
      return
    }
    if (!password) {
      setError('Ingresa tu contraseña.')
      return
    }
    setEnviando(true)
    try {
      const u = await login(email.trim(), password)
      navegar(u.debeCambiarPassword ? '/cambiar-password' : '/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-fondo p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-linea bg-white shadow-kallpaElev md:grid-cols-2">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-grafito p-8 text-white md:flex">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 h-60 w-60 rounded-full border border-white/10"
          />
          <span className="relative grid h-11 w-11 place-items-center rounded-md bg-brand font-title text-xl font-bold text-white">
            K
          </span>
          <div className="relative">
            <h2 className="mb-3 font-title text-2xl font-semibold leading-snug">
              Sistema interno de gestión
            </h2>
            <p className="text-sm text-white/70">
              Acceso exclusivo para el personal de KALLPA — Eventos y Alta Cocina.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/80">
              <li>• Eventos, clientes y contratos</li>
              <li>• Insumos, recetas y costos</li>
              <li>• Personal, logística y reportes</li>
            </ul>
          </div>
          <p className="relative text-xs text-white/50">Oruro — Bolivia</p>
        </aside>

        <main className="p-7 sm:p-10">
          <p className="inline-block rounded-full bg-kallpa-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
            Acceso trabajadores
          </p>
          <h1 className="mt-4 font-title text-2xl font-semibold text-grafito">Iniciar sesión</h1>
          <p className="mb-6 mt-1 text-sm text-texto-2">
            Ingresa con el correo y la contraseña que te asignaron.
          </p>

          <form onSubmit={enviar} className="space-y-4" noValidate>
            <label className="block text-sm font-medium text-grafito">
              Correo electrónico
              <input
                type="email"
                autoComplete="username"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@kallpa.bo"
                className={`mt-1.5 ${campoLogin}`}
              />
            </label>

            <label className="block text-sm font-medium text-grafito">
              Contraseña
              <span className="relative mt-1.5 block">
                <input
                  type={ver ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  className={`${campoLogin} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setVer((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-semibold text-brand hover:bg-brand/5"
                >
                  {ver ? 'Ocultar' : 'Ver'}
                </button>
              </span>
            </label>

            {error && <Alerta tipo="error">{error}</Alerta>}

            <button
              type="submit"
              disabled={enviando}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-brand px-4 py-3 font-semibold text-white transition hover:bg-brand-dark active:translate-y-px disabled:opacity-60"
            >
              {enviando && <span className="spin" aria-hidden="true" />}
              {enviando ? 'Ingresando…' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm">
            <a href="../" className="font-semibold text-brand hover:underline">
              ← Volver al sitio
            </a>
            <span className="text-texto-2">¿Sin acceso? Pídelo a tu encargado.</span>
          </div>
        </main>
      </div>
    </div>
  )
}
