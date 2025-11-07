// aiPosturePipeline_Pro_fixed.js
// 통합 파이프라인: AI 측정값 → fullMetrics → 근육 DB → Pilates DB → 리포트 생성

// ✅ fullMetrics 생성
export function buildFullMetrics(values = {}) {
  return {
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
}

// ✅ DB 로드 함수
async function loadDB(pathList) {
  for (const path of pathList) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ DB Loaded: ${path} (${data.length} records)`);
        return data;
      }
    } catch (err) {
      console.warn(`⚠️ DB Load Failed: ${path}`, err);
    }
  }
  throw new Error("❌ 모든 경로에서 DB를 불러오지 못했습니다.");
}

export async function runPipeline(fullMetrics, { container } = {}) {
  try {
    // 1️⃣ DB 로드
    const muscleDB = await loadDB([
      "./public/db/Posture_Muscle_DB_Full_v3.json",
      "/public/db/Posture_Muscle_DB_Full_v3.json",
    ]);

    const pilatesDB = await loadDB([
      "./public/db/Pilates_Exercise_DB_1000_v2.json",
      "/public/db/Pilates_Exercise_DB_1000_v2.json",
    ]);

    // 2️⃣ 체형 분석 로직
    const results = analyzeFullPosture(fullMetrics, muscleDB, pilatesDB);

    // 3️⃣ 리포트 렌더링
    if (container) container.innerHTML = formatReport(results);

    return results;
  } catch (err) {
    console.error("AI 분석에 실패했습니다:", err);
    throw err;
  }
}

// ✅ 체형 분석 로직
function analyzeFullPosture(fullMetrics, muscleDB, pilatesDB) {
  const report = [];
  const patterns = [];
  const exercises = [];

  // 주요 항목별 감점 기준
  const normalRanges = {
    CVA: [50, 90],
    HPD: [0, 2],
    TIA: [0, 10],
    SAA: [0, 10],
    PTA: [0, 15],
    KA: [175, 185],
    Tibial: [0, 10],
    GSB: [0, 2],
    HPA: [0, 10],
  };

  for (const [key, value] of Object.entries(fullMetrics)) {
    if (value == null) continue;

    const range = normalRanges[key];
    if (!range) continue;

    let status = "정상";
    if (value < range[0] || value > range[1]) status = "이상";

    // 근육 DB와 매칭
    const matchedMuscles = muscleDB.filter(m => m.metric === key);

    // Pilates DB와 매칭
    const relatedExercises = pilatesDB.filter(p => p.posture_key.includes(key) || p.posture_ko.includes(key));

    report.push({ key, value, status, matchedMuscles, relatedExercises });

    if (status === "이상") patterns.push(`${key} ${value}° (${status})`);
    if (relatedExercises.length) exercises.push(...relatedExercises.slice(0, 2));
  }

  return {
    summary: {
      score: calculatePostureScore(fullMetrics, normalRanges),
      abnormalPatterns: patterns,
    },
    details: report,
    exerciseRecommendations: exercises,
  };
}

// ✅ 점수 계산
function calculatePostureScore(metrics, ranges) {
  let score = 100;
  for (const [key, range] of Object.entries(ranges)) {
    const v = metrics[key];
    if (v == null) continue;
    if (v < range[0] || v > range[1]) score -= 5;
  }
  return Math.max(score, 0);
}

// ✅ 리포트 출력 포맷
function formatReport(result) {
  const { summary, details, exerciseRecommendations } = result;
  let text = `📊 체형 분석 요약\n점수: ${summary.score}\n이상 항목: ${summary.abnormalPatterns.join(", ")}\n\n`;

  text += `📋 세부 분석\n`;
  for (const d of details) {
    text += `- ${d.key}: ${d.value} (${d.status})\n`;
  }

  text += `\n💪 추천 운동\n`;
  for (const e of exerciseRecommendations) {
    text += `- ${e.posture_ko} / ${e.equipment_ko} / ${e.exercise_ko}\n  ▶ 목적: ${e.purpose}\n  ▶ 방법: ${e.how_to_do}\n\n`;
  }

  return text;
}
