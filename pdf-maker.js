// ============================
//   PDF v3 (UI 그대로 + OCR)
//   html2canvas + jsPDF + Tesseract.js
// ============================

window.saveFullPDF = async function () {
  const progressBox = document.getElementById("pdfProgress");
  const update = (v, msg) => {
    if (progressBox) {
      progressBox.style.display = "block";
      progressBox.innerText = msg ? msg : `PDF 저장중... ${v}%`;
    }
  };

  try {
    // jsPDF 확인
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error("jsPDF 라이브러리가 로드되지 않았습니다.");
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    update(5, "PDF 준비 중...");

    // --------------------------------------
    // 1) 페이지 1 : 측면 Before / After
    // --------------------------------------
    update(10, "측면 이미지 처리 중...");

    const sideBefore = window.sideBeforeImg;
    const sideAfter = window.sideAfterImg;
    const sideOverlay = window.sideOverlayImg;

    if (!sideBefore || !sideAfter || !sideOverlay) {
      alert("측면 이미지가 준비되지 않았습니다.");
      if (progressBox) progressBox.style.display = "none";
      return;
    }

    pdf.setFontSize(18);
    pdf.setTextColor(124, 156, 255); // 앱 테마 색상
    pdf.text("측면 비교 (Side View)", 10, 15);

    // Before/After 나란히 배치
    pdf.addImage(sideBefore, "PNG", 10, 20, 90, 130);
    pdf.addImage(sideAfter, "PNG", 110, 20, 90, 130);

    pdf.setFontSize(14);
    pdf.setTextColor(155, 163, 175);
    pdf.text("Overlay", 10, 165);
    pdf.addImage(sideOverlay, "PNG", 10, 170, 180, 100);

    pdf.addPage();

    // --------------------------------------
    // 2) 페이지 2 : 정면 Before / After
    // --------------------------------------
    update(40, "정면 이미지 처리 중...");

    const frontBefore = window.frontBeforeImg;
    const frontAfter = window.frontAfterImg;
    const frontOverlay = window.frontOverlayImg;

    if (!frontBefore || !frontAfter || !frontOverlay) {
      alert("정면 이미지가 준비되지 않았습니다.");
      if (progressBox) progressBox.style.display = "none";
      return;
    }

    pdf.setFontSize(18);
    pdf.setTextColor(124, 156, 255);
    pdf.text("정면 비교 (Front View)", 10, 15);

    pdf.addImage(frontBefore, "PNG", 10, 20, 90, 130);
    pdf.addImage(frontAfter, "PNG", 110, 20, 90, 130);

    pdf.setFontSize(14);
    pdf.setTextColor(155, 163, 175);
    pdf.text("Overlay", 10, 165);
    pdf.addImage(frontOverlay, "PNG", 10, 170, 180, 100);

    pdf.addPage();

    // --------------------------------------
    // 3) 페이지 3 : 웹앱 UI 전체 DOM 캡처
    // --------------------------------------
    update(60, "리포트 UI 캡처 중...");

    const targetDOM = document.getElementById("report-box");
    if (!targetDOM) {
      console.warn("#report-box 요소를 찾을 수 없습니다.");
      update(100, "완료 (리포트 박스 없음)");
      setTimeout(() => {
        if (progressBox) progressBox.style.display = "none";
      }, 1200);
      pdf.save("posture_report.pdf");
      return;
    }

    if (typeof html2canvas === 'undefined') {
      throw new Error("html2canvas 라이브러리가 로드되지 않았습니다.");
    }

    const canvas = await html2canvas(targetDOM, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0b0f14',
      logging: false
    });
    const reportPNG = canvas.toDataURL("image/png");

    pdf.setFontSize(18);
    pdf.setTextColor(124, 156, 255);
    pdf.text("자세 분석 리포트 (UI 캡처)", 10, 15);

    // A4 크기에 맞춰 이미지 추가 (190mm 너비, 높이는 비율에 맞춰)
    const imgWidth = 190;
    const imgHeight = (canvas.height / canvas.width) * imgWidth;
    pdf.addImage(reportPNG, "PNG", 10, 20, imgWidth, imgHeight);

    pdf.addPage();

    // --------------------------------------
    // 4) 페이지 4 : OCR (텍스트 선택 가능)
    // --------------------------------------
    update(80, "OCR 텍스트 추출 중...");

    if (typeof Tesseract === 'undefined') {
      console.warn("Tesseract.js가 로드되지 않았습니다. OCR을 건너뜁니다.");
      pdf.setFontSize(16);
      pdf.setTextColor(124, 156, 255);
      pdf.text("OCR 텍스트 레이어 (Tesseract.js 미로드)", 10, 15);
    } else {
      pdf.setFontSize(16);
      pdf.setTextColor(124, 156, 255);
      pdf.text("OCR 텍스트 (숨김 텍스트 레이어)", 10, 15);

      try {
        const { data: { text: ocrText } } = await Tesseract.recognize(
          reportPNG,
          "kor+eng",
          {
            logger: m => {
              if (m.status === 'recognizing text') {
                const progress = 80 + Math.floor(m.progress * 15);
                update(progress, `OCR 진행중... ${Math.floor(m.progress * 100)}%`);
              }
            }
          }
        );

        // 시각적으로 거의 안 보이게 삽입 (흰색, 작은 폰트)
        pdf.setFontSize(1);
        pdf.setTextColor(255, 255, 255);
        // 텍스트를 여러 줄로 나눠서 추가
        const lines = pdf.splitTextToSize(ocrText, 200);
        pdf.text(lines, 1, 30);
      } catch (ocrErr) {
        console.warn("OCR 실패:", ocrErr);
        pdf.setFontSize(12);
        pdf.setTextColor(155, 163, 175);
        pdf.text("OCR 처리 중 오류가 발생했습니다.", 10, 30);
      }
    }

    // --------------------------------------
    // SAVE
    // --------------------------------------
    update(98, "PDF 저장 중...");

    const fileName = `posture_report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    update(100, "완료!");
    setTimeout(() => {
      if (progressBox) progressBox.style.display = "none";
    }, 1200);

    console.log("✅ PDF 생성 완료:", fileName);

  } catch (err) {
    console.error("❌ PDF 생성 오류:", err);
    alert("PDF 생성 중 오류가 발생했습니다: " + err.message);
    if (progressBox) progressBox.style.display = "none";
  }
};

// 기존 함수명 호환성
window.savePosturePdf = window.saveFullPDF;
window.savePosturePdfFromApp = window.saveFullPDF;

console.log("[PDF v3] ✅ html2canvas + jsPDF + Tesseract.js 기반 PDF 시스템 준비 완료");
console.log("[PDF v3] 사용법: saveFullPDF() 또는 savePosturePdf()");

