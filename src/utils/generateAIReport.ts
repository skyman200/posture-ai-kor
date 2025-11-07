// ✅ AI 자세 리포트 생성기 (두 버전 지원: ① PDF 단독 ② PDF + 그래프/오버레이)

// - DB: /public/db/Posture_Muscle_DB_Full_v3.json, /public/db/Pilates_Exercise_DB_1000_v2.json

// - 차트: Chart.js (선택)  npm i chart.js

// - PDF: jsPDF                 npm i jspdf

// - 캡처: html2canvas (선택)    npm i html2canvas

import { jsPDF } from "jspdf";

// 타입(느슨하게)

type Results = Record<string, number | string | null | undefined>;

type MuscleItem = {

  key?: string;

  posture_en?: string;

  posture_ko?: string;

  causes?: string[];

  symptoms?: string[];

  clinical_significance?: string[];

  muscle_pattern?: {

    tight?: { primary?: string[]; secondary?: string[]; description?: string };

    weak?: { primary?: string[]; secondary?: string[]; description?: string };

  };

  ai_detection_metrics?: Record<string, string | number>;

};

type ExerciseItem = {

  posture_key?: string;

  equipment_ko?: string;

  name_ko?: string;

  purpose?: string;

  how_to_do?: string;

  contra?: string;

};

// ---------- 공통 유틸 ----------

function parseThreshold(rule: string, value: number): boolean {

  // rule 예: "> 10", ">= +5", "<= 2", "< -3"

  const m = rule.trim().match(/(>=|<=|>|<|==)\s*([+-]?\d+(\.\d+)?)/);

  if (!m) return true; // 파싱 실패 시 통과(엄격하게 하려면 false)

  const op = m[1];

  const num = parseFloat(m[2]);

  switch (op) {

    case ">": return value > num;

    case "<": return value < num;

    case ">=": return value >= num;

    case "<=": return value <= num;

    case "==": return value === num;

    default: return true;

  }

}

function normalizeNum(v: any): number | null {

  if (v === null || v === undefined) return null;

  const n = typeof v === "string" ? parseFloat(v.replace(/[^\d.\-]/g, "")) : Number(v);

  return Number.isFinite(n) ? n : null;

}

// ---------- DB 로드 ----------

async function loadDB() {

  const [muscleDB, pilatesDB] = await Promise.all([

    fetch("/db/Posture_Muscle_DB_Full_v3.json").then(r => r.json()),

    fetch("/db/Pilates_Exercise_DB_1000_v2.json").then(r => r.json()),

  ]);

  return { muscleDB: muscleDB as MuscleItem[], pilatesDB: pilatesDB as ExerciseItem[] };

}

// ---------- 패턴 활성화 판단 ----------

function isActivePattern(item: MuscleItem, results: Results) {

  const metrics = item.ai_detection_metrics || {};

  // metrics의 각 키(CVA, PTA, SAA…)를 results 값과 비교

  for (const [k, cond] of Object.entries(metrics)) {

    const key = k.toUpperCase(); // 결과키 대문자 관례

    const v = normalizeNum(results[key]);

    if (v === null) continue; // 값 없으면 판단 스킵

    if (typeof cond === "string") {

      if (!parseThreshold(cond, v)) return false;

    } else if (typeof cond === "number") {

      // 숫자면 ">= cond"로 가정

      if (!(v >= cond)) return false;

    }

  }

  return true;

}

// ---------- 운동 조인 ----------

function joinExercises(activePatterns: MuscleItem[], pilatesDB: ExerciseItem[]) {

  // 연결 기준: posture_en(또는 key) === exercise.posture_key

  const keys = new Set(

    activePatterns.map(p => (p.posture_en || p.key || "").trim()).filter(Boolean)

  );

  return pilatesDB.filter(ex => ex.posture_key && keys.has(ex.posture_key.trim()));

}

// ---------- ① PDF 단독 ----------

export async function generateAIReportPDF_only(

  results: Results, memberName: string, centerName: string

) {

  const { muscleDB, pilatesDB } = await loadDB();

  const active = muscleDB.filter(p => isActivePattern(p, results));

  const recs  = joinExercises(active, pilatesDB);

  const pdf = new jsPDF({ unit: "mm", format: "a4" });

  pdf.setFont("Helvetica", "normal");

  // 헤더

  pdf.setFontSize(14);

  pdf.text(`📋 ${centerName} AI 자세 분석 리포트`, 16, 18);

  pdf.setFontSize(10);

  pdf.text(`👤 회원: ${memberName}`, 16, 25);

  pdf.text(`📅 날짜: ${new Date().toLocaleDateString()}`, 16, 30);

  // 측정값 테이블(간단)

  pdf.setFontSize(11);

  pdf.text("📊 측정 요약", 16, 40);

  pdf.setFontSize(9);

  let y = 46;

  Object.entries(results).forEach(([k, v]) => {

    const line = `${k}: ${v ?? "-"}`;

    pdf.text(line, 16, y);

    y += 5;

    if (y > 270) { pdf.addPage(); y = 16; }

  });

  // 주요 패턴

  y += 3;

  if (y > 260) { pdf.addPage(); y = 16; }

  pdf.setFontSize(11);

  pdf.text("🔎 주요 문제 패턴 & 임상 해석", 16, y);

  y += 6;

  pdf.setFontSize(9);

  active.forEach(p => {

    const body = [

      `• ${p.posture_ko || p.posture_en} (${p.posture_en || "-"})`,

      p.causes?.length ? `  - 원인: ${p.causes.join(", ")}` : "",

      p.symptoms?.length ? `  - 증상: ${p.symptoms.join(", ")}` : "",

      p.muscle_pattern?.tight?.primary?.length

        ? `  - 긴장: ${p.muscle_pattern.tight.primary.join(", ")}`

        : "",

      p.muscle_pattern?.weak?.primary?.length

        ? `  - 약화: ${p.muscle_pattern.weak.primary.join(", ")}`

        : "",

      p.clinical_significance?.length ? `  - 임상적 의미: ${p.clinical_significance.join(", ")}` : "",

    ].filter(Boolean).join("\n");

    const lines = pdf.splitTextToSize(body, 178);

    pdf.text(lines, 16, y);

    y += lines.length * 4.5 + 3;

    if (y > 270) { pdf.addPage(); y = 16; }

  });

  // 추천 운동

  y += 2;

  if (y > 260) { pdf.addPage(); y = 16; }

  pdf.setFontSize(11);

  pdf.text("🧘 맞춤 필라테스 운동", 16, y);

  y += 6;

  pdf.setFontSize(9);

  const beforeColor = [0, 92, 230];  // 파랑

  const afterColor  = [230, 0, 92];  // 마젠타

  pdf.setTextColor(beforeColor[0], beforeColor[1], beforeColor[2]);

  recs.slice(0, 30).forEach(ex => {

    // 색상은 고정 텍스트만: 실제 그래프는 ②에서 처리

    const s = [

      `• ${ex.name_ko || "-"} (${ex.equipment_ko || "-"})`,

      ex.purpose ? `  - 목적: ${ex.purpose}` : "",

      ex.how_to_do ? `  - 수행법: ${ex.how_to_do}` : "",

      ex.contra ? `  - 주의사항: ${ex.contra}` : "",

    ].filter(Boolean).join("\n");

    const lines = pdf.splitTextToSize(s, 178);

    pdf.text(lines, 16, y);

    y += lines.length * 4.5 + 3;

    if (y > 270) { pdf.addPage(); y = 16; }

  });

  // 색상 복원

  pdf.setTextColor(0,0,0);

  pdf.save(`${memberName}_AI_Posture_Report.pdf`);

}

// ---------- ② PDF + 그래프/오버레이 ----------

// 옵션: Chart.js / html2canvas 사용

export async function generateAIReportPDF_withGraphs(

  resultsBefore: Results | null,

  resultsAfter: Results | null,

  memberName: string,

  centerName: string,

  opts?: {

    frontOverlaySelector?: string; // 정면 오버레이 캔버스/엘리먼트 선택자

    sideOverlaySelector?: string;  // 측면 오버레이 캔버스/엘리먼트 선택자

    metricsForChart?: string[];    // 그래프에 넣을 지표 목록

  }

) {

  const { muscleDB, pilatesDB } = await loadDB();

  const active = resultsAfter

    ? muscleDB.filter(p => isActivePattern(p, resultsAfter))

    : [];

  const recs  = joinExercises(active, pilatesDB);

  // 기본 차트 지표

  const metrics = opts?.metricsForChart ?? [

    "CVA","HPD","TIA","SAA","PTA","KA","Tibial","GSB","HPA","PDS"

  ];

  // 차트 이미지 만들기 (오프스크린 캔버스)

  const chartImages: string[] = [];

  if (typeof window !== "undefined") {

    const { Chart } = await import("chart.js/auto");

    for (const group of chunk(metrics, 6)) {

      const canvas = document.createElement("canvas");

      canvas.width = 900;

      canvas.height = 480;

      const ctx = canvas.getContext("2d")!;

      // Before/After 데이터

      const beforeData = group.map(k => normalizeNum(resultsBefore?.[k]) ?? null);

      const afterData  = group.map(k => normalizeNum(resultsAfter?.[k]) ?? null);

      // 서로 다른 색

      const beforeColor = "rgba(0, 92, 230, 0.9)";

      const afterColor  = "rgba(230, 0, 92, 0.9)";

      new Chart(ctx, {

        type: "bar",

        data: {

          labels: group,

          datasets: [

            {

              label: "Before",

              data: beforeData,

              // 색상 확연히 다르게

              backgroundColor: beforeColor,

              borderColor: beforeColor,

            },

            {

              label: "After",

              data: afterData,

              backgroundColor: afterColor,

              borderColor: afterColor,

            },

          ],

        },

        options: {

          responsive: false,

          plugins: {

            legend: { display: true, position: "top" },

            title: { display: true, text: "Before vs After (Key Metrics)" },

          },

          scales: {

            x: { ticks: { autoSkip: false } },

            y: { beginAtZero: true },

          },

        },

      });

      // 렌더 안정화 약간 대기

      await new Promise(r => setTimeout(r, 50));

      chartImages.push(canvas.toDataURL("image/png", 0.95));

    }

  }

  // 오버레이 이미지(html2canvas)

  const overlayImages: string[] = [];

  if (typeof window !== "undefined") {

    const { default: html2canvas } = await import("html2canvas");

    for (const sel of [opts?.sideOverlaySelector, opts?.frontOverlaySelector]) {

      if (!sel) continue;

      const el = document.querySelector(sel);

      if (el) {

        const canvas = await html2canvas(el as HTMLElement, { scale: 2, backgroundColor: "#fff" });

        overlayImages.push(canvas.toDataURL("image/png", 0.95));

      }

    }

  }

  // PDF 생성

  const pdf = new jsPDF({ unit: "mm", format: "a4" });

  pdf.setFont("Helvetica", "normal");

  // 1p: 헤더 + 측정표 + 패턴 요약

  pdf.setFontSize(14);

  pdf.text(`📋 ${centerName} AI 자세 분석 리포트`, 16, 18);

  pdf.setFontSize(10);

  pdf.text(`👤 회원: ${memberName}`, 16, 25);

  pdf.text(`📅 날짜: ${new Date().toLocaleDateString()}`, 16, 30);

  // 측정요약(Before/After)

  pdf.setFontSize(11);

  pdf.text("📊 측정 요약", 16, 40);

  pdf.setFontSize(9);

  let y = 46;

  const allKeys = Array.from(new Set([

    ...Object.keys(resultsBefore ?? {}),

    ...Object.keys(resultsAfter  ?? {})

  ])).filter(k => !["member","center"].includes(k));

  for (const k of allKeys) {

    const b = resultsBefore ? (resultsBefore[k] ?? "-") : "-";

    const a = resultsAfter ? (resultsAfter[k] ?? "-") : "-";

    pdf.text(`${k}:  Before ${b}   →   After ${a}`, 16, y);

    y += 5;

    if (y > 270) { pdf.addPage(); y = 16; }

  }

  // 2p: 그래프

  if (chartImages.length) pdf.addPage();

  let x = 10; y = 16;

  chartImages.forEach((img, idx) => {

    pdf.addImage(img, "PNG", x, y, 190, 100);

    y += 104;

    if (y > 260 && idx < chartImages.length - 1) { pdf.addPage(); x = 10; y = 16; }

  });

  // 3p: 오버레이 이미지(측면/정면)

  if (overlayImages.length) pdf.addPage();

  x = 10; y = 16;

  overlayImages.forEach((img, idx) => {

    pdf.addImage(img, "PNG", x, y, 190, 120);

    y += 124;

    if (y > 260 && idx < overlayImages.length - 1) { pdf.addPage(); x = 10; y = 16; }

  });

  // 4p~: 활성 패턴 + 필라테스

  pdf.addPage();

  pdf.setFontSize(11);

  pdf.text("🔎 주요 문제 패턴 & 임상 해석", 16, 18);

  pdf.setFontSize(9);

  y = 26;

  active.forEach(p => {

    const body = [

      `• ${p.posture_ko || p.posture_en} (${p.posture_en || "-"})`,

      p.causes?.length ? `  - 원인: ${p.causes.join(", ")}` : "",

      p.symptoms?.length ? `  - 증상: ${p.symptoms.join(", ")}` : "",

      p.muscle_pattern?.tight?.primary?.length

        ? `  - 긴장: ${p.muscle_pattern.tight.primary.join(", ")}`

        : "",

      p.muscle_pattern?.weak?.primary?.length

        ? `  - 약화: ${p.muscle_pattern.weak.primary.join(", ")}`

        : "",

      p.clinical_significance?.length ? `  - 임상적 의미: ${p.clinical_significance.join(", ")}` : "",

    ].filter(Boolean).join("\n");

    const lines = pdf.splitTextToSize(body, 178);

    pdf.text(lines, 16, y);

    y += lines.length * 4.5 + 3;

    if (y > 270) { pdf.addPage(); y = 16; }

  });

  y += 2;

  if (y > 260) { pdf.addPage(); y = 16; }

  pdf.setFontSize(11);

  pdf.text("🧘 맞춤 필라테스 운동", 16, y);

  y += 6;

  pdf.setFontSize(9);

  // Before/After 서로 다른 색상의 범례

  pdf.setTextColor(0, 92, 230); // Before

  pdf.text("■ Before", 16, y);

  pdf.setTextColor(230, 0, 92); // After

  pdf.text("■ After", 40, y);

  y += 6;

  pdf.setTextColor(0, 0, 0);

  recs.slice(0, 40).forEach(ex => {

    const s = [

      `• ${ex.name_ko || "-"} (${ex.equipment_ko || "-"})`,

      ex.purpose ? `  - 목적: ${ex.purpose}` : "",

      ex.how_to_do ? `  - 수행법: ${ex.how_to_do}` : "",

      ex.contra ? `  - 주의사항: ${ex.contra}` : "",

    ].filter(Boolean).join("\n");

    const lines = pdf.splitTextToSize(s, 178);

    pdf.text(lines, 16, y);

    y += lines.length * 4.5 + 3;

    if (y > 270) { pdf.addPage(); y = 16; }

  });

  pdf.save(`${memberName}_AI_Posture_Report.pdf`);

}

// ---------- 헬퍼 ----------

function chunk<T>(arr: T[], size: number): T[][] {

  const out: T[][] = [];

  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));

  return out;

}

