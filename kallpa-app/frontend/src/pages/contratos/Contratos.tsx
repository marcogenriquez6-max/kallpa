import { useState } from 'react'
import { useAuth } from '../../lib/auth'
import { Alerta } from '../../components/ui'
import { SeccionClientes } from './SeccionClientes'
import { SeccionContratos } from './SeccionContratos'

type Pestana = 'contratos' | 'clientes'

const PESTANAS: { id: Pestana; label: string }[] = [
  { id: 'contratos', label: 'Contratos' },
  { id: 'clientes', label: 'Clientes' },
]

export function Contratos() {
  const { usuario } = useAuth()
  const puedeEditar = usuario?.rol === 'GERENTE' || usuario?.rol === 'GERENTE_GASTRONOMICO'
  const [pestana, setPestana] = useState<Pestana>('contratos')

  return (
    <div className="space-y-5">
      {!puedeEditar && (
        <Alerta tipo="info">Tu rol tiene acceso de solo lectura a los contratos.</Alerta>
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

      {pestana === 'contratos' && <SeccionContratos puedeEditar={puedeEditar} />}
      {pestana === 'clientes' && <SeccionClientes puedeEditar={puedeEditar} />}
    </div>
  )
}
