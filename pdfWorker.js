// pdfWorker.js (완전 통합 버전)
self.importScripts('./libs/jspdf.umd.min.js');
self.importScripts('./libs/html2canvas.min.js');

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

      pdf.addImage(
        msg.dataUrl,
        "JPEG",
        msg.x,
        msg.y,
        msg.width,
        msg.height,
        undefined,
        "FAST"
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
