import type { Rol } from '../types'

export const ROLES: Rol[] = [
  'GERENTE',
  'GERENTE_GASTRONOMICO',
  'LOGISTICA',
  'COCINA',
  'CONSULTA',
]

export const ROL_ETIQUETA: Record<Rol, string> = {
  GERENTE: 'Gerente',
  GERENTE_GASTRONOMICO: 'Gerente Gastronómico',
  LOGISTICA: 'Logística',
  COCINA: 'Cocina',
  CONSULTA: 'Consulta',
}

/** Color de la etiqueta de rol (clases Tailwind). */
export const ROL_COLOR: Record<Rol, string> = {
  GERENTE: 'bg-brand text-white',
  GERENTE_GASTRONOMICO: 'bg-kallpa-100 text-kallpa-700',
  LOGISTICA: 'bg-atencion-suave text-atencion',
  COCINA: 'bg-exito-suave text-exito',
  CONSULTA: 'bg-fondo text-texto-2',
}

export function etiquetaRol(rol: Rol | undefined): string {
  return rol ? ROL_ETIQUETA[rol] : '—'
}
