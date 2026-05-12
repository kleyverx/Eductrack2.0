import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPDF = async (result, userData, chartRef) => {
  const doc = new jsPDF('p', 'mm', 'a4');

  // Título y encabezado
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(52, 73, 94); // Color azul oscuro
  doc.text('Informe de Orientación Vocacional', 20, 30);

  // Información del usuario con un formato de tabla simple
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Color negro
  const userDetails = [
    `Nombre: ${userData.name || ''} ${userData.secondName || ''} ${userData.apellido || ''} ${userData.segundoApellido || ''}`,
    `Cédula: ${userData.cedula || '---'}`
  ];
  doc.text(userDetails, 20, 45);

  // Separador decorativo
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 55, 190, 55);

  // Gráfico
  if (chartRef?.current) {
    const canvas = await html2canvas(chartRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 170;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    doc.addImage(imgData, 'PNG', 20, 65, imgWidth, imgHeight);
  }

  // Título de la sección de interpretación
  let y = 65;
  if (chartRef?.current) {
    y = y + ((chartRef.current.offsetHeight * 170) / chartRef.current.offsetWidth) + 20;
  } else {
    y = 100;
  }
  
  // Si el contenido se va a la siguiente página
  if (y > 250) {
      doc.addPage();
      y = 30;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(52, 73, 94);
  doc.text('Resultados', 20, y);

  // Contenido de la interpretación
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const interpretation = result.interpretation || 'Sin interpretación.';
  const textLines = doc.splitTextToSize(interpretation, 170);
  doc.text(textLines, 20, y + 10);

  // Guardar documento
  doc.save(`resultados_${userData.cedula || 'usuario'}.pdf`);
};