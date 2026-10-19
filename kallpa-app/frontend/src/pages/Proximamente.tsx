import { IconHerramienta } from '../components/icons'

export function Proximamente({ modulo }: { modulo: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-xl bg-kallpa-100 text-brand">
        <IconHerramienta className="h-7 w-7" />
      </span>
      <h2 className="font-title text-lg font-semibold text-grafito">{modulo}</h2>
      <p className="mt-1 max-w-md text-sm text-texto-2">
        Este módulo está planificado y se habilitará en una próxima versión del sistema.
      </p>
      <span className="mt-5 rounded-full bg-atencion-suave px-4 py-1 text-xs font-bold uppercase tracking-[0.14em] text-atencion">
        Próximamente
      </span>
    </div>
  )
}
