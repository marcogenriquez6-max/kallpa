import { useState } from 'react'
import { useAuth } from '../../lib/auth'
import { Alerta } from '../../components/ui'
import { SeccionItems } from './SeccionItems'
import { SeccionInsumos } from './SeccionInsumos'
import { SeccionCategorias } from './SeccionCategorias'
import { SeccionUnidades } from './SeccionUnidades'

type Pestana = 'items' | 'insumos' | 'categorias' | 'unidades'

const PESTANAS: Array<{ id: Pestana; label: string }> = [
  { id: 'items', label: 'Ítems y fichas' },
  { id: 'insumos', label: 'Insumos' },
  { id: 'categorias', label: 'Categorías' },
  { id: 'unidades', label: 'Unidades' },
]

export function Catalogo() {
  const { usuario } = useAuth()
  const puedeEditar = usuario?.rol === 'GERENTE' || usuario?.rol === 'GERENTE_GASTRONOMICO'
  const [pestana, setPestana] = useState<Pestana>('items')

  return (
    <div className="space-y-5">
      {!puedeEditar && (
        <Alerta tipo="info">Tu rol tiene acceso de solo lectura al catálogo.</Alerta>
      )}

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPestana(p.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              pestana === p.id
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pestana === 'items' && <SeccionItems puedeEditar={puedeEditar} />}
      {pestana === 'insumos' && <SeccionInsumos puedeEditar={puedeEditar} />}
      {pestana === 'categorias' && <SeccionCategorias puedeEditar={puedeEditar} />}
      {pestana === 'unidades' && <SeccionUnidades puedeEditar={puedeEditar} />}
    </div>
  )
}
