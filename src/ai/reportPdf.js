// src/ai/reportPdf.js
// pdfMake ONLY version (jsPDF 완전 제거)
// Canvas 그래프, Before/After, 상세 결과, 필라테스 추천 모두 포함

/**
 * 캔버스를 PNG로 변환
 */
function canvasToImage(canvas) {
  try {
    if (canvas && canvas.toDataURL)
      return canvas.toDataURL("image/png", 1.0);
  } catch (e) {
    console.warn("canvas 변환 실패:", e);
  }
  return null;
}

/**
 * 필라테스 추천 0개일 때 안전 처리
 */
function formatPilatesList(list) {
  if (!list || list.length === 0) {
    return [{ text: "- 추천 없음", margin: [10, 2, 0, 0], fontSize: 11 }];
  }
  return list.map(p => ({
    text: `- ${p.equipment || ""}: ${p.name || ""}${p.purpose ? ` (${p.purpose})` : ""}`,
    margin: [10, 2, 0, 0],
    fontSize: 11,
  }));
}

/**
 * PDF 생성
 */
export async function exportDetailedPDF({
  centerName,
  memberName,
  sessionName,
  analysis,
  before,
  after,
  charts = {}
}) {
  // ====== 이미지 변환 ======
  const overviewImg = canvasToImage(charts.overviewCanvas);
  const sideImg = canvasToImage(charts.sideChartCanvas);
  const frontImg = canvasToImage(charts.frontChartCanvas);

  // ====== document definition ======
  const doc = {
    pageSize: "A4",
    pageMargins: [20, 20, 20, 28],
    defaultStyle: {
      font: "Helvetica", // vfs 폰트 사용할 수도 있음
      fontSize: 11,
      lineHeight: 1.3,
    },
    content: [
      // =========== HEADER ===========
      {
        text: "AI 자세 분석 종합 리포트",
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 15],
      },
      { text: `센터: ${centerName || "-"}`, margin: [0, 2] },
      { text: `회원: ${memberName || "-"}`, margin: [0, 2] },
      { text: `세션: ${sessionName || "-"}`, margin: [0, 2] },
      { text: `생성: ${new Date().toLocaleString("ko-KR")}`, margin: [0, 2, 0, 10] },
      { canvas: [{ type: "line", x1: 0, x2: 550, y1: 0, y2: 0 }], margin: [0, 10] },

      // =========== ① 종합 요약 ===========
      { text: "① 종합 요약", fontSize: 14, bold: true, margin: [0, 12, 0, 6] },
      ...(analysis.sections?.length
        ? analysis.sections.map(sec => ({
            text: `-${
              sec.section === "side"
                ? "측면"
                : sec.section === "front"
                ? "정면"
                : sec.section
            }: ${sec.summary}`,
            margin: [0, 2],
          }))
        : [{ text: "- 분석 결과 없음", margin: [0, 2] }]),

      // =========== ② 그래프 ===========
      ...(overviewImg
        ? [
            { text: "② Before–After 비교 그래프", fontSize: 14, bold: true, margin: [0, 16, 0, 6] },
            { image: overviewImg, width: 500, margin: [0, 0, 0, 10] },
          ]
        : []),

      ...(sideImg
        ? [
            { text: "③ 측면(사이드) 지표 그래프", fontSize: 14, bold: true, margin: [0, 16, 0, 6] },
            { image: sideImg, width: 500, margin: [0, 0, 0, 10] },
          ]
        : []),

      ...(frontImg
        ? [
            { text: "④ 정면(프론트) 지표 그래프", fontSize: 14, bold: true, margin: [0, 16, 0, 6] },
            { image: frontImg, width: 500, margin: [0, 0, 0, 10] },
          ]
        : []),

      // =========== ⑤ 지표별 상세 ===========
      { text: "⑤ 지표별 상세 해석", fontSize: 14, bold: true, margin: [0, 20, 0, 10], pageBreak: "before" },
      ...(analysis.results?.length
        ? analysis.results.flatMap(r => {
            const secTag =
              r.section === "side" ? "[측면]" : r.section === "front" ? "[정면]" : "[기타]";
            return [
              {
                text: `${secTag} ${r.name} (${r.metric}) → ${r.value}${r.unit} | 정상:${r.normalText} | 상태:${r.status}`,
                bold: true,
                margin: [0, 8, 0, 2],
              },
              r.pattern ? { text: `• 패턴: ${r.pattern}`, margin: [5, 2] } : null,
              r.tight?.length ? { text: `• 긴장근: ${r.tight.join(", ")}`, margin: [5, 2] } : null,
              r.weak?.length ? { text: `• 약화근: ${r.weak.join(", ")}`, margin: [5, 2] } : null,
              r.exerciseGuide ? { text: `• 가이드: ${r.exerciseGuide}`, margin: [5, 2] } : null,
              { text: "• 필라테스 추천:", bold: true, margin: [5, 6, 0, 2] },
              ...formatPilatesList(r.pilates),
            ].filter(Boolean);
          })
        : [{ text: "지표별 상세 분석 없음", margin: [0, 6] }]),

      // =========== ⑥ 종합 요약 ===========
      { text: "⑥ 종합 근육/운동 요약", fontSize: 14, bold: true, margin: [0, 20, 0, 10], pageBreak: "before" },
      { text: `긴장근(통합): ${analysis.tightAll?.join(", ") || "-"}`, margin: [0, 2] },
      { text: `약화근(통합): ${analysis.weakAll?.join(", ") || "-"}`, margin: [0, 6] },
      { text: "필라테스(통합):", bold: true, margin: [0, 10, 0, 4] },
      ...formatPilatesList(analysis.pilatesAll),
    ],
  };

  // ====== PDF 다운로드 ======
  const fileName = `${memberName || "member"}_${sessionName || "session"}_AI_Posture_Report.pdf`;

  pdfMake.createPdf(doc).download(fileName);
}
