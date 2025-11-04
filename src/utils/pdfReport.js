import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export function exportPDF(elementId, filename = 'Posture_AI_Report.pdf') {
  const element = document.getElementById(elementId);
  if (!element) {
    alert('리포트 영역을 찾을 수 없습니다.');
    return;
  }

  html2canvas(element, {
    scale: 2,
    backgroundColor: '#f4f0ff',
    logging: false,
  }).then((canvas) => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;
    }

    pdf.save(filename);
  }).catch((error) => {
    console.error('PDF 생성 실패:', error);
    alert('PDF 생성에 실패했습니다.');
  });
}

