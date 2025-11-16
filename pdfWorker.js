// pdfWorker.js (완전 통합 버전)
// GitHub Pages 절대 경로 사용
const baseUrl = self.location.origin + self.location.pathname.replace(/\/[^/]*$/, '/');

try {
  self.importScripts(baseUrl + 'libs/jspdf.umd.min.js');
  self.importScripts(baseUrl + 'libs/html2canvas.min.js');
} catch (err) {
  self.postMessage({
    type: 'error',
    message: 'Failed to load libraries: ' + err.message,
    stack: err.stack
  });
  throw err;
}

let pdf = null;

self.onmessage = async function (e) {
  const msg = e.data;

  try {
    if (msg.type === 'init') {
      const { jsPDF } = self.jspdf;

      pdf = new jsPDF({
        orientation: "p",
        unit: "px",
        format: "a4",
        compress: true,
        putOnlyUsedFonts: true,
        floatPrecision: 16
      });
      return;
    }

    if (msg.type === 'addImage') {
      if (!pdf) return;

      // ✅ imageType과 compression 파라미터 지원 (PNG 고품질, SLOW 렌더링)
      const imageType = msg.imageType || "JPEG";
      const compression = msg.compression || (imageType === "PNG" ? "SLOW" : "FAST");

      pdf.addImage(
        msg.dataUrl,
        imageType,
        msg.x,
        msg.y,
        msg.width,
        msg.height,
        undefined,
        compression
      );

      if (msg.addPageAfter) pdf.addPage();
      return;
    }

    if (msg.type === 'finalize') {
      const buffer = pdf.output("arraybuffer");
      self.postMessage({ type: 'pdfReady', buffer }, [buffer]);
      pdf = null;
      return;
    }

  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err?.message ?? "Worker internal error",
      stack: err?.stack ?? null
    });
  }
};
