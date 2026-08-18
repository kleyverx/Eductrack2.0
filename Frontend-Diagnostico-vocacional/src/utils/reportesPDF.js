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

/**
 * PDF del reporte de un docente concreto (mismas métricas que el institucional,
 * pero acotado a las secciones de ese docente y sin la columna Docente).
 * @param {string} docenteNombre nombre del docente
 * @param {Array} secciones items de porSeccion pertenecientes a ese docente
 */
export function exportReporteDocentePDF(docenteNombre, secciones = []) {
  const doc = new jsPDF();
  const fecha = new Date().toLocaleDateString('es-VE');
  const y = encabezado(doc, 'REPORTE POR DOCENTE', `Prof. ${docenteNombre} · ${fecha}`);

  autoTable(doc, {
    head: [['Sección', 'Estud.', 'Prom.', 'Aprob.', 'Aplaz.', '% Inasist.', 'Riesgo']],
    body: (secciones || []).map(s => [
      s.seccion, s.estudiantes,
      s.promedio != null ? s.promedio : '—',
      s.aprobados, s.aplazados, `${s.inasistenciaPromedio}%`, s.enRiesgo,
    ]),
    startY: y,
    styles: { fontSize: 8, cellPadding: 1.6, halign: 'center' },
    headStyles: { fillColor: [49, 46, 129], fontSize: 8, halign: 'center' },
    columnStyles: { 0: { halign: 'left', cellWidth: 40 } },
    didParseCell(data2) {
      if (data2.section === 'body' && data2.column.index === 2) {
        const v = parseFloat(data2.cell.raw);
        if (!Number.isNaN(v) && v < 10) data2.cell.styles.textColor = [190, 18, 60];
      }
    },
  });

  let fy = doc.lastAutoTable.finalY + 8;
  const total = (secciones || []).length;
  doc.setFontSize(8); doc.setFont('helvetica', 'italic');
  doc.text(`Total de secciones: ${total}. Documento generado por EduTrack.`, 14, fy);

  fy = Math.max(fy + 16, 260);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text('_____________________________', 25, fy);
  doc.text('Director(a)', 42, fy + 5);
  doc.text('_____________________________', 125, fy);
  doc.text('Sello de la Institución', 135, fy + 5);

  doc.save('Reporte_' + docenteNombre.replace(/\s+/g, '_') + '.pdf');
}

const AUDIT_LABEL = {
  'login': 'Inicio de sesión',
  'crear-usuario': 'Creación de usuario',
  'eliminar-usuario': 'Eliminación',
  'config': 'Configuración',
  'constancia': 'Constancia',
};

/** PDF del registro de auditoría. @param {Array} logs eventos de GET /api/admin/auditoria */
export function exportAuditoriaPDF(logs) {
  const doc = new jsPDF();
  const fecha = new Date().toLocaleString('es-VE');
  const y = encabezado(doc, 'REGISTRO DE AUDITORÍA', `Actividad del sistema · Generado ${fecha}`);

  autoTable(doc, {
    head: [['Fecha y hora', 'Evento', 'Actor', 'Detalle']],
    body: (logs || []).map(l => [
      new Date(l.createdAt).toLocaleString('es-VE'),
      AUDIT_LABEL[l.accion] || l.accion,
      `${l.actorNombre || 'Sistema'}${l.actorRol ? ' (' + l.actorRol + ')' : ''}`,
      l.detalle || '',
    ]),
    startY: y,
    styles: { fontSize: 7.5, cellPadding: 1.6, valign: 'middle' },
    headStyles: { fillColor: [49, 46, 129], fontSize: 8, halign: 'left' },
    columnStyles: { 0: { cellWidth: 34 }, 1: { cellWidth: 32 }, 3: { cellWidth: 'auto' } },
  });

  const total = (logs || []).length;
  const fy = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(8); doc.setFont('helvetica', 'italic');
  doc.text(`Total de eventos: ${total}. Documento generado automáticamente por EduTrack.`, 14, fy);

  doc.save('Auditoria.pdf');
}
