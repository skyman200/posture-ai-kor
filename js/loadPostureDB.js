// js/loadPostureDB.js

export async function loadPostureDB() {
  // ✅ raw.githubusercontent.com 경로 사용 (GitHub Pages 배포 문제 해결)
  const base = "https://raw.githubusercontent.com/skyman200/posture-ai-kor/main/public/db";
  try {
    const res = await fetch(`${base}/Posture_Muscle_DB_Full_v3.json`);
    if (res.ok) {
      const json = await res.json();
      console.log(`✅ DB Loaded (JSON): ${json.length} records`);
      return json;
    }
    throw new Error("JSON 파일 실패, CSV 시도");
  } catch (err) {
    console.warn("⚠️ JSON 실패:", err);
    try {
      const csv = await fetch(`${base}/Posture_Muscle_DB_Full_v3.csv`);
      const text = await csv.text();
      console.log("✅ DB Loaded (CSV):", text.length, "chars");
      return text;
    } catch (csvErr) {
      console.error("❌ DB 로드 실패:", csvErr);
      return null;
    }
  }
}

