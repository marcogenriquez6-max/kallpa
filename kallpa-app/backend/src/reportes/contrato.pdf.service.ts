import { jsPDF } from 'jspdf';

export function generarPDFContrato(data: any) {
  const doc: jsPDF = new jsPDF();

  // Colores KALLPA como tuplas [R, G, B]
  const grafito: [number, number, number] = [0x15, 0x17, 0x1C];
  const vino: [number, number, number] = [0x7A, 0x1E, 0x2C];
  const fondo: [number, number, number] = [0xF2, 0xF3, 0xF5];

  // Contador de páginas
  let currentPage = 1;

  // Título
  doc.setFillColor(...grafito);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 10, 'F');
  doc.setFillColor(...vino);
  doc.rect(0, 10, doc.internal.pageSize.getWidth(), 7, 'F');

  doc.setTextColor(...grafito);
  doc.setFontSize(16);
  doc.text('KALLPA - Eventos y Alta Cocina', 20, 15);

  // Datos del contrato (usando tuplas para spread)
  const codigo: string = data.codigo || 'N/A';
  const clienteNombre: string = data.clienteNombre || 'N/A';
  const tipoEvento: string = data.tipoEvento || 'N/A';
  const fechaEvento: string = data.fechaEvento ? new Date(data.fechaEvento).toLocaleDateString() : 'N/A';
  const horaServicio: string = data.horaServicio || 'N/A';
  const lugar: string = data.lugar || 'N/A';
  const numeroPlatos: string = data.numeroPlatos?.toString() || 'N/A';
  const garzonesIncluidos: string = data.garzonesIncluidos?.toString() || 'N/A';
  const precioTotal: string = `$${data.precioTotal?.toLocaleString() || 'N/A'}`;
  const estado: string = data.estado || 'N/A';

  // Datos compactos en tuplas
  const contratoData: [string, string][] = [
    ['Código:', codigo],
    ['Cliente:', clienteNombre],
    ['Tipo Evento:', tipoEvento],
    ['Fecha Evento:', fechaEvento],
    ['Hora Servicio:', horaServicio],
    ['Lugar:', lugar],
    ['Número de Platos:', numeroPlatos],
    ['Garzos Incluidos:', garzonesIncluidos],
    ['Precio Total:', precioTotal],
    ['Estado:', estado]
  ];

  // Título
  doc.setFillColor(...grafito);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 10, 'F');
  doc.setFillColor(...vino);
  doc.rect(0, 10, doc.internal.pageSize.getWidth(), 7, 'F');

  doc.setTextColor(...grafito);
  doc.setFontSize(16);
  doc.text('KALLPA - Eventos y Alta Cocina', 20, 15);

  // Escribir datos del contrato
  let y = 20;
  contratoData.forEach(([label, value]: [string, string]) => {
    doc.setFillColor(...grafito);
    doc.setDrawColor(...grafito);
    doc.setLineWidth(0.5);
    doc.rect(20, y, 80, 6, 'F');
    doc.text(label, 25, y + 4);
    doc.text(value, 100, y + 4);
    y += 12;
  });

  // Tabla de ítems
  const filas: [string, string, string, string][] = data.items?.map((item: any) => [
    item.itemNombre || 'N/A',
    item.cantidad?.toString() || 'N/A',
    `$${item.precioUnitario?.toLocaleString() || 'N/A'}`,
    `$${item.subtotal?.toLocaleString() || 'N/A'}`
  ]) || [];

  let tableY = y + 5;

  // Dibujar encabezado de tabla
  doc.setFillColor(...vino);
  doc.rect(20, y, 180, 6, 'F');
  doc.setTextColor(...grafito);
  doc.setFontSize(9);
  doc.text('Ítem', 22, y + 4);
  doc.text('Cantidad', 100, y + 4);
  doc.text('Precio Unit.', 150, y + 4);
  doc.text('Subtotal', 180, y + 4);
  y += 12;

  // Filas de ítems
  filas.forEach((fila: [string, string, string, string], rowIndex: any) => {
    doc.setFillColor(...vino);
    doc.rect(20, y, 180, 6, 'F');
    doc.setTextColor(...grafito);
    doc.setFontSize(8);
    doc.text(fila[0], 22, y + 4);
    doc.text(fila[1], 100, y + 4);
    doc.text(fila[2], 150, y + 4);
    doc.text(fila[3], 180, y + 4);
    y += 10;
  });

  // Pie de página
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...grafito);
  doc.rect(0, pageHeight - 10, doc.internal.pageSize.getWidth(), 10, 'F');
  doc.setTextColor(...fondo);
  doc.setFontSize(8);
  doc.text(`KALLPA - Página ${currentPage}`, 20, pageHeight - 5);
  doc.text(`Página ${currentPage} de ${doc.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 20, pageHeight - 5, { align: 'right' });

  doc.save(`contrato-${data.codigo}.pdf`);
}
