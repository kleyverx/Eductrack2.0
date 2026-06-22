import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Exporta el informe de orientación vocacional a PDF.
 * Incluye datos del estudiante, gráfico de áreas y el análisis con IA
 * (resumen, fortalezas, carreras sugeridas y próximos pasos).
 */
export const exportToPDF = async (result, userData, chartRef) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const INDIGO = [79, 70, 229];
  const SLATE = [51, 65, 85];
  let y = 22;

  // Encabezado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...SLATE);
  doc.text('Informe de Orientación Vocacional', 20, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const nombre = `${userData.name || ''} ${userData.apellido || ''}`.trim();
  doc.text(`Estudiante: ${nombre}`, 20, y); y += 6;
  doc.text(`Cédula: ${userData.cedula || '---'}`, 20, y); y += 4;

  doc.setDrawColor(226, 232, 240);
  doc.line(20, y + 2, 190, y + 2);
  y += 10;

  // Gráfico de áreas
  if (chartRef?.current) {
    try {
      const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 170;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      doc.addImage(imgData, 'PNG', 20, y, imgWidth, imgHeight);
      y += imgHeight + 10;
    } catch (_) { /* sin gráfico */ }
  }

  // Helper: título de sección con salto de página si hace falta
  const seccion = (titulo) => {
    if (y > 260) { doc.addPage(); y = 22; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...INDIGO);
    doc.text(titulo, 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
  };

  // Helper: lista con viñetas/numeradas y wrap
  const lista = (items, numerada = false) => {
    items.forEach((item, i) => {
      if (y > 275) { doc.addPage(); y = 22; }
      const prefijo = numerada ? `${i + 1}. ` : '•  ';
      const lineas = doc.splitTextToSize(`${prefijo}${item}`, 168);
      doc.text(lineas, 22, y);
      y += lineas.length * 5.2 + 1;
    });
    y += 3;
  };

  const analisis = result.analisis || {};

  // Resumen / interpretación
  seccion('Análisis del Perfil');
  const resumen = analisis.resumen || result.interpretation || 'Sin análisis disponible.';
  const lineasResumen = doc.splitTextToSize(resumen, 170);
  doc.text(lineasResumen, 20, y);
  y += lineasResumen.length * 5.2 + 8;

  if (analisis.fortalezas?.length) { seccion('Fortalezas'); lista(analisis.fortalezas); }
  if (analisis.carreras?.length) { seccion('Carreras Sugeridas'); lista(analisis.carreras); }
  if (analisis.pasos?.length) { seccion('Próximos Pasos'); lista(analisis.pasos, true); }

  doc.save(`orientacion_vocacional_${userData.cedula || 'estudiante'}.pdf`);
};
