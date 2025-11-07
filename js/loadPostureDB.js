// ✅ GitHub 호환형 loadPostureDB.js (2025-11-07 업데이트)
// - GitHub Pages 404 자동 폴백
// - raw.githubusercontent.com 직접 접근
// - ai_detection_metrics → thresholds 자동 변환
// - muscle_pattern 누락 보호
// - 전역 캐시(window.PostureDB) 지원

export async function loadPostureDB() {
  // 이미 로드되어 있으면 캐시 사용
  if (window.PostureDB && Array.isArray(window.PostureDB)) {
    console.log(`✅ DB Loaded (Cache): ${window.PostureDB.length} records`);
    return window.PostureDB;
  }

  // GitHub Pages → raw → 로컬 순서로 시도
  const DB_SOURCES = [
    "https://skyman200.github.io/posture-ai-kor/db/Posture_Muscle_DB_Full.json",
    "https://raw.githubusercontent.com/skyman200/posture-ai-kor/main/public/db/Posture_Muscle_DB_Full.json",
    "/public/db/Posture_Muscle_DB_Full.json",
    "/db/Posture_Muscle_DB_Full.json",
  ];

  let lastError = null;

  for (const url of DB_SOURCES) {
    try {
      console.log(`📡 DB 로드 시도: ${url}`);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const dbData = Array.isArray(json) ? json : json.data || [];
      if (!dbData.length) throw new Error("DB가 비어 있음");

      // 🔧 데이터 정규화
      const normalized = dbData.map((item) => normalizeItem(item));

      // 전역 캐시 저장
      window.PostureDB = normalized;
      console.log(`✅ DB Loaded: ${normalized.length} records`);
      return normalized;
    } catch (err) {
      console.warn(`⚠️ DB 로드 실패 @ ${url}: ${err.message}`);
      lastError = err;
    }
  }

  throw new Error(`❌ DB 로드 실패: ${lastError?.message || "Unknown error"}`);
}

// --------------------------------------------
// 🔧 normalizeItem(): DB 구조 정규화
// --------------------------------------------
function normalizeItem(item) {
  // 🧩 지표 변환 (ai_detection_metrics → thresholds)
  const ai = item.ai_detection_metrics || {};
  const thresholds = {};

  const metricKeys = [
    "CVA", "HPD", "TIA", "SAA", "PTA", "KA",
    "Tibial", "QAngle", "GSB", "HPA", "STA",
    "POA", "TD", "HTA", "SPP"
  ];

  metricKeys.forEach((key) => {
    if (ai[key] !== undefined) thresholds[key] = ai[key];
  });

  // 🧠 muscle_pattern 기본값 보정
  const mp = item.muscle_pattern || {};
  const safeTight = {
    primary: mp?.tight?.primary ?? [],
    secondary: mp?.tight?.secondary ?? [],
    description: mp?.tight?.description ?? "",
  };
  const safeWeak = {
    primary: mp?.weak?.primary ?? [],
    secondary: mp?.weak?.secondary ?? [],
    description: mp?.weak?.description ?? "",
  };

  // 🧩 최종 구조 반환
  return {
    key: item.key || item.posture_key || item.posture_en || "",
    posture_ko: item.posture_ko || "",
    posture_en: item.posture_en || "",
    region: item.region || "",
    biomechanics: item.biomechanics || {},
    functional_line: item.functional_line || "",
    thresholds,
    muscle_pattern: { tight: safeTight, weak: safeWeak },
    causes: item.causes || [],
    symptoms: item.symptoms || [],
    compensation_patterns: item.compensation_patterns || [],
    recommended_focus: item.recommended_focus || { stretch: [], strengthen: [], mobility: [] },
    clinical_significance: item.clinical_significance || [],
  };
}
