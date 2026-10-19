import { Link } from 'react-router-dom'

export function NoEncontrado() {
  return (
    <div className="grid place-items-center py-20 text-center">
      <p className="text-5xl font-black text-brand/30">404</p>
      <h1 className="mt-3 text-lg font-semibold text-slate-800">Página no encontrada</h1>
      <p className="mt-1 text-sm text-slate-500">La dirección que buscas no existe o fue movida.</p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
