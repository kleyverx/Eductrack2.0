/**
 * Exportador PDF del reporte institucional (superadmin).
 * Réplica del patrón de academicoPDF.js con su propio encabezado membretado,
 * ya que la función `encabezado` de aquel módulo es privada.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/** Membrete oficial (réplica del de academicoPDF). Devuelve la Y donde continuar. */
function encabezado(doc, titulo, subtitulo) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('REPÚBLICA BOLIVARIANA DE VENEZUELA', w / 2, 14, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN', w / 2, 19, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(titulo, w / 2, 30, { align: 'center' });
  if (subtitulo) { doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(subtitulo, w / 2, 36, { align: 'center' }); return 42; }
  return 37;
}

/** PDF del reporte institucional. @param {object} data respuesta del endpoint */
export function exportReporteInstitucionalPDF(data) {
  const doc = new jsPDF();
  const fecha = new Date(data.generadoEn || Date.now()).toLocaleDateString('es-VE');
  let y = encabezado(doc, 'REPORTE INSTITUCIONAL', `Resumen académico del plantel · ${fecha}`);

  const t = data.totales || {};
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`Estudiantes: ${t.estudiantes ?? 0}   Docentes: ${t.docentes ?? 0}   Secciones: ${t.secciones ?? 0}   (H: ${t.hombres ?? 0} · M: ${t.mujeres ?? 0})`, 14, y + 4);
  y += 12;

  autoTable(doc, {
    head: [['Sección', 'Docente', 'Estud.', 'Prom.', 'Aprob.', 'Aplaz.', '% Inasist.', 'Riesgo']],
    body: (data.porSeccion || []).map(s => [
      s.seccion, s.docente, s.estudiantes,
      s.promedio != null ? s.promedio : '—',
      s.aprobados, s.aplazados, `${s.inasistenciaPromedio}%`, s.enRiesgo,
    ]),
    startY: y,
    styles: { fontSize: 8, cellPadding: 1.6, halign: 'center' },
    headStyles: { fillColor: [49, 46, 129], fontSize: 8, halign: 'center' },
    columnStyles: { 1: { halign: 'left', cellWidth: 45 } },
    didParseCell(data2) {
      if (data2.section === 'body' && data2.column.index === 3) {
        const v = parseFloat(data2.cell.raw);
        if (!Number.isNaN(v) && v < 10) data2.cell.styles.textColor = [190, 18, 60];
      }
    },
  });
  y = doc.lastAutoTable.finalY + 8;

  if ((data.vocacional || []).length) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('Áreas vocacionales más frecuentes:', 14, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    data.vocacional.slice(0, 8).forEach(a => { doc.text(`• ${a.area}: ${a.cantidad}`, 16, y); y += 5; });
  }

  y = Math.max(y + 16, 260);
  doc.setFontSize(9);
  doc.text('_____________________________', 25, y);
  doc.text('Director(a)', 42, y + 5);
  doc.text('_____________________________', 125, y);
  doc.text('Sello de la Institución', 135, y + 5);

  doc.save('Reporte_Institucional.pdf');
}
