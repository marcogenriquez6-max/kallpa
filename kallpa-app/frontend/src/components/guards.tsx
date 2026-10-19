import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import type { Rol } from '../types'
import { Cargando } from './ui'

/** Exige sesión iniciada. Manda a cambiar la contraseña si es obligatorio. */
export function RequireAuth() {
  const { usuario, cargando } = useAuth()
  if (cargando) return <Cargando />
  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.debeCambiarPassword) return <Navigate to="/cambiar-password" replace />
  return <Outlet />
}

/** Página de cambio de contraseña: requiere sesión, pero no bloquea. */
export function CambiarPasswordGate({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <Cargando />
  if (!usuario) return <Navigate to="/login" replace />
  return <>{children}</>
}

/** Restringe el contenido a ciertos roles. */
export function RequireRole({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const { usuario } = useAuth()
  if (usuario && !roles.includes(usuario.rol)) return <Navigate to="/" replace />
  return <>{children}</>
}
