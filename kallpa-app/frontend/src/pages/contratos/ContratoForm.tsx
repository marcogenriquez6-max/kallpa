import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CatalogoApi, ClientesApi, ContratosApi } from '../../lib/api'
import type { DatosContrato } from '../../lib/api'
import { aBs, botonPrimario, botonSecundario, campo } from '../../lib/catalogo'
import { TIPO_CLIENTE_ETIQUETA } from '../../lib/contratos'
import type { Cliente, EstadoContrato, ItemCatalogo } from '../../types'
import { Alerta, Cargando, Tarjeta } from '../../components/ui'

interface Linea {
  itemId: string
  cantidad: number
}

export function ContratoForm() {
  const { id } = useParams()
  const navegar = useNavigate()
  const editando = Boolean(id)

  const [cargando, setCargando] = useState(true)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [itemsDisponibles, setItemsDisponibles] = useState<ItemCatalogo[]>([])
  const [estado, setEstado] = useState<EstadoContrato>('COTIZACION')

  const [clienteId, setClienteId] = useState('')
  const [tipoEvento, setTipoEvento] = useState('')
  const [fechaEvento, setFechaEvento] = useState('')
  const [horaServicio, setHoraServicio] = useState('13:00')
  const [lugar, setLugar] = useState('')
  const [direccion, setDireccion] = useState('')
  const [numeroPlatos, setNumeroPlatos] = useState('100')
  const [requisitosEspeciales, setRequisitosEspeciales] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [lineas, setLineas] = useState<Linea[]>([])
  const [itemNuevo, setItemNuevo] = useState('')
  const [cantidadNueva, setCantidadNueva] = useState('1')

  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const puedeEditarItems = !editando || estado === 'COTIZACION'

  const cargar = useCallback(async () => {
    setError('')
    try {
      const [cs, its] = await Promise.all([
        ClientesApi.listar(),
        CatalogoApi.listarItems({ activo: true }),
      ])
      setClientes(cs)
      setItemsDisponibles(its)

      if (id) {
        const c = await ContratosApi.obtener(id)
        setEstado(c.estado)
        setClienteId(c.clienteId)
        setTipoEvento(c.tipoEvento)
        setFechaEvento(c.fechaEvento.slice(0, 10))
        setHoraServicio(c.horaServicio)
        setLugar(c.lugar)
        setDireccion(c.direccion ?? '')
        setNumeroPlatos(String(c.numeroPlatos))
        setRequisitosEspeciales(c.requisitosEspeciales ?? '')
        setObservaciones(c.observaciones ?? '')
        setLineas((c.items ?? []).map((i) => ({ itemId: i.itemId, cantidad: i.cantidad })))
      } else if (cs.length) {
        setClienteId(cs[0].id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el formulario.')
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const precio = useCallback(
    (itemId: string) => Number(itemsDisponibles.find((i) => i.id === itemId)?.precioVenta ?? 0),
    [itemsDisponibles],
  )

  const total = useMemo(
    () => lineas.reduce((s, l) => s + precio(l.itemId) * l.cantidad, 0),
    [lineas, precio],
  )

  const agregarItem = () => {
    if (!itemNuevo) return
    const cantidad = Math.max(1, Number(cantidadNueva) || 1)
    setLineas((prev) => {
      const existe = prev.find((l) => l.itemId === itemNuevo)
      if (existe) return prev.map((l) => (l.itemId === itemNuevo ? { ...l, cantidad } : l))
      return [...prev, { itemId: itemNuevo, cantidad }]
    })
    setItemNuevo('')
    setCantidadNueva('1')
  }

  const guardar = async () => {
    setError('')
    if (!clienteId) return setError('Selecciona un cliente.')
    if (!tipoEvento.trim()) return setError('Indica el tipo de evento.')
    if (!fechaEvento) return setError('Indica la fecha del evento.')
    if (!lugar.trim()) return setError('Indica el lugar del evento.')
    const platos = Number(numeroPlatos)
    if (!Number.isInteger(platos) || platos < 1) return setError('El número de platos no es válido.')
    if (puedeEditarItems && lineas.length === 0) {
      return setError('Agrega al menos un ítem al menú.')
    }

    const body: DatosContrato = {
      clienteId,
      tipoEvento: tipoEvento.trim(),
      fechaEvento,
      horaServicio,
      lugar: lugar.trim(),
      direccion: direccion.trim() || undefined,
      numeroPlatos: platos,
      requisitosEspeciales: requisitosEspeciales.trim() || undefined,
      observaciones: observaciones.trim() || undefined,
    }

    setEnviando(true)
    try {
      if (editando && id) {
        await ContratosApi.actualizar(id, body)
        if (puedeEditarItems) await ContratosApi.reemplazarItems(id, lineas)
        navegar(`/contratos/${id}`)
      } else {
        const creado = await ContratosApi.crear({ ...body, items: lineas })
        navegar(`/contratos/${creado.id}`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el contrato.')
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <Cargando />

  return (
    <Tarjeta titulo={editando ? 'Editar contrato' : 'Nuevo contrato'}>
      <div className="space-y-4">
        {error && <Alerta tipo="error">{error}</Alerta>}

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Cliente
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className={`mt-1 ${campo}`}
            >
              <option value="">— Selecciona —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} · {TIPO_CLIENTE_ETIQUETA[c.tipo]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Tipo de evento
            <input
              value={tipoEvento}
              onChange={(e) => setTipoEvento(e.target.value)}
              className={`mt-1 ${campo}`}
              placeholder="Matrimonio, preste…"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Fecha del evento
            <input
              type="date"
              value={fechaEvento}
              onChange={(e) => setFechaEvento(e.target.value)}
              className={`mt-1 ${campo}`}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Hora de servicio
            <input
              type="time"
              value={horaServicio}
              onChange={(e) => setHoraServicio(e.target.value)}
              className={`mt-1 ${campo}`}
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Número de platos
            <input
              type="number"
              min={1}
              value={numeroPlatos}
              onChange={(e) => setNumeroPlatos(e.target.value)}
              className={`mt-1 ${campo}`}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Lugar
            <input
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              className={`mt-1 ${campo}`}
              placeholder="Salón, restaurante…"
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Dirección (opcional)
            <input
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              className={`mt-1 ${campo}`}
            />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-3">
            Requisitos especiales (opcional)
            <input
              value={requisitosEspeciales}
              onChange={(e) => setRequisitosEspeciales(e.target.value)}
              className={`mt-1 ${campo}`}
              placeholder="Alergias, vegetarianos, protocolo…"
            />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-3">
            Observaciones (opcional)
            <input
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className={`mt-1 ${campo}`}
            />
          </label>
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Menú del evento</h3>
          {!puedeEditarItems ? (
            <p className="text-sm text-slate-500">
              El menú ya no se puede modificar en estado {estado}. Solo puede cambiarse mientras el
              contrato está en cotización.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_120px_auto]">
                <select
                  value={itemNuevo}
                  onChange={(e) => setItemNuevo(e.target.value)}
                  className={campo}
                >
                  <option value="">Selecciona un ítem del catálogo…</option>
                  {itemsDisponibles.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.codigo} · {i.nombre} (Bs {aBs(Number(i.precioVenta))})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={cantidadNueva}
                  onChange={(e) => setCantidadNueva(e.target.value)}
                  className={campo}
                  placeholder="Cantidad"
                />
                <button
                  type="button"
                  onClick={agregarItem}
                  className={botonSecundario}
                  disabled={!itemNuevo}
                >
                  Agregar
                </button>
              </div>

              {itemsDisponibles.length === 0 && (
                <p className="text-sm text-amber-600">
                  No hay ítems activos en el catálogo. Crea ítems antes de armar el menú.
                </p>
              )}

              {lineas.length > 0 && (
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                    <tr className="border-b border-slate-200">
                      <th className="py-2 pr-4">Ítem</th>
                      <th className="py-2 pr-4 text-right">Precio</th>
                      <th className="py-2 pr-4 text-right">Cantidad</th>
                      <th className="py-2 pr-4 text-right">Subtotal</th>
                      <th className="py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((l) => {
                      const item = itemsDisponibles.find((i) => i.id === l.itemId)
                      return (
                        <tr key={l.itemId} className="border-b border-slate-100">
                          <td className="py-2 pr-4 text-slate-700">
                            {item ? `${item.codigo} · ${item.nombre}` : l.itemId}
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {aBs(precio(l.itemId))}
                          </td>
                          <td className="py-2 pr-4 text-right">
                            <input
                              type="number"
                              min={1}
                              value={l.cantidad}
                              onChange={(e) =>
                                setLineas((prev) =>
                                  prev.map((x) =>
                                    x.itemId === l.itemId
                                      ? { ...x, cantidad: Math.max(1, Number(e.target.value) || 1) }
                                      : x,
                                  ),
                                )
                              }
                              className={`w-20 text-right ${campo}`}
                            />
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">
                            {aBs(precio(l.itemId) * l.cantidad)}
                          </td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setLineas((prev) => prev.filter((x) => x.itemId !== l.itemId))
                              }
                              className="text-sm font-medium text-rose-600 hover:underline"
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Total estimado:{' '}
            <span className="text-base font-semibold text-slate-800">Bs {aBs(total)}</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navegar(editando && id ? `/contratos/${id}` : '/contratos')}
              className={botonSecundario}
              disabled={enviando}
            >
              Cancelar
            </button>
            <button type="button" onClick={guardar} className={botonPrimario} disabled={enviando}>
              {enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear contrato'}
            </button>
          </div>
        </div>
      </div>
    </Tarjeta>
  )
}
