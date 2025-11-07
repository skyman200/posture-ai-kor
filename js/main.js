// js/main.js

import { analyzePosture } from "../assets/analyzePosture.js";
import { analyzePostureType } from "./analyzePostureType.js";
import { loadPostureDB } from "./loadPostureDB.js";

window.addEventListener("DOMContentLoaded", async () => {
  console.log("=== DOMContentLoaded 이벤트 발생 ===");

  try {
    // ✅ DB 로드
    await loadPostureDB();

    // ✅ AI 자세 분석
    const fullMetrics = await analyzePosture("side_view_image");
    console.log(`[AI-Posture] PTA=${fullMetrics.PTA.toFixed(2)}° → 자동 분석 완료`);

    // ✅ fullMetrics 전달
    analyzePostureType(fullMetrics);
  } catch (err) {
    console.error("AI 자동 분석 실패:", err);
  }
});

