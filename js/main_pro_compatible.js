// main_pro_compatible.js

// 기존 main.js + ai_posture_pipeline_pro.js 통합형

import { analyzePosture } from "../assets/analyzePosture.js";
import { analyzePostureType } from "./analyzePostureType.js";
import { loadPostureDB } from "./loadPostureDB.js";
import { runPipeline, buildFullMetrics } from "./ai_posture_pipeline_pro.js";

// ✅ 전역 변수
window.fullMetrics = {};
window.currentPostureMetrics = {};

// ✅ DOM 로드 시 실행
window.addEventListener("DOMContentLoaded", async () => {
  console.log("=== 🚀 AI 자세 분석 초기화 시작 ===");

  try {
    // 1️⃣ DB 로드 (기존)
    await loadPostureDB();
    console.log("✅ DB 로드 완료 (CSV)");

    // 2️⃣ 기본 AI 분석 (Pose Detection)
    const fullMetrics = await analyzePosture("side_view_image");
    window.fullMetrics = fullMetrics;
    window.currentPostureMetrics = fullMetrics;
    console.log(`[AI-Posture] PTA=${fullMetrics.PTA.toFixed(2)}° → 자동 분석 완료`);

    // 3️⃣ 기존 체형유형 분석 (단순 패턴)
    analyzePostureType(fullMetrics);

    // 4️⃣ PRO 파이프라인 실행 (DB + 운동 매칭)
    console.log("🧠 [AI Pro] 고급 파이프라인 실행 중...");
    const mergedMetrics = buildFullMetrics(fullMetrics);
    const report = await runPipeline(mergedMetrics);

    // 5️⃣ 콘솔 및 HTML 출력
    console.log("📊 [AI PRO 자세 리포트]");
    console.log(report);

    const reportBox = document.getElementById("report-box");
    if (reportBox) {
      reportBox.innerText = report;
      reportBox.style.whiteSpace = "pre-wrap";
    }

    console.log("✅ 모든 AI 분석 완료!");
  } catch (err) {
    console.error("❌ AI 분석 전체 실패:", err);
  }
});

