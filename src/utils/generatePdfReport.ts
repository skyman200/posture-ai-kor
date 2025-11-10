/**
 * PDF 리포트 생성 유틸리티
 * html2canvas + jsPDF를 사용하여 HTML 요소를 PDF로 변환
 * 모바일 호환: Blob + navigator.share 지원
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export interface PdfOptions {
  pageFormat?: "a4" | "letter" | [number, number];
  margin?: number;
  includeDate?: boolean;
}

/**
 * HTML 요소를 PDF로 변환하여 저장/공유
 * @param containerEl - 리포트가 포함된 HTML 요소
 * @param fileName - 저장할 파일명
 * @param options - PDF 옵션
 */
export async function renderElementToPdf(
  containerEl: HTMLElement,
  fileName: string = "posture_report.pdf",
  options: PdfOptions = {}
) {
  const opt = Object.assign(
    { pageFormat: "a4" as const, margin: 12, includeDate: true },
    options
  );

  // 파일명에 날짜 추가 (옵션)
  let finalFileName = fileName;
  if (opt.includeDate) {
    const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const nameWithoutExt = fileName.replace(/\.pdf$/i, "");
    finalFileName = `${nameWithoutExt}_${dateStr}.pdf`;
  }

  const pdf = new jsPDF({ unit: "mm", format: opt.pageFormat });

  // 1) 배경색 강제 설정 (정확한 캡처를 위해)
  const originalBgColor = containerEl.style.backgroundColor;
  containerEl.style.backgroundColor = "#ffffff";

  try {
    // 2) html2canvas로 렌더링 (고해상도)
    const scale = Math.min(2, window.devicePixelRatio || 1.5);
    const canvas = await html2canvas(containerEl, {
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: containerEl.scrollWidth,
      windowHeight: containerEl.scrollHeight,
    });

    // 3) 캔버스를 이미지로 변환
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const imgProps = (pdf as any).getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth() - opt.margin * 2; // mm
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // 4) 페이지 분할 처리
    let heightLeft = pdfHeight;
    let position = 0;

    // 첫 페이지 추가
    pdf.addImage(
      imgData,
      "JPEG",
      opt.margin,
      opt.margin,
      pdfWidth,
      pdfHeight
    );
    heightLeft -= pdf.internal.pageSize.getHeight() - opt.margin * 2;

    // 추가 페이지가 필요한 경우
    while (heightLeft > -0.01) {
      pdf.addPage();
      position -= pdf.internal.pageSize.getHeight() - opt.margin * 2;
      pdf.addImage(
        imgData,
        "JPEG",
        opt.margin,
        position + opt.margin,
        pdfWidth,
        pdfHeight
      );
      heightLeft -= pdf.internal.pageSize.getHeight() - opt.margin * 2;
    }

    // 5) Blob 생성 및 저장/공유
    const pdfBlob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);

    // 모바일: navigator.share 시도
    if (navigator.share) {
      try {
        const file = new File([pdfBlob], finalFileName, {
          type: "application/pdf",
        });
        await navigator.share({
          files: [file],
          title: finalFileName,
          text: "자세 분석 리포트",
        });
        URL.revokeObjectURL(blobUrl);
        return;
      } catch (err: any) {
        // 사용자가 공유를 취소했거나 실패한 경우 다운로드로 폴백
        if (err.name !== "AbortError") {
          console.debug("공유 실패, 다운로드로 폴백:", err);
        }
      }
    }

    // 폴백: 다운로드 링크 생성
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = finalFileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    // 정리
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 100);
  } catch (err) {
    console.error("❌ PDF 생성 실패:", err);
    alert("⚠️ PDF 생성 중 오류가 발생했습니다.");
    throw err;
  } finally {
    // 원래 배경색 복원
    containerEl.style.backgroundColor = originalBgColor;
  }
}

