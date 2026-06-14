/**
 * Exportadores de documentos académicos (PDF con jsPDF + autotable, y CSV).
 * Formato de encabezado oficial venezolano (República Bolivariana / MPPE).
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const LAPSO_LABEL = { 1: '1ER LAPSO', 2: '2DO LAPSO', 3: '3ER LAPSO' };

/** Nombre de la institución desde la configuración del superadmin (localStorage). */
function getInstitucion() {
  try {
    const cfg = JSON.parse(localStorage.getItem('edutrack_config'));
    return cfg?.institucion || 'EduTrack Insight';
  } catch {
    return 'EduTrack Insight';
  }
}

/** Encabezado membretado común. Devuelve la Y donde continuar. */
function encabezado(doc, titulo, subtitulo) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('REPÚBLICA BOLIVARIANA DE VENEZUELA', w / 2, 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN', w / 2, 19, { align: 'center' });
  doc.text(getInstitucion().toUpperCase(), w / 2, 24, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(titulo, w / 2, 33, { align: 'center' });
  if (subtitulo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(subtitulo, w / 2, 39, { align: 'center' });
  }
  return subtitulo ? 45 : 40;
}

/** Descarga un blob con el nombre dado. */
function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
 * Preinforme académico (resumen de la sección por lapso)
 * ============================================================ */

/**
 * PDF del preinforme: tabla estudiantes × materias con promedios.
 * @param {object} resumen  Respuesta de GET /secciones/:id/resumen/:lapso
 */
export function exportPreinformePDF(resumen) {
  const doc = new jsPDF({ orientation: 'landscape' });
  const sub = `${resumen.etiquetaAnio} — Sección ${resumen.seccion.nombre} · Período ${resumen.seccion.periodo} · ${LAPSO_LABEL[resumen.lapso]}`;
  const startY = encabezado(doc, 'PREINFORME ACADÉMICO', sub);

  const head = [['N°', 'Apellidos y Nombres', 'C.I.', ...resumen.materias.map(m => m.nombre), 'PROM.']];
  const body = resumen.filas.map((f, i) => [
    i + 1,
    `${f.estudiante.apellido || ''} ${f.estudiante.name || ''}`.trim(),
    f.estudiante.cedula ?? '',
    ...f.notas.map(n => (n.acumulado !== null ? n.acumulado : '—')),
    f.promedio !== null ? f.promedio : '—',
  ]);

  autoTable(doc, {
    head,
    body,
    startY,
    styles: { fontSize: 7.5, cellPadding: 1.5, halign: 'center' },
    headStyles: { fillColor: [49, 46, 129], fontSize: 7, halign: 'center' },
    columnStyles: { 1: { halign: 'left', cellWidth: 45 } },
    didParseCell(data) {
      // Resaltar notas en riesgo (< 10) en el cuerpo
      if (data.section === 'body' && data.column.index >= 3) {
        const v = parseFloat(data.cell.raw);
        if (!Number.isNaN(v) && v < 10) data.cell.styles.textColor = [190, 18, 60];
      }
    },
  });

  const finalY = doc.lastAutoTable.finalY + 18;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('_____________________________', 40, finalY);
  doc.text('Firma del Docente', 52, finalY + 5);
  doc.text('_____________________________', 180, finalY);
  doc.text('Sello de la Institución', 190, finalY + 5);

  doc.save(`Preinforme_${resumen.etiquetaAnio}_${resumen.seccion.nombre}_L${resumen.lapso}.pdf`);
}

/**
 * CSV del preinforme (separador ; — compatible con Excel en español).
 */
export function exportPreinformeCSV(resumen) {
  const enc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const filasCsv = [
    [enc('Preinforme Académico'), enc(`${resumen.etiquetaAnio} Sección ${resumen.seccion.nombre}`), enc(LAPSO_LABEL[resumen.lapso]), enc(resumen.seccion.periodo)].join(';'),
    ['N°', 'Apellidos y Nombres', 'Cédula', ...resumen.materias.map(m => enc(m.nombre)), 'Promedio'].join(';'),
    ...resumen.filas.map((f, i) => [
      i + 1,
      enc(`${f.estudiante.apellido || ''} ${f.estudiante.name || ''}`.trim()),
      f.estudiante.cedula ?? '',
      ...f.notas.map(n => (n.acumulado !== null ? String(n.acumulado).replace('.', ',') : '')),
      f.promedio !== null ? String(f.promedio).replace('.', ',') : '',
    ].join(';')),
  ].join('\r\n');

  // BOM para que Excel reconozca acentos
  const blob = new Blob(['﻿' + filasCsv], { type: 'text/csv;charset=utf-8' });
  descargar(blob, `Preinforme_${resumen.etiquetaAnio}_${resumen.seccion.nombre}_L${resumen.lapso}.csv`);
}

/* ============================================================
 * Certificación de Calificaciones (1ro a 4to año)
 * ============================================================ */

/**
 * PDF formal de certificación de calificaciones.
 * @param {object} cert  Respuesta de GET /estudiantes/:id/certificacion
 */
export function exportCertificacionPDF(cert) {
  const doc = new jsPDF(); // vertical
  const w = doc.internal.pageSize.getWidth();
  let y = encabezado(doc, 'CERTIFICACIÓN DE CALIFICACIONES', 'Educación Media General (1er a 4to Año)');

  // Datos del estudiante
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const nombre = `${cert.estudiante.apellido || ''} ${cert.estudiante.name || ''}`.trim();
  doc.text(`Quien suscribe, certifica que el (la) estudiante: ${nombre},`, 14, y + 4);
  doc.text(`titular de la Cédula de Identidad N° ${cert.estudiante.cedula}, obtuvo las siguientes calificaciones:`, 14, y + 10);
  y += 18;

  for (const anio of cert.anios) {
    autoTable(doc, {
      head: [[{ content: `${anio.etiquetaAnio} — Sección ${anio.seccion} (${anio.periodo})`, colSpan: 5, styles: { halign: 'left', fillColor: [49, 46, 129] } }],
             ['Área de Formación', '1er Lapso', '2do Lapso', '3er Lapso', 'Definitiva']],
      body: anio.materias.map(m => [
        m.nombre,
        m.lapsos[1] ?? '—',
        m.lapsos[2] ?? '—',
        m.lapsos[3] ?? '—',
        m.definitiva !== null ? `${m.definitiva}${m.completa ? '' : ' *'}` : '—',
      ]),
      foot: [[
        { content: 'PROMEDIO DEL AÑO', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: anio.promedioAnio !== null ? String(anio.promedioAnio) : '—', styles: { fontStyle: 'bold', halign: 'center' } },
      ]],
      startY: y,
      styles: { fontSize: 8, cellPadding: 1.6 },
      headStyles: { fontSize: 8, halign: 'center' },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
      columnStyles: {
        0: { halign: 'left', cellWidth: 80 },
        1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 6;
    // Salto de página si no cabe la siguiente tabla
    if (y > 230) { doc.addPage(); y = 20; }
  }

  // Promedio general
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    `PROMEDIO GENERAL (1ro a 4to): ${cert.promedioGeneral !== null ? cert.promedioGeneral : '—'}`,
    w / 2, y + 4, { align: 'center' }
  );
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (cert.anios.some(a => a.materias.some(m => !m.completa && m.definitiva !== null))) {
    doc.text('(*) Calificación calculada con los lapsos cargados hasta la fecha (año en curso).', 14, y);
    y += 6;
  }
  if (cert.aniosCargados < 4) {
    doc.text(`Nota: certificación parcial — ${cert.aniosCargados} de 4 años con calificaciones cargadas.`, 14, y);
    y += 6;
  }

  // Firmas
  y = Math.max(y + 22, 250);
  if (y > 270) { doc.addPage(); y = 60; }
  doc.setFontSize(9);
  doc.text('_____________________________', 25, y);
  doc.text('Director(a)', 42, y + 5);
  doc.text('_____________________________', 125, y);
  doc.text('Sello de la Institución', 135, y + 5);

  const fecha = new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.setFontSize(8);
  doc.text(`Emitido el ${fecha}`, 14, 285);

  doc.save(`Certificacion_${cert.estudiante.cedula}.pdf`);
}
