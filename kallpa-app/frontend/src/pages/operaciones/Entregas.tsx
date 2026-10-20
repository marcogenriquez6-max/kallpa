import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Etiqueta, Tarjeta } from '../../components/ui'
import { SolicitudesApi } from '../../lib/api'
import { botonSecundario } from '../../lib/catalogo'
import { fechaCorta } from '../../lib/contratos'
import { CONFORMIDAD_COLOR, CONFORMIDAD_ETIQUETA, EntregasApi, fechaHoraCorta, type Entrega } from '../../lib/operaciones'
import { pdfEntrega } from '../../lib/pdf'
import { ESTADO_SOLICITUD_COLOR, ESTADO_SOLICITUD_ETIQUETA } from '../../lib/solicitudes'
import type { SolicitudInsumos } from '../../types'
import { Tabla, Vacio } from './comun'

export function Entregas() {
  const [pendientes, setPendientes] = useState<SolicitudInsumos[]>([])
  const [entregas, setEntregas] = useState<Entrega[]>([])
  useEffect(() => {
    SolicitudesApi.listar()
      .then((s) => setPendientes(s.filter((x) => ['APROBADA', 'EN_COMPRA', 'ENTREGADA_PARCIAL'].includes(x.estado))))
      .catch(() => setPendientes([]))
    EntregasApi.listar().then(setEntregas).catch(() => setEntregas([]))
  }, [])

  return (
    <div className="space-y-5">
      <Tarjeta titulo="Por entregar en cocina">
        <Tabla cabecera={['Folio', 'Contrato', 'Evento', 'Estado', '']}>
          {pendientes.length === 0 && <Vacio columnas={5} texto="No hay solicitudes pendientes de entrega." />}
          {pendientes.map((s) => (
            <tr key={s.id}>
              <td className="px-2 py-2.5 font-mono text-xs">{s.folio}</td>
              <td className="px-2 py-2.5">{s.contrato?.codigo} · {s.contrato?.tipoEvento}</td>
              <td className="px-2 py-2.5">{s.contrato?.fechaEvento ? fechaCorta(s.contrato.fechaEvento) : '—'}</td>
              <td className="px-2 py-2.5"><Etiqueta className={ESTADO_SOLICITUD_COLOR[s.estado]}>{ESTADO_SOLICITUD_ETIQUETA[s.estado]}</Etiqueta></td>
              <td className="px-2 py-2.5 text-right"><Link className={botonSecundario} to={`/compras/${s.id}`}>Comprar / entregar</Link></td>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
      <Tarjeta titulo="Actas de entrega">
        <Tabla cabecera={['Fecha', 'Solicitud', 'Contrato', 'Recibió', 'Conformidad', '']}>
          {entregas.length === 0 && <Vacio columnas={6} />}
          {entregas.map((e) => (
            <tr key={e.id}>
              <td className="px-2 py-2.5 whitespace-nowrap">{fechaHoraCorta(e.fechaHora)}</td>
              <td className="px-2 py-2.5"><Link to={`/compras/${e.solicitud.id}`}>{e.solicitud.folio}</Link></td>
              <td className="px-2 py-2.5">{e.solicitud.contrato.codigo} · {e.solicitud.contrato.tipoEvento}</td>
              <td className="px-2 py-2.5">{e.recibidoPor.nombre}</td>
              <td className="px-2 py-2.5"><Etiqueta className={CONFORMIDAD_COLOR[e.conformidad]}>{CONFORMIDAD_ETIQUETA[e.conformidad]}</Etiqueta></td>
              <td className="px-2 py-2.5 text-right"><button className={botonSecundario} onClick={() => pdfEntrega(e)}>PDF</button></td>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
    </div>
  )
}
