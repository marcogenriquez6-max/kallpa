import { jsPDF } from 'jspdf'
import autoTable, { type RowInput } from 'jspdf-autotable'
import type { Contrato, ExistenciaInventario, SolicitudInsumos } from '../types'
import { ESTADO_ETIQUETA, fechaCorta, TIPO_PAGO_ETIQUETA } from './contratos'
import { ORIGEN_ETIQUETA, ESTADO_SOLICITUD_ETIQUETA } from './solicitudes'
import type { EstadoContrato, TipoPago } from '../types'
import {
  CONFORMIDAD_ETIQUETA, type Entrega, type Liquidacion, type ResumenPeriodo,
} from './operaciones'

/* Sistema visual de los documentos: grafito + vino + dorado, Helvetica, A4. */
type RGB = [number, number, number]
const C = {
  grafito: [21, 23, 28] as RGB,
  vino: [122, 30, 44] as RGB,
  vinoSuave: [246, 233, 235] as RGB,
  dorado: [224, 168, 0] as RGB,
  texto2: [91, 97, 110] as RGB,
  linea: [227, 229, 234] as RGB,
  fondo: [247, 247, 249] as RGB,
  verde: [31, 111, 74] as RGB,
}
const M = 16 // margen

const n2 = (v: number | string | null | undefined) =>
  Number(v ?? 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const bs = (v: number | string | null | undefined) => `Bs ${n2(v)}`
const num = (v: number | string | null | undefined) =>
  v == null ? '-' : Number(v).toLocaleString('es-BO', { maximumFractionDigits: 3 })
const ahora = () =>
  new Date().toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

class Doc {
  pdf: jsPDF
  y: number
  w: number
  h: number

  constructor(titulo: string, subtitulo: string, codigo?: string, horizontal = false) {
    this.pdf = new jsPDF({ orientation: horizontal ? 'l' : 'p', unit: 'mm', format: 'a4' })
    this.w = this.pdf.internal.pageSize.getWidth()
    this.h = this.pdf.internal.pageSize.getHeight()
    const p = this.pdf
    // Banda superior
    p.setFillColor(...C.grafito)
    p.rect(0, 0, this.w, 30, 'F')
    p.setFillColor(...C.vino)
    p.rect(0, 30, this.w, 1.6, 'F')
    // Monograma
    p.setFillColor(...C.vino)
    p.roundedRect(M, 8, 14, 14, 2.5, 2.5, 'F')
    p.setTextColor(255, 255, 255)
    p.setFont('helvetica', 'bold')
    p.setFontSize(13)
    p.text('K', M + 7, 17.6, { align: 'center' })
    p.setFontSize(14)
    p.text('KALLPA', M + 18, 14.2)
    p.setFont('helvetica', 'normal')
    p.setFontSize(7.5)
    p.setTextColor(200, 203, 210)
    p.text('EVENTOS Y ALTA COCINA  ·  ORURO, BOLIVIA', M + 18, 19.4)
    // Título del documento
    p.setTextColor(255, 255, 255)
    p.setFont('helvetica', 'bold')
    p.setFontSize(12.5)
    p.text(titulo.toUpperCase(), this.w - M, 14, { align: 'right' })
    p.setFont('helvetica', 'normal')
    p.setFontSize(8)
    p.setTextColor(...C.dorado)
    p.text(codigo ?? subtitulo, this.w - M, 19.5, { align: 'right' })
    this.y = 40
    if (codigo && subtitulo) {
      p.setTextColor(...C.texto2)
      p.setFontSize(8.5)
      p.text(subtitulo, M, this.y)
      this.y += 6
    }
  }

  espacio(alto: number) {
    if (this.y + alto > this.h - 20) {
      this.pdf.addPage()
      this.y = 18
    }
  }

  seccion(titulo: string) {
    // Título + cabecera + un par de filas juntos: evita títulos huérfanos al pie.
    this.espacio(34)
    const p = this.pdf
    p.setFillColor(...C.vino)
    p.rect(M, this.y - 3.6, 1.2, 5, 'F')
    p.setFont('helvetica', 'bold')
    p.setFontSize(10.5)
    p.setTextColor(...C.grafito)
    p.text(titulo, M + 3.5, this.y)
    this.y += 4.5
  }

  /** Ficha de datos en columnas (etiqueta pequeña arriba, valor abajo). */
  datos(pares: [string, string][], columnas = 3) {
    const p = this.pdf
    const ancho = (this.w - 2 * M) / columnas
    const filas = Math.ceil(pares.length / columnas)
    const alto = filas * 11 + 4
    this.espacio(alto)
    p.setFillColor(...C.fondo)
    p.setDrawColor(...C.linea)
    p.roundedRect(M, this.y, this.w - 2 * M, alto, 2, 2, 'FD')
    pares.forEach(([k, v], i) => {
      const x = M + 4 + (i % columnas) * ancho
      const y = this.y + 6 + Math.floor(i / columnas) * 11
      p.setFont('helvetica', 'normal')
      p.setFontSize(7)
      p.setTextColor(...C.texto2)
      p.text(k.toUpperCase(), x, y)
      p.setFont('helvetica', 'bold')
      p.setFontSize(9.5)
      p.setTextColor(...C.grafito)
      p.text(p.splitTextToSize(v || '-', ancho - 6)[0], x, y + 4.6)
    })
    this.y += alto + 7
  }

  /** Fila de indicadores grandes. */
  kpis(items: { etiqueta: string; valor: string; destacado?: boolean; color?: RGB }[]) {
    const p = this.pdf
    const gap = 4
    const ancho = (this.w - 2 * M - gap * (items.length - 1)) / items.length
    this.espacio(24)
    items.forEach((k, i) => {
      const x = M + i * (ancho + gap)
      if (k.destacado) p.setFillColor(...C.vino)
      else p.setFillColor(...C.fondo)
      p.setDrawColor(...(k.destacado ? C.vino : C.linea))
      p.roundedRect(x, this.y, ancho, 19, 2, 2, 'FD')
      p.setFont('helvetica', 'normal')
      p.setFontSize(6.8)
      p.setTextColor(...(k.destacado ? ([246, 220, 225] as RGB) : C.texto2))
      p.text(k.etiqueta.toUpperCase(), x + 4, this.y + 6)
      p.setFont('helvetica', 'bold')
      p.setFontSize(12.5)
      p.setTextColor(...(k.destacado ? ([255, 255, 255] as RGB) : (k.color ?? C.grafito)))
      p.text(k.valor, x + 4, this.y + 14.5)
    })
    this.y += 26
  }

  tabla(cabecera: string[], filas: RowInput[], opciones: { derecha?: number[]; pie?: RowInput[]; anchos?: Record<number, number> } = {}) {
    const columnStyles: Record<number, { halign?: 'right'; cellWidth?: number }> = {}
    for (const i of opciones.derecha ?? []) columnStyles[i] = { halign: 'right' }
    for (const [i, w] of Object.entries(opciones.anchos ?? {})) columnStyles[Number(i)] = { ...columnStyles[Number(i)], cellWidth: w }
    autoTable(this.pdf, {
      startY: this.y,
      head: [cabecera],
      body: filas.length ? filas : [[{ content: 'Sin registros', colSpan: cabecera.length, styles: { halign: 'center', textColor: C.texto2 } }]],
      foot: opciones.pie,
      margin: { left: M, right: M, bottom: 20 },
      theme: 'plain',
      showFoot: 'lastPage',
      rowPageBreak: 'avoid',
      styles: { font: 'helvetica', fontSize: 8.4, cellPadding: { top: 2.4, bottom: 2.4, left: 2.6, right: 2.6 }, textColor: C.grafito, lineColor: C.linea, lineWidth: { bottom: 0.2 } },
      headStyles: { fillColor: C.grafito, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.6 },
      footStyles: { fillColor: C.vinoSuave, textColor: C.vino, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: C.fondo },
      columnStyles,
      didParseCell: (d) => {
        if ((d.section === 'head' || d.section === 'foot') && (opciones.derecha ?? []).includes(d.column.index)) d.cell.styles.halign = 'right'
      },
    })
    this.y = (this.pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  }

  parrafo(texto: string) {
    const p = this.pdf
    const lineas = p.splitTextToSize(texto, this.w - 2 * M)
    this.espacio(lineas.length * 4.2 + 4)
    p.setFont('helvetica', 'normal')
    p.setFontSize(8.8)
    p.setTextColor(...C.grafito)
    p.text(lineas, M, this.y)
    this.y += lineas.length * 4.2 + 4
  }

  firmas(nombres: string[]) {
    const p = this.pdf
    this.espacio(30)
    this.y += 16
    const ancho = (this.w - 2 * M) / nombres.length
    nombres.forEach((nm, i) => {
      const cx = M + ancho * i + ancho / 2
      p.setDrawColor(...C.texto2)
      p.line(cx - 28, this.y, cx + 28, this.y)
      p.setFontSize(8)
      p.setTextColor(...C.texto2)
      p.text(nm, cx, this.y + 4.5, { align: 'center' })
    })
    this.y += 10
  }

  guardar(nombre: string) {
    const p = this.pdf
    const total = p.getNumberOfPages()
    for (let i = 1; i <= total; i++) {
      p.setPage(i)
      p.setDrawColor(...C.linea)
      p.line(M, this.h - 12, this.w - M, this.h - 12)
      p.setFont('helvetica', 'normal')
      p.setFontSize(7)
      p.setTextColor(...C.texto2)
      p.text(`KALLPA · Sistema de gestión  ·  Generado el ${ahora()}`, M, this.h - 7.5)
      p.text(`Página ${i} de ${total}`, this.w - M, this.h - 7.5, { align: 'right' })
    }
    p.save(nombre.replace(/[^\w.-]+/g, '_') + '.pdf')
  }
}

/* ------------------------------------------------------------------ */

export function pdfContrato(c: Contrato) {
  const d = new Doc('Contrato de servicio', ESTADO_ETIQUETA[c.estado as EstadoContrato] ?? c.estado, c.codigo)
  const platos = c.numeroPlatosFinal ?? c.numeroPlatos
  d.seccion('Datos del evento')
  d.datos([
    ['Cliente', c.cliente?.nombre ?? '-'],
    ['Teléfono', c.cliente?.telefono ?? '-'],
    ['Tipo de evento', c.tipoEvento],
    ['Fecha', fechaCorta(c.fechaEvento)],
    ['Hora de servicio', c.horaServicio],
    ['Platos', `${platos}${c.numeroPlatosFinal ? ' (confirmados)' : ''}`],
    ['Lugar', c.lugar],
    ['Dirección', c.direccion ?? '-'],
    ['Garzones incluidos', String(c.garzonesIncluidos)],
  ])
  const r = c.resumen
  d.kpis([
    { etiqueta: 'Total del contrato', valor: bs(c.precioTotal), destacado: true },
    { etiqueta: `Anticipo (${r?.anticipoPorcentaje ?? 50}%)`, valor: bs(r?.anticipoEsperado) },
    { etiqueta: 'Abonado', valor: bs(r?.abonado), color: C.verde },
    { etiqueta: 'Saldo', valor: bs(r?.saldo), color: C.vino },
  ])
  d.seccion('Menú contratado')
  d.tabla(
    ['Código', 'Ítem', 'Cantidad', 'Precio unit.', 'Subtotal'],
    (c.items ?? []).map((i) => [i.item?.codigo ?? '', i.item?.nombre ?? '', String(i.cantidad), n2(i.precioUnitario), n2(i.subtotal)]),
    { derecha: [2, 3, 4], pie: [['', 'Total', '', '', n2(c.precioTotal)]] },
  )
  if (c.pagos?.length) {
    d.seccion('Pagos registrados')
    d.tabla(
      ['Fecha', 'Tipo', 'Método', 'Comprobante', 'Monto'],
      c.pagos.map((p) => [fechaCorta(p.fecha), TIPO_PAGO_ETIQUETA[p.tipo as TipoPago] ?? p.tipo, p.metodo, p.comprobante ?? '-', n2(p.monto)]),
      { derecha: [4] },
    )
  }
  if (c.requisitosEspeciales || c.observaciones) {
    d.seccion('Requisitos y observaciones')
    if (c.requisitosEspeciales) d.parrafo(`Requisitos especiales: ${c.requisitosEspeciales}`)
    if (c.observaciones) d.parrafo(`Observaciones: ${c.observaciones}`)
  }
  d.seccion('Condiciones')
  d.parrafo(
    `El anticipo confirma la reserva de la fecha. El número final de platos se confirma días antes del evento y el saldo se cancela según los plazos acordados. Registrado por ${c.registradoPor?.nombre ?? 'KALLPA'}.`,
  )
  d.firmas(['KALLPA · Gerencia', c.cliente?.nombre ?? 'Cliente'])
  d.guardar(`Contrato_${c.codigo}`)
}

export function pdfSolicitud(s: SolicitudInsumos) {
  const d = new Doc('Solicitud de insumos F-001', ESTADO_SOLICITUD_ETIQUETA[s.estado], s.folio)
  d.seccion('Datos de la solicitud')
  d.datos([
    ['Contrato', `${s.contrato?.codigo ?? ''} · ${s.contrato?.tipoEvento ?? ''}`],
    ['Cliente', s.contrato?.cliente?.nombre ?? '-'],
    ['Fecha del evento', s.contrato?.fechaEvento ? fechaCorta(s.contrato.fechaEvento) : '-'],
    ['Requerido en cocina', new Date(s.fechaHoraRequerida).toLocaleString('es-BO')],
    ['Versión / platos base', `#${s.version} · ${s.platosBase} platos`],
    ['Estado', ESTADO_SOLICITUD_ETIQUETA[s.estado]],
    ['Solicitado por', s.creadaPor?.nombre ?? '-'],
    ['Aprobado por', s.aprobadaPor?.nombre ?? 'Pendiente'],
    ['Observaciones', s.observaciones ?? '-'],
  ])
  d.seccion('Insumos requeridos')
  d.tabla(
    ['Insumo', 'Categoría', 'Calculada', 'Cantidad', 'Unidad', 'Origen', 'Marca / especificación'],
    (s.items ?? []).map((i) => [
      i.insumo?.nombre ?? '', i.insumo?.categoria?.nombre ?? '', num(i.cantidadCalculada), num(i.cantidad),
      i.unidadCodigo, ORIGEN_ETIQUETA[i.origen], [i.marca, i.especificacion].filter(Boolean).join(' · ') || '-',
    ]),
    { derecha: [2, 3] },
  )
  d.firmas(['Solicitado por', 'Aprobado (chef)', 'Logística'])
  d.guardar(`Solicitud_${s.folio}`)
}

export function pdfEntrega(e: Entrega) {
  const d = new Doc('Acta de entrega en cocina', CONFORMIDAD_ETIQUETA[e.conformidad], e.solicitud.folio)
  d.datos([
    ['Contrato', `${e.solicitud.contrato.codigo} · ${e.solicitud.contrato.tipoEvento}`],
    ['Fecha y hora', new Date(e.fechaHora).toLocaleString('es-BO')],
    ['Lugar', e.lugar],
    ['Entregado por', e.entregadoPor.nombre],
    ['Recibido por', e.recibidoPor.nombre],
    ['Conformidad', CONFORMIDAD_ETIQUETA[e.conformidad]],
  ])
  d.seccion('Insumos recibidos')
  d.tabla(
    ['Insumo', 'Solicitado', 'Recibido', 'Unidad', 'Conformidad', 'Observación'],
    e.items.map((i) => [i.solicitudItem.insumo.nombre, num(i.solicitudItem.cantidad), num(i.cantidadRecibida), i.solicitudItem.unidadCodigo, CONFORMIDAD_ETIQUETA[i.conformidad], i.observacion ?? '-']),
    { derecha: [1, 2] },
  )
  if (e.observaciones) d.parrafo(`Observaciones: ${e.observaciones}`)
  d.firmas([`Entrega: ${e.entregadoPor.nombre}`, `Recibe: ${e.recibidoPor.nombre}`])
  d.guardar(`Entrega_${e.solicitud.folio}_${e.fechaHora.slice(0, 10)}`)
}

export function pdfLiquidacion(l: Liquidacion) {
  const c = l.contrato
  const r = l.resumen
  const d = new Doc('Liquidación del evento', ESTADO_ETIQUETA[c.estado as EstadoContrato] ?? c.estado, c.codigo)
  d.datos([
    ['Cliente', c.cliente.nombre],
    ['Evento', c.tipoEvento],
    ['Fecha', fechaCorta(c.fechaEvento)],
    ['Lugar', c.lugar],
    ['Platos', String(c.numeroPlatosFinal ?? c.numeroPlatos)],
    ['Costo por plato', r.costoPorPlato == null ? '-' : bs(r.costoPorPlato)],
  ])
  d.kpis([
    { etiqueta: 'Venta', valor: bs(r.precioTotal) },
    { etiqueta: 'Cobrado', valor: bs(r.ingresos), color: C.verde },
    { etiqueta: 'Costos totales', valor: bs(r.costos), color: C.vino },
    { etiqueta: `Utilidad${r.margen == null ? '' : ` (${r.margen}%)`}`, valor: bs(r.utilidad), destacado: true },
  ])
  d.seccion('Estado de resultados')
  d.tabla(['Concepto', 'Monto'], [
    ['Venta del contrato', n2(r.precioTotal)],
    ['(-) Insumos comprados', n2(r.costoInsumos)],
    ['(-) Gastos del evento', n2(r.costoGastos)],
    ['(-) Remuneraciones', n2(r.costoPersonal)],
  ], { derecha: [1], pie: [['Utilidad del evento', n2(r.utilidad)]] })
  d.seccion('Compras de insumos')
  d.tabla(['Fecha', 'Solicitud', 'Proveedor', 'Total'], l.compras.map((k) => [fechaCorta(k.fecha), k.folio, k.proveedor, n2(k.total)]), { derecha: [3] })
  d.seccion('Gastos del evento')
  d.tabla(['Fecha', 'Categoría', 'Descripción', 'Monto'], c.gastos.map((g) => [fechaCorta(g.fecha), g.categoria, g.descripcion ?? '-', n2(g.monto)]), { derecha: [3] })
  d.seccion('Remuneraciones')
  d.tabla(['Persona', 'Concepto', 'Estado', 'Monto'], c.remuneraciones.map((x) => [x.persona.nombre, x.concepto, x.pagado ? 'Pagado' : 'Pendiente', n2(x.monto)]), { derecha: [3] })
  d.seccion('Cobros')
  d.tabla(['Fecha', 'Tipo', 'Método', 'Monto'], c.pagos.map((p) => [fechaCorta(p.fecha), TIPO_PAGO_ETIQUETA[p.tipo as TipoPago] ?? p.tipo, p.metodo, n2(p.monto)]), { derecha: [3], pie: [['', '', 'Saldo por cobrar', n2(r.saldo)]] })
  d.guardar(`Liquidacion_${c.codigo}`)
}

export function pdfInventario(filas: ExistenciaInventario[]) {
  const d = new Doc('Existencias de almacén', `Corte al ${ahora()}`)
  const bajo = filas.filter((f) => f.bajoMinimo).length
  d.kpis([
    { etiqueta: 'Insumos activos', valor: String(filas.length) },
    { etiqueta: 'Bajo stock mínimo', valor: String(bajo), color: bajo ? C.vino : C.verde },
    { etiqueta: 'Con existencia', valor: String(filas.filter((f) => f.stockActual > 0).length) },
  ])
  d.tabla(
    ['Insumo', 'Categoría', 'Stock', 'Mínimo', 'Unidad', 'Estado'],
    filas.map((f) => [f.nombre, f.categoria.nombre, num(f.stockActual), f.stockMinimo ? num(f.stockMinimo) : '-', f.unidadBaseCodigo, f.bajoMinimo ? 'REPONER' : 'OK']),
    { derecha: [2, 3] },
  )
  d.guardar(`Inventario_${new Date().toISOString().slice(0, 10)}`)
}

export function pdfReporte(r: ResumenPeriodo) {
  const i = r.indicadores
  const d = new Doc('Reporte de gestión', `Del ${fechaCorta(r.periodo.desde)} al ${fechaCorta(r.periodo.hasta)}`)
  d.kpis([
    { etiqueta: 'Eventos', valor: String(i.contratos) },
    { etiqueta: 'Platos', valor: i.platos.toLocaleString('es-BO') },
    { etiqueta: 'Vendido', valor: bs(i.vendido) },
    { etiqueta: 'Cobrado', valor: bs(i.cobrado), color: C.verde },
  ])
  d.kpis([
    { etiqueta: 'Por cobrar', valor: bs(i.porCobrar), color: C.vino },
    { etiqueta: 'Egresos', valor: bs(i.egresos) },
    { etiqueta: 'Resultado de caja', valor: bs(i.resultado), destacado: true },
  ])
  d.seccion('Ingresos y egresos del periodo')
  d.tabla(['Concepto', 'Monto'], [
    ['Cobros a clientes (neto de devoluciones)', n2(i.cobrado)],
    ['(-) Compras de insumos', n2(i.costoCompras)],
    ['(-) Gastos de eventos', n2(i.gastosEvento)],
    ['(-) Gastos fijos', n2(i.gastosFijos)],
    ['(-) Remuneraciones por evento', n2(i.costoPersonal)],
  ], { derecha: [1], pie: [['Resultado', n2(i.resultado)]] })
  d.seccion('Eventos del periodo')
  d.tabla(
    ['Código', 'Fecha', 'Cliente', 'Evento', 'Platos', 'Estado', 'Total'],
    r.contratos.map((c) => [c.codigo, fechaCorta(c.fechaEvento), c.cliente, c.tipoEvento, String(c.platos), ESTADO_ETIQUETA[c.estado as EstadoContrato] ?? c.estado, n2(c.precioTotal)]),
    { derecha: [4, 6] },
  )
  d.seccion('Platos más vendidos')
  d.tabla(['Ítem', 'Cantidad', 'Monto'], r.topItems.map((t) => [t.item, String(t.cantidad), n2(t.monto)]), { derecha: [1, 2] })
  d.seccion('Compras por proveedor')
  d.tabla(['Proveedor', 'Total comprado'], r.comprasPorProveedor.map((p) => [p.proveedor, n2(p.total)]), { derecha: [1] })
  d.guardar(`Reporte_${r.periodo.desde}_${r.periodo.hasta}`)
}
