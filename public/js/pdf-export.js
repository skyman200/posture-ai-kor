// ✅ PDF 내보내기 함수 (CDN 기반)
async function exportPDF() {
  const element = document.getElementById("capture-area");
  if (!element) {
    alert("분석 영역을 찾을 수 없습니다.");
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF("p", "mm", "a4");

    // ✅ 이미지 삽입
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    // 여러 페이지 처리
    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    // ✅ PDF 저장
    const filename = `posture-analysis-${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(filename);
  } catch (error) {
    console.error("PDF 생성 실패:", error);
    alert("PDF 생성에 실패했습니다. 다시 시도해주세요.");
  }
}

// ✅ 전역에서 쓸 수 있게
window.exportPDF = exportPDF;

