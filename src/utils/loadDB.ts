// src/utils/loadDB.ts

export async function loadPostureDB() {
  const base =
    "https://raw.githubusercontent.com/skyman200/posture-ai-kor/main/public/db";
  const urls = {
    muscle: `${base}/Posture_Muscle_DB_Full_v3.json`,
    pilates: `${base}/Pilates_Exercise_DB_1000_v2.json`,
  };

  const fetchJSON = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`❌ DB 로드 실패: ${url}`);
    return res.json();
  };

  const [muscle, pilates] = await Promise.all([
    fetchJSON(urls.muscle),
    fetchJSON(urls.pilates),
  ]);

  console.log("✅ DB 로드 완료:", {
    muscle: muscle.length,
    pilates: pilates.length,
  });

  return { muscle, pilates };
}

