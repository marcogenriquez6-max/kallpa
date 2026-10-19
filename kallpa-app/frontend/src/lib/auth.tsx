import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Usuario } from '../types'
import { AuthApi, getToken, setToken } from './api'

interface AuthContexto {
  usuario: Usuario | null
  cargando: boolean
  login: (email: string, password: string) => Promise<Usuario>
  logout: () => void
  refrescar: () => Promise<void>
  setUsuario: (usuario: Usuario) => void
}

const Contexto = createContext<AuthContexto | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let activo = true
    const carga = async () => {
      if (getToken()) {
        try {
          const u = await AuthApi.perfil()
          if (activo) setUsuario(u)
        } catch {
          setToken(null)
        }
      }
      if (activo) setCargando(false)
    }
    void carga()
    return () => {
      activo = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const r = await AuthApi.login(email, password)
    setToken(r.token)
    setUsuario(r.usuario)
    return r.usuario
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUsuario(null)
  }, [])

  const refrescar = useCallback(async () => {
    setUsuario(await AuthApi.perfil())
  }, [])

  return (
    <Contexto.Provider value={{ usuario, cargando, login, logout, refrescar, setUsuario }}>
      {children}
    </Contexto.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContexto {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
