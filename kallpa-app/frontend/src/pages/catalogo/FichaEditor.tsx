import { useState } from 'react'
import { CatalogoApi } from '../../lib/api'
import { botonPrimario, botonSecundario, campo, campoCompacto } from '../../lib/catalogo'
import type { FichaTecnica, Insumo, ItemCatalogo, UnidadMedida } from '../../types'
import { Alerta } from '../../components/ui'

interface LineaForm {
  insumoId: string
  cantidad: string
  unidadCodigo: string
  merma: string
  aCriterio: boolean
  especificacion: string
}

function lineaVacia(): LineaForm {
  return { insumoId: '', cantidad: '', unidadCodigo: '', merma: '0', aCriterio: false, especificacion: '' }
}

export function FichaEditor({
  item,
  base,
  insumos,
  unidades,
  onCancel,
  onSaved,
}: {
  item: ItemCatalogo
  base: FichaTecnica | null
  insumos: Insumo[]
  unidades: UnidadMedida[]
  onCancel: () => void
  onSaved: () => void
}) {
  const [procedimiento, setProcedimiento] = useState(base?.procedimiento ?? '')
  const [porcion, setPorcion] = useState(base?.porcionGramos ?? '')
  const [lineas, setLineas] = useState<LineaForm[]>(() =>
    base?.lineas?.length
      ? base.lineas.map((l) => ({
          insumoId: l.insumoId,
          cantidad: String(l.cantidadPorPorcion),
          unidadCodigo: l.unidadCodigo,
          merma: String(l.porcentajeMerma ?? '0'),
          aCriterio: l.aCriterio,
          especificacion: l.especificacion ?? '',
        }))
      : [lineaVacia()],
  )
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const actualizarLinea = (i: number, cambios: Partial<LineaForm>) => {
    setLineas((prev) => prev.map((l, j) => (j === i ? { ...l, ...cambios } : l)))
  }

  const cambiarInsumo = (i: number, insumoId: string) => {
    const insumo = insumos.find((x) => x.id === insumoId)
    actualizarLinea(i, {
      insumoId,
      unidadCodigo: insumo?.unidadBaseCodigo ?? lineas[i].unidadCodigo,
    })
  }

  const guardar = async () => {
    setError('')
    const limpias = lineas.filter((l) => l.insumoId && l.unidadCodigo)
    if (limpias.length === 0) return setError('Agrega al menos un insumo a la ficha.')
    for (const l of limpias) {
      if (!l.aCriterio && (l.cantidad === '' || Number(l.cantidad) < 0)) {
        return setError('Cada insumo necesita una cantidad (o marca «a criterio»).')
      }
    }
    setEnviando(true)
    try {
      await CatalogoApi.crearFicha(item.id, {
        procedimiento: procedimiento.trim() || undefined,
        porcionGramos: porcion === '' ? undefined : Number(porcion),
        lineas: limpias.map((l) => ({
          insumoId: l.insumoId,
          unidadCodigo: l.unidadCodigo,
          cantidadPorPorcion: l.aCriterio ? 0 : Number(l.cantidad),
          porcentajeMerma: l.merma === '' ? 0 : Number(l.merma),
          aCriterio: l.aCriterio,
          especificacion: l.especificacion.trim() || undefined,
        })),
      })
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la ficha.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="rounded-xl border border-brand/30 bg-brand-100/30 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">
        Nueva versión de la ficha · {item.codigo}
      </h3>
      {error && (
        <div className="mb-3">
          <Alerta tipo="error">{error}</Alerta>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Porción (g)
          <input
            type="number"
            min={0}
            value={porcion}
            onChange={(e) => setPorcion(e.target.value)}
            className={`mt-1 ${campo}`}
            placeholder="opcional"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Procedimiento
          <input
            value={procedimiento}
            onChange={(e) => setProcedimiento(e.target.value)}
            className={`mt-1 ${campo}`}
            placeholder="notas de preparación (opcional)"
          />
        </label>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Insumos por porción
      </p>
      <div className="mt-2 space-y-2">
        {lineas.map((l, i) => (
          <div key={i} className="grid grid-cols-2 items-end gap-2 rounded-lg bg-white/70 p-2 md:grid-cols-12">
            <label className="col-span-2 text-xs text-slate-500 md:col-span-4">
              Insumo
              <select
                value={l.insumoId}
                onChange={(e) => cambiarInsumo(i, e.target.value)}
                className={`mt-1 w-full ${campoCompacto}`}
              >
                <option value="">Selecciona…</option>
                {insumos.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500 md:col-span-2">
              Cantidad
              <input
                type="number"
                min={0}
                step="0.0001"
                disabled={l.aCriterio}
                value={l.aCriterio ? '' : l.cantidad}
                onChange={(e) => actualizarLinea(i, { cantidad: e.target.value })}
                className={`mt-1 w-full ${campoCompacto} disabled:bg-slate-100`}
              />
            </label>
            <label className="text-xs text-slate-500 md:col-span-2">
              Unidad
              <select
                value={l.unidadCodigo}
                onChange={(e) => actualizarLinea(i, { unidadCodigo: e.target.value })}
                className={`mt-1 w-full ${campoCompacto}`}
              >
                <option value="">—</option>
                {unidades.map((u) => (
                  <option key={u.codigo} value={u.codigo}>
                    {u.codigo}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500 md:col-span-2">
              Merma %
              <input
                type="number"
                min={0}
                step="0.1"
                value={l.merma}
                onChange={(e) => actualizarLinea(i, { merma: e.target.value })}
                className={`mt-1 w-full ${campoCompacto}`}
              />
            </label>
            <label className="flex items-center gap-1 pb-2 text-xs text-slate-600 md:col-span-2">
              <input
                type="checkbox"
                checked={l.aCriterio}
                onChange={(e) => actualizarLinea(i, { aCriterio: e.target.checked })}
              />
              A criterio
            </label>
            <div className="col-span-2 flex justify-end md:col-span-12">
              <input
                value={l.especificacion}
                onChange={(e) => actualizarLinea(i, { especificacion: e.target.value })}
                className={`w-full md:max-w-md ${campoCompacto}`}
                placeholder="especificación: laminado, sin piel…"
              />
              {lineas.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLineas((prev) => prev.filter((_, j) => j !== i))}
                  className="ml-2 rounded-lg border border-rose-200 px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                  aria-label="Quitar insumo"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setLineas((prev) => [...prev, lineaVacia()])}
        className={`mt-3 ${botonSecundario}`}
      >
        + Agregar insumo
      </button>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={botonSecundario} disabled={enviando}>
          Cancelar
        </button>
        <button type="button" onClick={guardar} className={botonPrimario} disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar ficha'}
        </button>
      </div>
    </div>
  )
}
