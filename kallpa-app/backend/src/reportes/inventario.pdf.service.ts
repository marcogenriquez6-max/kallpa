import { jsPDF } from 'jspdf';

export function generarPDFInventario(data: any) {
  const doc: jsPDF = new jsPDF();
  const pageWidth: number = doc.internal.pageSize.getWidth();
  const margin: number = 20;

  // Colores KALLPA como tuplas explícitas [R, G, B]
  const grafito: [number, number, number] = [0x15, 0x17, 0x1C] as [number, number, number];
  const vino: [number, number, number] = [0x7A, 0x1E, 0x2C] as [number, number, number];
  // fondo no se usa con spread directo, lo accedemos por posición
  const fondo: [number, number, number] = [0xF2, 0xF3, 0xF5] as [number, number, number];

  // Contador de páginas
  let currentPage = 1;

  // Título
  doc.setFillColor(...grafito);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 10, 'F');
  doc.setFillColor(...vino);
  doc.rect(0, 10, doc.internal.pageSize.getWidth(), 7, 'F');

  doc.setTextColor(...grafito);
  doc.setFontSize(14);
  doc.text('KALLPA - Inventario y Almacén', margin, 15);

  // Lista de existencias
  doc.setTextColor(...grafito);
  doc.setFontSize(9);

  const existencias: any[] = data?.existencias || [];
  let yPos = 25;

  // Cabecera de tabla
  const headers = ['Insumo', 'Unidad', 'Stock Actual', 'Stock Mínimo', 'Bajo Mínimo'];
  const rowHeight = 6;

  // Dibujar encabezado
  headers.forEach((header, i) => {
    const width = (pageWidth - 2 * margin) / headers.length;
    doc.setFillColor(...vino);
    doc.setDrawColor(...vino);
    doc.setLineWidth(0.5);
    doc.rect(margin + i * (pageWidth - 2 * margin) / headers.length, 25, width, 6, 'F');
    doc.setTextColor(...grafito);
    doc.setFontSize(8);
    doc.text(header, margin + i * (pageWidth - 2 * margin) / headers.length + 2, 24);
  });

  yPos = 31;

  // Filas de datos
  existencias.forEach((i: any, rowIndex: any) => {
    if (yPos > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      currentPage++;
      yPos = 25;
      // Re-dibujar encabezado
      headers.forEach((header, i) => {
        const width = (pageWidth - 2 * margin) / headers.length;
        doc.setFillColor(...vino);
        doc.setDrawColor(...vino);
        doc.setLineWidth(0.5);
        doc.rect(margin + i * (pageWidth - 2 * margin) / headers.length, 10, (pageWidth - 2 * margin) / headers.length, 7, 'F');
        doc.setTextColor(...grafito);
        doc.setFontSize(8);
        doc.text(header, margin + i * (pageWidth - 2 * margin) / headers.length + 2, 14);
      });
    }

    const cols = [
      i.nombre,
      i.unidadBaseCodigo,
      i.stockActual.toString(),
      i.stockMinimo.toString(),
      i.bajoMinimo ? 'SÍ' : 'NO'
    ];

    let xStart = margin;
    cols.forEach((cell, i) => {
      const width = (pageWidth - 2 * margin) / 5;
      doc.setFillColor(...vino);
      doc.rect(margin + i * (pageWidth - 2 * margin) / 5, yPos, width, 6, 'F');
      doc.setTextColor(...grafito);
      doc.setFontSize(8);
      doc.text(cell, margin + i * (pageWidth - 2 * margin) / 5 + 2, yPos + 4);
    });

    yPos += rowHeight;
  });

  // Resumen
  const resumen: any = data?.resumen || {};
  const yResumen = yPos + 10;

  doc.setFillColor(...vino);
  doc.rect(0, yResumen, doc.internal.pageSize.getWidth(), 7, 'F');
  doc.setTextColor(...grafito);
  doc.setFontSize(9);
  doc.text('Resumen del Módulo', margin, yResumen + 5);

  const resumenFilas: any[] = [
    ['Insumos Activos', resumen.insumosActivos?.toString() || '0'],
    ['Stock Bajo Mínimo', resumen.bajoMinimo?.toString() || '0'],
    ['Movimientos Mes', resumen.movimientosMes?.toString() || '0']
  ];

  resumenFilas.forEach((fila: any, rowIndex: any) => {
    const yRow = yResumen + 10 + rowIndex * 7;
    doc.setFillColor(...vino);
    doc.rect(margin, yRow, doc.internal.pageSize.getWidth() - 2 * margin, 7, 'F');
    doc.setTextColor(...grafito);
    doc.setFontSize(8);
    doc.text(fila[0], margin, yRow + 4);
    doc.text(fila[1], doc.internal.pageSize.getWidth() - 100, yRow + 4);
  });

  // Pie de página
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...grafito);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  doc.setTextColor(...fondo);
  doc.setFontSize(8);
  doc.text(`KALLPA - Página ${currentPage}`, margin, pageHeight - 5);
  doc.text(`Página ${currentPage} de ${doc.getNumberOfPages()}`, pageWidth - 20, pageHeight - 5, { align: 'right' });

  doc.save(`inventario-${new Date().toISOString().split('T')[0]}.pdf`);
}
