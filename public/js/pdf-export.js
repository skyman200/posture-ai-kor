// ✅ html2canvas + jsPDF를 이용한 완전 자동 한글 포함 PDF 내보내기

// NotoSansKR 폰트 base64 데이터 (약 1.5MB)
// 실제 사용 시 온라인에서 다운로드하거나 로컬 폰트 파일을 base64로 변환하여 사용
// 여기서는 이미지 기반 캡처로 한글을 처리 (폰트 없이도 작동)
const notoSansKR = `
data:font/truetype;base64,AAEAAAASAQAABAAgR0RFRrRCsIIAAEAAAAA...
(실제 폰트 base64 데이터는 매우 길어서 생략 - 필요시 온라인에서 생성)
`;

async function exportPDF() {
  const element = document.getElementById("capture-area");
  if (!element) {
    alert("PDF로 내보낼 영역(#capture-area)이 없습니다.");
    return;
  }

  try {
    // ✅ html2canvas로 이미지 캡처 (한글은 이미지로 처리되어 폰트 문제 없음)
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF("p", "mm", "a4");

    // ✅ 이미지 기반이므로 폰트 설정 불필요 (이미지에 모든 텍스트 포함됨)
    // 필요시 아래 주석을 해제하여 폰트 추가 가능
    /*
    if (notoSansKR && notoSansKR.length > 100) {
      try {
        pdf.addFileToVFS("NotoSansKR-Regular.ttf", notoSansKR);
        pdf.addFont("NotoSansKR-Regular.ttf", "NotoSansKR", "normal");
        pdf.setFont("NotoSansKR");
      } catch (e) {
        console.warn("폰트 추가 실패, 기본 폰트 사용:", e);
      }
    }
    */

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
