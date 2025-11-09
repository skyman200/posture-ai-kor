/**
 * 미리보기 유틸리티 함수
 * PDF/이미지 미리보기를 위한 헬퍼 함수들
 */

import { createRoot, Root } from "react-dom/client";
import PreviewDownloader from "../components/PreviewDownloader";

let previewRoot: Root | null = null;
let previewContainer: HTMLDivElement | null = null;

/**
 * 미리보기 표시 함수
 * @param blob - 파일 Blob 객체
 * @param fileName - 파일명
 */
export function showPreview(blob: Blob, fileName: string) {
  // 기존 미리보기가 있으면 제거
  if (previewContainer && previewRoot) {
    previewRoot.unmount();
    if (document.body.contains(previewContainer)) {
      document.body.removeChild(previewContainer);
    }
  }

  // 새 컨테이너 생성
  previewContainer = document.createElement("div");
  previewContainer.id = "preview-downloader-container";
  document.body.appendChild(previewContainer);

  // React Root 생성 및 렌더링
  previewRoot = createRoot(previewContainer);
  previewRoot.render(
    <PreviewDownloader
      fileBlob={blob}
      fileName={fileName}
      onClose={closePreview}
    />
  );
}

/**
 * 미리보기 닫기 함수
 */
export function closePreview() {
  if (previewRoot && previewContainer) {
    previewRoot.unmount();
    if (document.body.contains(previewContainer)) {
      document.body.removeChild(previewContainer);
    }
    previewRoot = null;
    previewContainer = null;
  }
}

/**
 * PDF Blob 생성 및 미리보기 표시
 * @param pdfInstance - jsPDF 인스턴스
 * @param fileName - 파일명
 */
export async function previewPDF(pdfInstance: any, fileName: string) {
  try {
    const blob = pdfInstance.output("blob");
    if (!blob || blob.size === 0) {
      throw new Error("PDF Blob 생성 실패");
    }
    showPreview(blob, fileName);
  } catch (err) {
    console.error("❌ PDF 미리보기 실패:", err);
    // 폴백: 직접 저장
    try {
      pdfInstance.save(fileName);
    } catch (saveErr) {
      alert("⚠️ PDF 생성 중 오류가 발생했습니다.");
    }
  }
}

/**
 * 이미지 캔버스를 Blob으로 변환 후 미리보기 표시
 * @param canvas - HTMLCanvasElement
 * @param fileName - 파일명 (기본값: "posture_capture.jpg")
 * @param quality - 이미지 품질 (0.0 ~ 1.0, 기본값: 0.7)
 * @param format - 이미지 포맷 (기본값: "image/jpeg")
 */
export async function previewImage(
  canvas: HTMLCanvasElement,
  fileName: string = "posture_capture.jpg",
  quality: number = 0.7,
  format: string = "image/jpeg"
) {
  try {
    const dataURL = canvas.toDataURL(format, quality);
    const blob = await fetch(dataURL).then((r) => r.blob());
    showPreview(blob, fileName);
  } catch (err) {
    console.error("❌ 이미지 미리보기 실패:", err);
    alert("⚠️ 이미지 생성 중 오류가 발생했습니다.");
  }
}

