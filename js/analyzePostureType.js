// js/analyzePostureType.js

export function analyzePostureType(fullMetrics) {
  if (!fullMetrics || typeof fullMetrics !== "object") {
    console.warn("⚠️ fullMetrics 없음 - 체형 유형 분석 생략");
    return;
  }

  const { PTA, CVA, SAA, HPD } = fullMetrics;

  console.log("📊 자세 분석 시작...");

  if (PTA > 15) console.log("➡️ 골반 전방경사 (햄스트링 단축 가능)");
  else if (PTA < 0) console.log("➡️ 후방경사 (둔근 약화 가능)");
  else console.log("✅ 골반 정렬 정상");

  if (CVA < 50) console.log("➡️ 거북목 자세");

  if (SAA > 10) console.log("➡️ 어깨 전방 말림 (라운드숄더)");

  if (HPD > 2) console.log("➡️ 두부 전방 이동 증가");

  console.log("🧩 분석 완료");
}

