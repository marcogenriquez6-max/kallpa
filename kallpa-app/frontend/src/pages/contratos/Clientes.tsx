import { useAuth } from '../../lib/auth'
import { Alerta } from '../../components/ui'
import { SeccionClientes } from './SeccionClientes'

export function Clientes() {
  const { usuario } = useAuth()
  const puedeEditar = usuario?.rol === 'GERENTE' || usuario?.rol === 'GERENTE_GASTRONOMICO'

  return (
    <div className="space-y-5">
      {!puedeEditar && (
        <Alerta tipo="info">Tu rol tiene acceso de solo lectura al directorio de clientes.</Alerta>
      )}
      <SeccionClientes puedeEditar={puedeEditar} />
    </div>
  )
}
