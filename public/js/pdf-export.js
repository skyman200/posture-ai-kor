// ✅ html2canvas + jsPDF를 이용한 완전 자동 한글 포함 PDF 내보내기

async function exportPDF() {
  const element = document.getElementById("capture-area");
  if (!element) {
    alert("PDF로 내보낼 영역(#capture-area)이 없습니다.");
    return;
  }

  try {
    // ✅ html2canvas로 이미지 캡처 - 한글 폰트 문제 해결을 위한 설정
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      allowTaint: false,
      foreignObjectRendering: true,
      // 폰트 렌더링 개선
      onclone: (clonedDoc) => {
        // 클론된 문서의 모든 텍스트가 제대로 렌더링되도록
        const clonedElement = clonedDoc.getElementById("capture-area");
        if (clonedElement) {
          // 폰트가 로드되도록 강제
          clonedElement.style.fontFamily = 
            "system-ui, -apple-system, 'Segoe UI', Roboto, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
        }
      },
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
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
