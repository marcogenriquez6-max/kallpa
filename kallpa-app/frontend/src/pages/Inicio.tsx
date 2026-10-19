import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { ClientesApi, ContratosApi, SolicitudesApi } from '../lib/api'
import { aBs } from '../lib/catalogo'
import { ESTADO_COLOR, ESTADO_ETIQUETA } from '../lib/contratos'
import { useAuth } from '../lib/auth'
import type { Cliente, Contrato, EstadoContrato, SolicitudInsumos } from '../types'
import { IconCliente, IconCompras, IconContrato, IconFinanzas } from '../components/icons'

const EN_CURSO: EstadoContrato[] = [
  'COTIZACION',
  'CONFIRMADO',
  'PLANIFICADO',
  'EN_COMPRA',
  'INSUMOS_ENTREGADOS',
  'EN_PRODUCCION',
]

function saludo(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function mesCorto(iso: string): string {
  return new Date(iso).toLocaleDateString('es-BO', { month: 'short' }).replace('.', '').toUpperCase()
}

function diaCorto(iso: string): string {
  return String(new Date(iso).getDate()).padStart(2, '0')
}

function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function abonado(c: Contrato): number {
  return (c.pagos ?? []).reduce(
    (s, p) => s + (p.tipo === 'DEVOLUCION' ? -1 : 1) * Number(p.monto),
    0,
  )
}

function saldoContrato(c: Contrato): number {
  return Math.max(0, Number(c.precioTotal) - abonado(c))
}

function Kpi({
  label,
  valor,
  sub,
  icon: Icono,
}: {
  label: string
  valor: string
  sub: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-linea bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-kallpa">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-texto-2">{label}</span>
        <span className="grid h-[34px] w-[34px] place-items-center rounded-sm bg-kallpa-100 text-brand">
          <Icono className="h-[17px] w-[17px]" />
        </span>
      </div>
      <div className="font-title text-[34px] font-semibold leading-none tracking-[-0.02em] text-grafito">
        {valor}
      </div>
      <div className="text-xs font-medium text-texto-2">{sub}</div>
    </div>
  )
}

export function Inicio() {
  const { usuario } = useAuth()
  const [ahora] = useState(() => new Date())
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [solicitudes, setSolicitudes] = useState<SolicitudInsumos[]>([])

  useEffect(() => {
    ContratosApi.listar()
      .then(setContratos)
      .catch(() => setContratos([]))
    ClientesApi.listar()
      .then(setClientes)
      .catch(() => setClientes([]))
    SolicitudesApi.listar()
      .then(setSolicitudes)
      .catch(() => setSolicitudes([]))
  }, [])

  if (!usuario) return null

  const enCurso = contratos.filter((c) => EN_CURSO.includes(c.estado))
  const eventosMes = contratos.filter((c) => {
    const f = new Date(c.fechaEvento)
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear()
  })
  const comprasPendientes = solicitudes.filter(
    (s) => s.estado === 'BORRADOR' || s.estado === 'APROBADA',
  )
  const porCobrar = contratos
    .filter((c) => c.estado !== 'CANCELADO')
    .reduce((s, c) => s + saldoContrato(c), 0)

  const proximos = enCurso
    .filter((c) => new Date(c.fechaEvento) >= new Date(ahora.toDateString()))
    .sort((a, b) => +new Date(a.fechaEvento) - +new Date(b.fechaEvento))
    .slice(0, 4)

  const proximo = proximos[0]

  const puedeContratos =
    usuario.rol === 'GERENTE' || usuario.rol === 'GERENTE_GASTRONOMICO' || usuario.rol === 'CONSULTA'

  const CICLO = [
    { t: 'Contrato y evento', s: 'Cliente · Fecha · Invitados · Menú' },
    { t: 'Fichas técnicas y costos', s: 'Cálculo de cantidades y presupuesto' },
    { t: 'Inventario', s: 'Consultar existencias' },
    { t: 'Compras', s: 'Cubrir faltantes' },
    { t: 'Producción y cocina', s: 'Preparación · Calidad · Entrega del servicio' },
    { t: 'Liquidación y rentabilidad', s: 'Ingresos − costos y gastos = resultado' },
  ]

  return (
    <div className="space-y-6">
      {usuario.debeCambiarPassword && (
        <div className="rounded-md border border-[#ecd9ab] bg-atencion-suave px-4 py-3 text-sm text-atencion">
          Aún usas tu contraseña temporal.{' '}
          <Link to="/cambiar-password" className="font-semibold underline hover:no-underline">
            Cámbiala ahora
          </Link>
          .
        </div>
      )}

      <section className="relative overflow-hidden rounded-2xl bg-brand p-8 text-white">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-32 h-[340px] w-[340px] rounded-full border border-white/15"
        />
        <div
          aria-hidden="true"
          className="absolute -right-2 -top-12 h-[200px] w-[200px] rounded-full border border-white/10"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-7">
          <div className="flex max-w-xl flex-col gap-2.5">
            {proximo ? (
              <>
                <span className="text-[11px] font-bold tracking-[0.16em] text-[#F2CDD3]">
                  PRÓXIMO EVENTO · {fechaLarga(proximo.fechaEvento).toUpperCase()}
                </span>
                <h2 className="font-title text-[34px] font-semibold leading-tight tracking-[-0.01em]">
                  {proximo.tipoEvento} para {proximo.numeroPlatosFinal ?? proximo.numeroPlatos} invitados
                </h2>
                <span className="text-sm font-medium text-[#F2CDD3]">
                  {proximo.cliente?.nombre}
                  {proximo.lugar ? ` · ${proximo.lugar}` : ''}
                </span>
              </>
            ) : (
              <>
                <span className="text-[11px] font-bold tracking-[0.16em] text-[#F2CDD3]">
                  {saludo().toUpperCase()}, {usuario.nombre.toUpperCase()}
                </span>
                <h2 className="font-title text-[34px] font-semibold leading-tight tracking-[-0.01em]">
                  Bienvenido al panel de KALLPA
                </h2>
                <span className="text-sm font-medium text-[#F2CDD3]">
                  No hay eventos próximos en planificación.
                </span>
              </>
            )}
          </div>
          <div className="relative flex flex-wrap gap-2">
            {puedeContratos && (
              <Link to="/contratos/nuevo" className="rounded-md border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/20 active:translate-y-px">
                Nuevo contrato
              </Link>
            )}
            <Link to="/catalogo" className="rounded-md border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/20 active:translate-y-px">
              Nueva receta
            </Link>
            <Link to="/compras" className="rounded-md border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/20 active:translate-y-px">
              Registrar compra
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Eventos del mes"
          valor={String(eventosMes.length)}
          sub={ahora.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
          icon={IconContrato}
        />
        <Kpi
          label="Clientes"
          valor={String(clientes.length)}
          sub="Registrados en el sistema"
          icon={IconCliente}
        />
        <Kpi
          label="Compras pendientes"
          valor={String(comprasPendientes.length).padStart(2, '0')}
          sub="Por aprobar o recibir"
          icon={IconCompras}
        />
        <Kpi
          label="Por cobrar"
          valor={`Bs. ${aBs(porCobrar)}`}
          sub="Saldos de contratos"
          icon={IconFinanzas}
        />
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-xl border border-linea bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-title text-xl font-semibold text-grafito">Próximos eventos</h2>
            <Link to="/contratos" className="text-[13px] font-semibold text-brand hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            {proximos.map((c) => (
              <Link
                key={c.id}
                to={`/contratos/${c.id}`}
                className="flex items-center gap-4 rounded-sm p-3 transition hover:bg-fondo"
              >
                <span className="flex w-[58px] shrink-0 flex-col items-center gap-0.5 rounded-md bg-fondo py-2">
                  <span className="font-title text-[22px] font-bold leading-none text-grafito">
                    {diaCorto(c.fechaEvento)}
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.12em] text-texto-2">
                    {mesCorto(c.fechaEvento)}
                  </span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[15px] font-bold text-grafito">{c.tipoEvento}</span>
                  <span className="truncate text-[13px] font-medium text-texto-2">
                    {c.numeroPlatosFinal ?? c.numeroPlatos} invitados
                    {c.cliente?.nombre ? ` · ${c.cliente.nombre}` : ''}
                  </span>
                </span>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${ESTADO_COLOR[c.estado]}`}>
                  {ESTADO_ETIQUETA[c.estado]}
                </span>
              </Link>
            ))}
            {proximos.length === 0 && (
              <p className="py-6 text-center text-sm text-texto-2">
                No hay eventos próximos registrados.
              </p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-linea bg-white p-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-title text-xl font-semibold text-grafito">Ciclo de cada evento</h2>
            <p className="text-[13px] font-medium text-texto-2">
              Del contrato a la liquidación, todo conectado.
            </p>
          </div>
          <ol className="flex flex-col">
            {CICLO.map((f, i) => (
              <li key={f.t} className="flex gap-3.5">
                <span className="flex flex-col items-center">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-grafito text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  {i < CICLO.length - 1 && <span className="my-1 min-h-[14px] w-0.5 flex-1 bg-linea" />}
                </span>
                <span className="flex flex-col gap-0.5 pb-4 pt-0.5">
                  <span className="text-sm font-bold text-grafito">{f.t}</span>
                  <span className="text-[13px] font-medium text-texto-2">{f.s}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
