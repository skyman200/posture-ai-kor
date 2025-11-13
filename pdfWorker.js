// pdfWorker.js
self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

let pdf = null;

self.onmessage = function (e) {
  const msg = e.data;

  if (msg.type === 'init') {
    const { jsPDF } = self.jspdf;

    pdf = new jsPDF({
      orientation: "p",
      unit: "px",
      format: "a4",
      compress: false,
      putOnlyUsedFonts: true,
      floatPrecision: 16
    });

  } else if (msg.type === 'addImage') {
    if (!pdf) return;

    try {
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

    } catch (err) {
      console.error("[Worker] addImage error:", err);
    }

  } else if (msg.type === 'finalize') {
    try {
      const buffer = pdf.output("arraybuffer");
      self.postMessage({ type: 'pdfReady', buffer }, [buffer]);
      pdf = null;
    } catch (err) {
      self.postMessage({ type: 'error', message: err.message });
    }
  }
};

