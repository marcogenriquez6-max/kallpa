import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Contrato } from '../../types';

interface ContratoPrintProps {
  contrato: Contrato;
}

export const ContratoPrint: React.FC<ContratoPrintProps> = ({ contrato }) => {
  const handlePrint = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Colores KALLPA
    const grafito: [number, number, number] = [0x15, 0x17, 0x1C];
    const vino: [number, number, number] = [0x7A, 0x1E, 0x2C];
    const fondo: [number, number, number] = [0xF2, 0xF3, 0xF5];

    // Título
    doc.setFillColor(...grafito);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFillColor(...vino);
    doc.rect(0, 40, pageWidth, 7, 'F');

    doc.setTextColor(...grafito);
    doc.setFontSize(16);
    doc.text('KALLPA - Eventos y Alta Cocina', margin, 30);

    // Datos del contrato
    doc.setTextColor(...grafito);
    doc.setFontSize(11);
    
    const datos: [string, string][] = [
      ['Código:', contrato.codigo],
      ['Cliente:', contrato.cliente?.nombre || 'N/A'],
      ['Tipo Evento:', contrato.tipoEvento],
      ['Fecha Evento:', contrato.fechaEvento?.split('T')[0] || 'N/A'],
      ['Hora Servicio:', contrato.horaServicio || 'N/A'],
      ['Lugar:', contrato.lugar || 'N/A'],
      ['Número de Platos:', contrato.numeroPlatos?.toString() || 'N/A'],
      ['Garzos Incluidos:', contrato.garzonesIncluidos?.toString() || 'N/A'],
      ['Precio Total:', `$${contrato.precioTotal?.toLocaleString() || 'N/A'}`],
      ['Estado:', contrato.estado || 'N/A']
    ];

    let y = 55;
    datos.forEach(([label, value]) => {
      doc.setFillColor(...grafito);
      doc.setDrawColor(...grafito);
      doc.setLineWidth(0.5);
      doc.rect(margin, y, 80, 6, 'F');
      doc.text(label, margin + 5, y + 4);
      doc.text(value, margin + 90, y + 4);
      y += 12;
    });

    // Tabla de ítems
    doc.setFillColor(...vino);
    doc.rect(0, y, pageWidth, 7, 'F');
    
    doc.setTextColor(...grafito);
    doc.setFontSize(11);
    doc.text('Detalle de ítems del menú', margin, y + 5);
    y += 12;

    // Tabla de items
    const filas = contrato.items?.map((item: any) => [
      item.item?.codigo || 'N/A',
      item.cantidad?.toString() || 'N/A',
      `$${item.precioUnitario?.toLocaleString() || 'N/A'}`,
      `$${item.subtotal?.toLocaleString() || 'N/A'}`
    ]) || [];

    autoTable(doc, {
      startY: y + 7,
      head: [['Ítem', 'Cantidad', 'Precio Unit.', 'Subtotal']],
      body: filas,
      margin: { left: 15, right: 15 },
      theme: 'grid',
      headStyles: {
        fillColor: vino,
        textColor: fondo,
        fontStyle: 'bold'
      }
    });

    // Pie de página
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(...grafito);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    doc.setTextColor(...fondo);
    doc.setFontSize(9);
    doc.text('KALLPA - Eventos y Alta Cocina', margin, pageHeight - 10);
    doc.text(`Página ${doc.getNumberOfPages()}`, pageWidth - 20, pageHeight - 10, { align: 'right' });

    doc.save(`contrato-${contrato.codigo}.pdf`);
  };

  handlePrint();
  return null;
};

export default ContratoPrint;
