// === js/main_pro_compatible.js (2025-11-07) ===
import { analyzePosture } from "../assets/analyzePosture.js";      // 기존
import { analyzePostureType } from "./analyzePostureType.js";      // 기존
import { loadPostureDB, analyzeWithDB } from "../src/ai/analyzerWithDB.js"; // 방금 교체한 파일

// 전역 안전 가드
window.fullMetrics = window.fullMetrics || {};
window.currentPostureMetrics = window.currentPostureMetrics || {};

function registerFullMetrics(m) {
  window.fullMetrics = m || {};
  window.currentPostureMetrics = window.fullMetrics;
  document.dispatchEvent(new CustomEvent("fullMetrics:ready", { detail: window.fullMetrics }));
}

window.addEventListener("DOMContentLoaded", async () => {
  console.log("=== DOMContentLoaded ===");
  try {
    // 1) DB 먼저 로드 (분석기에서 필요)
    await loadPostureDB();

    // 2) 포즈 감지 → fullMetrics 산출
    const fm = await analyzePosture("side_view_image"); // 기존 함수
    registerFullMetrics(fm);
    console.log(`[AI-Posture] PTA=${(fm?.PTA ?? 0).toFixed(2)}° → 자동 분석 완료`);

    // 3) DB 기반 근육/패턴 분석 (선택)
    try {
      const { matches } = await analyzeWithDB(fm);
      console.log(`🧠 DB 기반 매칭 ${matches?.length ?? 0}건`);
    } catch (e) {
      console.warn("DB 기반 분석 스킵:", e?.message);
    }

    // 4) 유형 분석 (기존 로직)
    analyzePostureType(window.fullMetrics);

  } catch (err) {
    console.error("AI 자동 분석 실패:", err);
    // 최소한의 안전값 등록 (아래 로직들이 window.fullMetrics 가정함)
    registerFullMetrics({});
  }
});
