// aiPosturePipeline_Pro.js
// ✅ 완전 통합 버전: AI 측정값 → fullMetrics → 체형패턴 → 근육DB → Pilates DB → 리포트

/***********************
 * 0) 유틸
 ***********************/
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const fmt = (v, unit = "") => (v == null ? "—" : `${v}${unit}`);

/***********************
 * 1) fullMetrics 구성 (21항목)
 ***********************/
export function buildFullMetrics(values = {}) {
  return {
    CVA: values.CVA ?? 60.8,
    HPD: values.HPD ?? 1.0,
    HTA: values.HTA ?? 2.0,
    TIA: values.TIA ?? 6.2,
    TD: values.TD ?? 0.8,
    SAA: values.SAA ?? 13.3,
    STA: values.STA ?? 1.5,
    SPP: values.SPP ?? 1.0,
    PTA: values.PTA ?? 9.8,
    POA: values.POA ?? 1.0,
    HPA: values.HPA ?? 13.2,
    KA: values.KA ?? 172.4,
    KAS: values.KAS ?? 1.5,
    Tibial: values.Tibial ?? 0.9,
    QAngle: values.QAngle ?? 15.0,
    KneeDev: values.KneeDev ?? 1.0,
    LLAS: values.LLAS ?? 1.0,
    LLD: values.LLD ?? 0.4,
    FBA: values.FBA ?? 0.0,
    GSB: values.GSB ?? 0.2,
    PDS: values.PDS ?? 5.0,
  };
}

/***********************
 * 2) 점수 계산
 ***********************/
export function scoreMetrics(m) {
  let total = 100;
  const details = [];

  const penalize = (name, val, range, w, unit = "°") => {
    if (val == null) return;
    const [min, max] = range;
    let diff = 0;
    if (val < min) diff = min - val;
    if (val > max) diff = val - max;
    if (diff > 0) {
      const p = clamp(w * diff, 0, 20);
      total -= p;
      details.push(`${name}: ${fmt(val, unit)} (정상 ${min}-${max}${unit}) → -${p.toFixed(1)}점`);
    }
  };

  penalize("CVA", m.CVA, [50, 80], 1);
  penalize("HPD", m.HPD, [0, 2], 3, "cm");
  penalize("TIA", m.TIA, [0, 10], 2);
  penalize("SAA", m.SAA, [0, 10], 3);
  penalize("PTA", m.PTA, [0, 15], 4);
  penalize("KA", m.KA, [175, 185], 2);
  penalize("Tibial", m.Tibial, [0, 10], 1);
  penalize("HPA", m.HPA, [0, 10], 3);
  penalize("FBA", m.FBA, [-3, 3], 1);

  return { total: clamp(total, 0, 100), details };
}

/***********************
 * 3) 체형패턴 매핑
 ***********************/
export function mapMetricsToPostureKeys(m) {
  const hits = [];
  if (m.PTA > 15) hits.push({ metric: "PTA", posture_key: "Anterior Pelvic Tilt", reason: `PTA ${m.PTA.toFixed(1)}° > 15°` });
  if (m.PTA < 0) hits.push({ metric: "PTA", posture_key: "Posterior Pelvic Tilt", reason: `PTA ${m.PTA.toFixed(1)}° < 0°` });
  if (m.CVA < 50) hits.push({ metric: "CVA", posture_key: "Forward Head Posture", reason: `CVA ${m.CVA.toFixed(1)}° < 50°` });
  if (m.SAA > 10) hits.push({ metric: "SAA", posture_key: "Hyperkyphosis", reason: `SAA ${m.SAA.toFixed(1)}° > 10°` });
  if (m.KA < 175) hits.push({ metric: "KA", posture_key: "Genu Valgum", reason: `KA ${m.KA.toFixed(1)}° < 175°` });
  if (m.KA > 185) hits.push({ metric: "KA", posture_key: "Genu Varum", reason: `KA ${m.KA.toFixed(1)}° > 185°` });
  if (Math.abs(m.POA) > 3) hits.push({ metric: "POA", posture_key: "Pelvic Obliquity", reason: `POA |${m.POA.toFixed(1)}°| > 3°` });
  if (m.FBA > 3) hits.push({ metric: "FBA", posture_key: "Foot Supination", reason: `FBA ${m.FBA.toFixed(1)}° > 3°` });
  if (m.FBA < -3) hits.push({ metric: "FBA", posture_key: "Foot Pronation", reason: `FBA ${m.FBA.toFixed(1)}° < -3°` });
  return hits;
}

/***********************
 * 4) DB 로더
 ***********************/
export async function loadPilatesDB() {
  const urls = ["./db/Pilates_Exercise_DB_1000_v2.json", "/db/Pilates_Exercise_DB_1000_v2.json"];
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (r.ok) return await r.json();
    } catch (_) {}
  }
  throw new Error("Pilates DB 로드 실패");
}

export async function loadMuscleDB() {
  const urls = ["./db/Posture_Muscle_DB_Full_v3.json", "/db/Posture_Muscle_DB_Full_v3.json"];
  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (r.ok) return await r.json();
    } catch (_) {}
  }
  throw new Error("Muscle DB 로드 실패");
}

/***********************
 * 5) DB 매칭
 ***********************/
export function matchPilatesByPatterns(patterns, pilatesDB) {
  const uniqKeys = [...new Set(patterns.map(h => h.posture_key))];
  return uniqKeys.map(k => ({
    posture_key: k,
    items: pilatesDB.filter(x => x.posture_key === k)
  })).filter(g => g.items.length > 0);
}

export function matchMuscleByPatterns(patterns, muscleDB) {
  const uniqKeys = [...new Set(patterns.map(h => h.posture_key))];
  return uniqKeys.map(k => ({
    posture_key: k,
    muscles: muscleDB.filter(x => x.posture_key === k)
  })).filter(g => g.muscles.length > 0);
}

/***********************
 * 6) 리포트 생성
 ***********************/
export function generateTextReport(full, score, patterns, pilatesRec, muscleRec) {
  const lines = [];
  lines.push("\n📈 체형 점수: " + score.total.toFixed(1) + "점");
  lines.push("\n📋 감점 근거:");
  score.details.forEach(d => lines.push(`• ${d}`));

  lines.push("\n🧭 체형 패턴:");
  patterns.forEach(p => lines.push(`• ${p.posture_key} ← ${p.reason}`));

  lines.push("\n💪 근육 분석:");
  muscleRec.forEach(g => {
    lines.push(`📍 ${g.posture_key}`);
    g.muscles.forEach(m => lines.push(`   • 단축근: ${m.shortened_muscles}\n   • 약화근: ${m.weakened_muscles}\n   • 해석: ${m.comment}`));
  });

  lines.push("\n🏋️‍♀️ 필라테스 교정운동:");
  pilatesRec.forEach(g => {
    lines.push(`📍 ${g.posture_key}`);
    g.items.slice(0, 2).forEach(ex => lines.push(`   - [${ex.equipment_ko}] ${ex.exercise_ko} → ${ex.purpose}`));
  });

  return lines.join("\n");
}

/***********************
 * 7) HTML 렌더러
 ***********************/
export function renderHTMLReport(container, text) {
  if (!container) return;
  container.textContent = "";
  const pre = document.createElement("pre");
  pre.style.whiteSpace = "pre-wrap";
  pre.style.font = "14px/1.5 ui-sans-serif";
  pre.textContent = text;
  container.appendChild(pre);
}

/***********************
 * 8) 통합 실행
 ***********************/
export async function runPipeline(values = {}, options = {}) {
  const full = buildFullMetrics(values);
  const score = scoreMetrics(full);
  const patterns = mapMetricsToPostureKeys(full);
  const [pilatesDB, muscleDB] = await Promise.all([loadPilatesDB(), loadMuscleDB()]);
  const pilatesRec = matchPilatesByPatterns(patterns, pilatesDB);
  const muscleRec = matchMuscleByPatterns(patterns, muscleDB);
  const text = generateTextReport(full, score, patterns, pilatesRec, muscleRec);
  if (options.container) renderHTMLReport(options.container, text);
  return { full, score, patterns, pilatesRec, muscleRec, text };
}
