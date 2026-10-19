import type { ReactNode } from 'react'

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center gap-3 text-texto-2">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand/25 border-t-brand" />
      {texto}
    </div>
  )
}

export function Alerta({
  tipo = 'error',
  children,
}: {
  tipo?: 'error' | 'ok' | 'info'
  children: ReactNode
}) {
  if (!children) return null
  const estilos = {
    error: 'bg-kallpa-50 text-kallpa-800 border-kallpa-200',
    ok: 'bg-exito-suave text-exito border-[#bfe3d0]',
    info: 'bg-atencion-suave text-atencion border-[#ecd9ab]',
  }[tipo]
  return <div className={`rounded-md border px-4 py-3 text-sm ${estilos}`}>{children}</div>
}

export function Tarjeta({
  titulo,
  acciones,
  children,
  className = '',
}: {
  titulo?: ReactNode
  acciones?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-linea bg-white p-6 ${className}`}>
      {(titulo || acciones) && (
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {titulo && <h2 className="font-title text-xl font-semibold text-grafito">{titulo}</h2>}
          {acciones}
        </header>
      )}
      {children}
    </section>
  )
}

export function Etiqueta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {children}
    </span>
  )
}
