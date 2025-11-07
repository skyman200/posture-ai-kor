/* ===========================================================
   AI Posture Pipeline Pro - DB 통합 버전 (v5)
   author: kanghoon / ChatGPT optimized
   -----------------------------------------------------------
   전체 구조:
   1️⃣ fullMetrics 생성
   2️⃣ DB 기반 posture key 자동 탐지
   3️⃣ Muscle DB 연동 (tight/weak/stretch/strengthen)
   4️⃣ Pilates Exercise DB 연동
   5️⃣ 리포트 생성 및 반환
   =========================================================== */

// ---------------------------
// 🔹 주요 DB 로드
// ---------------------------
async function loadJSON(paths) {
  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ DB Loaded: ${path} (${data.length})`);
        return data;
      }
    } catch (err) {
      console.warn(`⚠️ DB Load 실패 (${path}):`, err);
    }
  }
  throw new Error("❌ DB 파일을 찾을 수 없습니다.");
}

export async function loadMuscleDB() {
  return await loadJSON([
    "./db/Posture_Muscle_DB_Full_v3.json",
    "/db/Posture_Muscle_DB_Full_v3.json",
  ]);
}

export async function loadPilatesDB() {
  return await loadJSON([
    "./db/Pilates_Exercise_DB_1000_v2.json",
    "/db/Pilates_Exercise_DB_1000_v2.json",
  ]);
}

// ===========================================================
// 1️⃣ fullMetrics 생성 (AI 측정값 통합)
// ===========================================================
export function buildFullMetrics(values = {}) {
  const fm = {
    CVA: values.CVA ?? 60.8,
    HPD: values.HPD ?? 1.0,
    TIA: values.TIA ?? 6.2,
    SAA: values.SAA ?? 13.3,
    PTA: values.PTA ?? 9.8,
    KA: values.KA ?? 172.4,
    Tibial: values.Tibial ?? 0.9,
    QAngle: values.QAngle ?? null,
    KneeDev: values.KneeDev ?? null,
    LLD: values.LLD ?? null,
    GSB: values.GSB ?? 0.2,
    HPA: values.HPA ?? 13.2,
    PDS: values.PDS ?? 5.0,
    STA: values.STA ?? null,
    POA: values.POA ?? null,
    TD: values.TD ?? null,
    HTA: values.HTA ?? null,
    SPP: values.SPP ?? null,
    KAS: values.KAS ?? null,
    LLAS: values.LLAS ?? null,
    FBA: values.FBA ?? null,
  };
  console.log("✅ fullMetrics 생성 완료:", fm);
  return fm;
}

// ===========================================================
// 2️⃣ DB 기반 posture key 매핑
// ===========================================================
export async function mapMetricsToPostureKeys(fullMetrics) {
  const muscleDB = await loadMuscleDB();
  const hits = [];

  for (const posture of muscleDB) {
    const metrics = posture.ai_detection_metrics || {};
    for (const [metricKey, condition] of Object.entries(metrics)) {
      const value = fullMetrics[metricKey];
      if (value == null) continue;

      const cond = condition.toString().trim();
      const num = parseFloat(cond.replace(/[^\d.-]/g, ""));

      let match = false;
      if (cond.includes(">")) match = value > num;
      else if (cond.includes("<")) match = value < num;
      else if (cond.toLowerCase().includes("excess")) match = true;

      if (match) {
        hits.push({
          metric: metricKey,
          posture_key: posture.key,
          posture_ko: posture.posture_ko,
          region: posture.region,
          reason: `${metricKey}=${value} (${condition})`,
        });
      }
    }
  }

  console.log("🧩 posture key 매핑 결과:", hits);
  return hits;
}

// ===========================================================
// 3️⃣ Muscle DB 기반 분석
// ===========================================================
export async function matchMuscleByPatterns(postureHits) {
  const muscleDB = await loadMuscleDB();
  const results = [];

  for (const hit of postureHits) {
    const posture = muscleDB.find((p) => p.key === hit.posture_key);
    if (!posture) continue;

    results.push({
      ...hit,
      tight: [
        ...(posture.muscle_pattern?.tight?.primary || []),
        ...(posture.muscle_pattern?.tight?.secondary || []),
      ],
      weak: [
        ...(posture.muscle_pattern?.weak?.primary || []),
        ...(posture.muscle_pattern?.weak?.secondary || []),
      ],
      stretch: posture.recommended_focus?.stretch || [],
      strengthen: posture.recommended_focus?.strengthen || [],
      mobility: posture.recommended_focus?.mobility || [],
    });
  }

  console.log("💪 근육 매칭 완료:", results);
  return results;
}

// ===========================================================
// 4️⃣ Pilates DB 기반 운동 매칭
// ===========================================================
export async function matchPilatesByPatterns(postureResults) {
  const pilatesDB = await loadPilatesDB();
  const exercises = [];

  for (const p of postureResults) {
    const related = pilatesDB.filter((e) =>
      e.posture_key.toLowerCase().includes(p.posture_key.toLowerCase())
    );

    if (related.length > 0) {
      exercises.push({
        posture: p.posture_ko,
        equipment: related[0].equipment_ko,
        exercise: related[0].exercise_ko,
        purpose: related[0].purpose,
        key_cues: related[0].key_cues,
        sets_reps: related[0].sets_reps,
      });
    }
  }

  console.log("🏋️‍♀️ 필라테스 운동 매칭 완료:", exercises);
  return exercises;
}

// ===========================================================
// 5️⃣ 리포트 생성
// ===========================================================
export function generateTextReport(postureResults, exercises) {
  let txt = "📊 [AI 자세 분석 리포트]\n\n";

  postureResults.forEach((p) => {
    txt += `🧩 ${p.posture_ko} (${p.metric}: ${p.reason})\n`;
    txt += `- 과긴장 근육: ${p.tight.join(", ")}\n`;
    txt += `- 약화 근육: ${p.weak.join(", ")}\n`;
    txt += `- 스트레칭: ${p.stretch.join(", ")}\n`;
    txt += `- 강화운동: ${p.strengthen.join(", ")}\n`;
    txt += `- 가동성: ${p.mobility.join(", ")}\n\n`;
  });

  if (exercises.length > 0) {
    txt += "💪 [추천 필라테스 운동]\n";
    exercises.forEach((e) => {
      txt += `- ${e.posture} | ${e.equipment} | ${e.exercise}\n`;
      txt += `  ▶ 목적: ${e.purpose}\n`;
      txt += `  🎯 큐잉: ${e.key_cues}\n`;
      txt += `  🔁 세트: ${e.sets_reps}\n\n`;
    });
  }

  console.log("🧾 리포트 생성 완료");
  return txt;
}

// ===========================================================
// 6️⃣ 전체 파이프라인 실행
// ===========================================================
export async function runPipeline(values) {
  const fullMetrics = buildFullMetrics(values);
  const hits = await mapMetricsToPostureKeys(fullMetrics);
  const muscle = await matchMuscleByPatterns(hits);
  const exercise = await matchPilatesByPatterns(muscle);
  const report = generateTextReport(muscle, exercise);
  return report;
}
