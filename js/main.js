// =============================================================
// main.js (통합 버전) - ai_posture_pipeline_pro.js 연결
// =============================================================

import { runPipeline, buildFullMetrics } from "./ai_posture_pipeline_pro.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("=== 🚀 AI Posture Main.js 초기화 시작 ===");

  // 🔹 AI 분석 버튼 클릭 이벤트
  const analyzeBtn = document.getElementById("analyze-btn");
  if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async () => {
      try {
        console.log("▶️ AI 자세 분석 시작...");

        // ✅ 측정값 (예시 / 실제는 AI 측정 모듈에서 전달)
        const values = window.fullMetrics || {
          CVA: 61.2,
          HPD: 1.1,
          TIA: 7.2,
          SAA: 12.3,
          PTA: 10.4,
          KA: 174.8,
          Tibial: 2.2,
          GSB: 0.8,
          HPA: 14.1,
        };

        // ✅ fullMetrics 생성
        const fullMetrics = buildFullMetrics(values);

        // ✅ 파이프라인 실행
        const report = await runPipeline(fullMetrics);

        // ✅ 콘솔 출력
        console.log("📊 [AI 자세 리포트]");
        console.log(report);

        // ✅ HTML 결과 표시 (선택)
        const reportBox = document.getElementById("report-box");
        if (reportBox) {
          reportBox.innerText = report;
          reportBox.style.whiteSpace = "pre-wrap";
        }

        console.log("✅ 분석 완료!");
      } catch (err) {
        console.error("❌ AI 분석 중 오류:", err);
      }
    });
  }

  console.log("=== ✅ Main.js 초기화 완료 ===");
});
