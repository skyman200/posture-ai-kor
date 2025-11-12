// === ai/analyzerWithDB.js : DB 로더 + 정규화 (2025-11-07) ===

export async function loadPostureDB() {
  // 캐시 있으면 바로 리턴
  if (window.PostureDB && Array.isArray(window.PostureDB)) {
    console.log(`✅ DB Loaded (Cache): ${window.PostureDB.length} records`);
    return window.PostureDB;
  }

  // ✅ 단순화된 경로 시도 (우선순위 조정)
  const CANDIDATES = [
    // 1) 상대경로 우선 (로컬 개발)
    './db/Posture_Muscle_DB_Full.json',
    // 2) 절대 경로 (로컬 서버)
    '/db/Posture_Muscle_DB_Full.json',
    // 3) GitHub Pages 경로
    '/posture-ai-kor/db/Posture_Muscle_DB_Full.json',
    // 4) raw.githubusercontent.com (직접)
    'https://raw.githubusercontent.com/skyman200/posture-ai-kor/main/public/db/Posture_Muscle_DB_Full.json',
  ];

  let lastErr = null;
  for (const url of CANDIDATES) {
    try {
      console.log(`📡 DB 로드 시도: ${url}`);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const arr = Array.isArray(json) ? json : (json.data || []);
      if (!arr.length) throw new Error(`DB empty @ ${url}`);

      const normalized = arr.map(normalizeItem);
      window.PostureDB = normalized; // 캐시
      console.log(`✅ DB Loaded: ${normalized.length} records`);
      return normalized;
    } catch (e) {
      console.warn(`⚠️ DB 로드 실패 @ ${url}: ${e.message}`);
      lastErr = e;
    }
  }

  throw new Error(`DB 로드 실패: ${lastErr?.message || "unknown"}`);
}

// --- 내부: 항목 정규화 (지표/근육패턴 누락 방지) ---
function normalizeItem(item) {
  // ai_detection_metrics → thresholds (대문자/소문자 둘 다 매핑)
  const ai = item.ai_detection_metrics || {};
  const thresholds = {};
  const KEYS = [
    "CVA","HPD","TIA","SAA","PTA","KA","Tibial","QAngle","GSB","HPA",
    "STA","POA","TD","HTA","SPP","KneeExt","KneeFlexionROM","TibialRotation",
    "PRA","FAngle"
  ];
  for (const k of KEYS) {
    if (ai[k] !== undefined) thresholds[k] = ai[k];
    // 소문자 키도 허용
    const low = k.toLowerCase();
    if (ai[low] !== undefined) thresholds[k] = ai[low];
  }

  // muscle_pattern 안전 가드
  const mp = item.muscle_pattern || {};
  const tight = {
    primary: mp?.tight?.primary ?? [],
    secondary: mp?.tight?.secondary ?? [],
    description: mp?.tight?.description ?? ""
  };
  const weak = {
    primary: mp?.weak?.primary ?? [],
    secondary: mp?.weak?.secondary ?? [],
    description: mp?.weak?.description ?? ""
  };

  return {
    key: item.key || item.posture_key || item.posture_en || "",
    posture_ko: item.posture_ko || "",
    posture_en: item.posture_en || "",
    region: item.region || "",
    biomechanics: item.biomechanics || {},
    functional_line: item.functional_line || "",
    thresholds,
    muscle_pattern: { tight, weak },
    causes: item.causes || [],
    symptoms: item.symptoms || [],
    compensation_patterns: item.compensation_patterns || [],
    recommended_focus: item.recommended_focus || { stretch: [], strengthen: [], mobility: [] },
    clinical_significance: item.clinical_significance || [],
  };
}

// --- 공개: DB 기반 분석기(예시). 기존 analyzeWithDB에서 이 로더만 호출하도록! ---
export async function analyzeWithDB(fullMetrics) {
  const db = await loadPostureDB();

  // 예시: 각 지표 기준으로 매칭 (실제 로직은 기존 함수 유지 가능)
  const matches = [];
  for (const row of db) {
    const th = row.thresholds || {};
    // 간단 샘플: 지표 문자열 비교 ("> 10°" 이런식) → 여기선 필터만 예시로
    if (th.SAA && typeof fullMetrics?.SAA === "number") {
      // 필요한 필터 로직을 여기에…
    }
    matches.push(row);
  }

  return { matches };
}
