/**
 * Exportador de constancias oficiales (PDF con jsPDF + autotable) con
 * código de control y QR de verificación pública.
 * Formato de encabezado membretado venezolano (República Bolivariana / MPPE).
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

const TITULOS = {
  estudios: 'CONSTANCIA DE ESTUDIOS',
  'con-representante': 'CONSTANCIA DE ESTUDIOS',
  conducta: 'CONSTANCIA DE BUENA CONDUCTA',
  rendimiento: 'CONSTANCIA DE RENDIMIENTO',
};

/** Encabezado membretado común. Recibe la institución por parámetro. Devuelve la Y donde continuar. */
function encabezado(doc, institucion, titulo, subtitulo) {
  const w = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('REPÚBLICA BOLIVARIANA DE VENEZUELA', w / 2, 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN', w / 2, 19, { align: 'center' });
  doc.text((institucion || 'EduTrack Insight').toUpperCase(), w / 2, 24, { align: 'center' });
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

/**
 * Genera y descarga el PDF de una constancia.
 * @param {object} resp  { codigo, tipo, datos, fecha }
 */
export async function exportConstanciaPDF(resp) {
  try {
    const { tipo, datos } = resp;
    const orientacion = tipo === 'rendimiento' ? 'landscape' : 'portrait';
    const doc = new jsPDF({ orientation: orientacion });
    const w = doc.internal.pageSize.getWidth();
    const titulo = TITULOS[tipo] || 'CONSTANCIA';

    let y = encabezado(doc, datos.institucion, titulo);
    let yPie;

    if (tipo === 'estudios' || tipo === 'con-representante') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const est = datos.estudiante || {};
      const donde = datos.seccion
        ? `${datos.seccion.etiquetaAnio}, Sección ${datos.seccion.nombre}, durante el período escolar ${datos.seccion.periodo}`
        : 'esta institución';
      const parrafo =
        `Quien suscribe hace constar que el(la) estudiante ${est.nombre || ''}, ` +
        `titular de la Cédula de Identidad N° ${est.cedula || ''}, se encuentra inscrito(a) ` +
        `y cursa estudios en ${donde}.`;
      doc.text(parrafo, 14, y + 8, { maxWidth: w - 28, align: 'justify' });
      let yTexto = y + 30;
      if (tipo === 'con-representante' && datos.representante) {
        const rep = datos.representante;
        const parrafoRep =
          `Su representante legal es ${rep.nombre || ''}, C.I. N° ${rep.cedula || ''}.`;
        doc.text(parrafoRep, 14, yTexto, { maxWidth: w - 28, align: 'justify' });
        yTexto += 10;
      }
      yPie = Math.max(yTexto + 20, 130);
    } else if (tipo === 'conducta') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const est = datos.estudiante || {};
      const parrafo =
        `Quien suscribe hace constar que el(la) estudiante ${est.nombre || ''}, ` +
        `C.I. N° ${est.cedula || ''}, ha observado una conducta ${datos.conducta || 'satisfactoria'} ` +
        `durante su permanencia en la institución.`;
      doc.text(parrafo, 14, y + 8, { maxWidth: w - 28, align: 'justify' });
      yPie = 130;
    } else if (tipo === 'rendimiento') {
      const sec = datos.seccion || {};
      const sub = `${sec.etiquetaAnio || ''} — Sección ${sec.nombre || ''} · Período ${sec.periodo || ''}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(sub.trim(), w / 2, y + 4, { align: 'center' });

      const head = [['N°', 'Estudiante', 'C.I.', ...datos.materias.map((m) => m.nombre)]];
      const body = datos.filas.map((f, i) => [
        i + 1,
        f.nombre,
        f.cedula,
        ...f.notas.map((n) => (n == null ? '—' : n)),
      ]);
      autoTable(doc, {
        head,
        body,
        startY: y + 10,
        styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
        headStyles: { fillColor: [49, 46, 129] },
        columnStyles: { 1: { halign: 'left' } },
        margin: { left: 14, right: 14 },
      });
      yPie = doc.lastAutoTable.finalY + 16;
    } else {
      yPie = 130;
    }

    // ---- Pie: firma + código de control + QR de verificación ----
    const h = doc.internal.pageSize.getHeight();
    // Si el pie no cabe, nueva página.
    if (yPie > h - 55) {
      doc.addPage();
      yPie = 40;
    }

    const url = `${window.location.origin}/verificar/${resp.codigo}`;
    const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 120 });
    doc.addImage(qrDataUrl, 'PNG', w - 45, yPie, 28, 28);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Verifica en línea', w - 45, yPie + 32);

    doc.setFontSize(9);
    doc.text('Código de control: ' + resp.codigo, 14, yPie + 10);

    // Firmas (izquierda)
    const yFirma = yPie + 26;
    doc.setFontSize(9);
    doc.text('_____________________________', 14, yFirma);
    doc.text('Director(a)', 32, yFirma + 5);
    doc.text('_____________________________', 90, yFirma);
    doc.text('Sello de la Institución', 100, yFirma + 5);

    const fecha = new Date(resp.fecha || Date.now()).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.setFontSize(8);
    doc.text('Emitido el ' + fecha, 14, h - 12);

    doc.save(`Constancia_${resp.tipo}_${resp.codigo}.pdf`);
  } catch (err) {
    throw new Error(err.message || 'No se pudo generar el PDF de la constancia.');
  }
}
