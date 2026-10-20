import { useEffect, useState, type ReactNode } from 'react'
import { ContratosApi } from '../../lib/api'
import { campo } from '../../lib/catalogo'
import { ESTADO_ETIQUETA, fechaCorta } from '../../lib/contratos'
import type { Contrato, EstadoContrato } from '../../types'

/** Lista de contratos (opcionalmente filtrada por estado) para los selectores. */
export function useContratos(estados?: EstadoContrato[]) {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const clave = estados?.join(',') ?? ''
  useEffect(() => {
    ContratosApi.listar()
      .then((cs) => setContratos(clave ? cs.filter((c) => clave.split(',').includes(c.estado)) : cs))
      .catch(() => setContratos([]))
  }, [clave])
  return contratos
}

export function SelectorContrato({
  contratos, valor, onCambio, vacio = 'Seleccione un contrato…',
}: { contratos: Contrato[]; valor: string; onCambio: (id: string) => void; vacio?: string }) {
  return (
    <select className={campo} value={valor} onChange={(e) => onCambio(e.target.value)}>
      <option value="">{vacio}</option>
      {contratos.map((c) => (
        <option key={c.id} value={c.id}>
          {c.codigo} · {c.tipoEvento} · {fechaCorta(c.fechaEvento)} · {c.cliente?.nombre ?? ''} ({ESTADO_ETIQUETA[c.estado]})
        </option>
      ))}
    </select>
  )
}

export function Campo({ etiqueta, children, className = '' }: { etiqueta: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-texto-2">{etiqueta}</span>
      {children}
    </label>
  )
}

export function Kpi({ etiqueta, valor, tono = 'normal' }: { etiqueta: string; valor: string; tono?: 'normal' | 'bueno' | 'malo' | 'marca' }) {
  const t = {
    normal: 'bg-white border-linea text-grafito',
    bueno: 'bg-white border-linea text-exito',
    malo: 'bg-white border-linea text-brand',
    marca: 'bg-brand border-brand text-white',
  }[tono]
  return (
    <div className={`rounded-xl border p-4 ${t}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wider ${tono === 'marca' ? 'text-white/75' : 'text-texto-2'}`}>{etiqueta}</p>
      <p className="mt-1 font-title text-xl font-semibold tabular-nums">{valor}</p>
    </div>
  )
}

export function Tabla({ cabecera, children, derecha = [] }: { cabecera: string[]; children: ReactNode; derecha?: number[] }) {
  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-linea text-left text-[11px] uppercase tracking-wider text-texto-2">
            {cabecera.map((h, i) => (
              <th key={h + i} className={`px-2 py-2 font-semibold ${derecha.includes(i) ? 'text-right' : ''}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-linea">{children}</tbody>
      </table>
    </div>
  )
}

export function Vacio({ columnas, texto = 'Sin registros todavía.' }: { columnas: number; texto?: string }) {
  return (
    <tr>
      <td colSpan={columnas} className="px-2 py-8 text-center text-texto-2">{texto}</td>
    </tr>
  )
}

export const mensajeError = (e: unknown, def = 'Ocurrió un error.') => (e instanceof Error ? e.message : def)
