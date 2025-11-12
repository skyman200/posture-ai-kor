// src/utils/analyzePosture.ts
// ─────────────────────────────────────────────────────────────
// 완전 동작 버전: DB 로드 + 좌표 검증 + PTA 계산(교수님 기준) + 패턴 매칭 + 추천 + PDF 텍스트

import {
  loadPrescriptionDataset,
  ExerciseEntry,
  PostureMetricEntry,
} from "./prescriptionData";

// ─────────────────────────────────────────────────────────────
// 0) 타입 (any로 둬도 되지만 최소한의 안전망)

export type Pt = { x: number; y: number } | null;

// 측정값 인터페이스
export interface Metrics {
  CVA?: number;
  HPD?: number;
  TIA?: number;
  SAA?: number;
  PTA?: number;
  KA?: number;
  Tibial?: number;
  QAngle?: number;
  KneeDev?: number;
  LLD?: number;
  GSB?: number;
  HPA?: number;
  PDS?: number;
  STA?: number;
  POA?: number;
  TD?: number;
  HTA?: number;
  SPP?: number;
  KAS?: number;
  LLAS?: number;
}

export type PosePoints = {
  asis?: Pt; psis?: Pt; // PTA용
  tragus?: Pt; c7?: Pt; acromion?: Pt; hip?: Pt; knee?: Pt; ankle?: Pt;
  // 필요시 front용 좌표 등 추가
};

export type PostureResults = {
  // 수치가 없으면 null (PDF/화면 쪽에서 안전하게 처리)
  PTA: number | null;
  CVA?: number | null;
  SAA?: number | null;
  TIA?: number | null;
  KA?: number | null;
  HPA?: number | null;
  GSB?: number | null;
  HPD?: number | null;
  // …필요한 지표 계속 추가
};

type MusclePattern = {
  key: string;           // "PTA" 등
  posture_ko: string;    // "골반 전후경사각"
  pattern_name: string;  // "Anterior Pelvic Tilt" 등
  description: string;
  muscles: string[];
};

type PilatesExercise = {
  id: number;
  posture_key: string;             // "PTA" 등
  equipment_en: string;
  equipment_ko: string;
  name_en: string;
  name_ko: string;
  purpose: string;
  how_to_do: string;
  sets_reps: string;
  cues: string[] | string;
  contra: string;
};

export type MetricSummary = {
  key: string;
  value: number | null | undefined;
  status: string;
  deviationKey?: string;
  tightMuscles: string[];
  weakMuscles: string[];
  strategy?: string;
};

export type ExerciseRecommendation = ExerciseEntry & {
  matchedMuscles: string[];
};

type LegacyPatternSummary = {
  posture_ko: string;
  posture_en?: string;
  summary?: string;
  muscle_pattern?: {
    tight?: { primary?: string[] };
    weak?: { primary?: string[] };
  };
};

export type AnalysisWithDBResult = {
  metrics: MetricSummary[];
  stretchRecommendations: ExerciseRecommendation[];
  strengthenRecommendations: ExerciseRecommendation[];
  activePatterns?: LegacyPatternSummary[];
  tightAll?: string[];
  weakAll?: string[];
  pilatesAll?: ExerciseRecommendation[];
};

// ─────────────────────────────────────────────────────────────
// 1) 유틸

function isValidPoint(p?: Pt): p is { x: number; y: number } {
  return !!p && typeof p.x === 'number' && typeof p.y === 'number' && !Number.isNaN(p.x) && !Number.isNaN(p.y);
}

function toDeg(rad: number) { return rad * (180 / Math.PI); }

// 안전 atan2: 두 점의 (dy, dx)에서 각도(deg)
function angleDeg(p1: {x:number;y:number}, p2:{x:number;y:number}) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y; // 캔버스 좌표: y가 아래로 증가
  return toDeg(Math.atan2(dy, dx));
}

// ─────────────────────────────────────────────────────────────
// 2) 교수님 기준 PTA(골반 전후경사각):
//  - ASIS가 PSIS보다 "위쪽"이면 → 후방경사 → 음수(−)
//  - ASIS가 PSIS보다 "아래쪽"이면 → 전방경사 → 양수(+)
//  - 최소 ±1도 보장

export function calcPelvicTilt(asis?: Pt, psis?: Pt): number | null {
  if (!isValidPoint(asis) || !isValidPoint(psis)) return null;

  // ASIS → PSIS 벡터의 각도
  // angleDeg는 atan2(dy, dx)를 사용하므로:
  // - ASIS가 위쪽(asis.y < psis.y) → dy > 0 → 양수
  // - ASIS가 아래쪽(asis.y > psis.y) → dy < 0 → 음수
  // 하지만 교수님 기준:
  // - ASIS가 위쪽 → 후방경사 → 음수여야 함
  // - ASIS가 아래쪽 → 전방경사 → 양수여야 함
  // 따라서 부호를 반전해야 함
  const deg = -angleDeg(asis, psis); // 부호 반전
  
  let pta: number;
  
  if (asis.y < psis.y) {
    // 후방경사: ASIS가 위쪽 → 음수, 최소 -1도
    const absDeg = Math.abs(deg);
    pta = -Math.max(1, absDeg || 1);
  } else if (asis.y > psis.y) {
    // 전방경사: ASIS가 아래쪽 → 양수, 최소 1도
    const absDeg = Math.abs(deg);
    pta = Math.max(1, absDeg || 1);
  } else {
    // 같은 높이: 0도
    pta = 0;
  }

  return Number(pta.toFixed(1));
}

// ─────────────────────────────────────────────────────────────
// 3) (선택) 다른 지표 자리만 마련: 실제 계산식은 기존 함수로 대체/연결

export function calcCVA(tragus?: Pt, c7?: Pt): number | null {
  if (!isValidPoint(tragus) || !isValidPoint(c7)) return null;
  // 수평선 대비 각도: C7→Tragus 벡터와 수평선의 각도
  const deg = angleDeg(c7, tragus);            // 수평 기준
  const cva = 90 - Math.abs(deg);              // 일반적 구현 예시(필요시 프로젝트의 기존 공식을 사용)
  return Number(cva.toFixed(1));
}

export function calcSAA(acromion?: Pt, thoraxRef?: Pt): number | null {
  if (!isValidPoint(acromion) || !isValidPoint(thoraxRef)) return null;
  const deg = angleDeg(thoraxRef, acromion);   // 임의 참조점 대비
  return Number(deg.toFixed(1));
}

// … TIA/KA/HPA 등은 프로젝트의 기존 함수에 연결하세요.
//   (아예 여기에서 작성해도 되지만, 충돌을 피하려면 기존 함수를 import해서 넘기는 게 안전)

// ─────────────────────────────────────────────────────────────
// 4) DB 로드

async function loadMuscleDB(): Promise<MusclePattern[]> {
  try {
    const res = await fetch('/db/Posture_Muscle_DB_Full.json');
    if (!res.ok) throw new Error('Muscle DB load failed');
    const data = await res.json();
    // 배열이 아니면 배열로 변환 시도
    return Array.isArray(data) ? data : Object.values(data);
  } catch (err) {
    console.error('❌ Muscle DB 로드 실패:', err);
    return [];
  }
}

async function loadPilatesDB(): Promise<PilatesExercise[]> {
  try {
    const res = await fetch('/db/Pilates_Exercise_DB_1000_v2.json');
    if (!res.ok) throw new Error('Pilates DB load failed');
    const data = await res.json();
    return Array.isArray(data) ? data : Object.values(data);
  } catch (err) {
    console.error('❌ Pilates DB 로드 실패:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// 5) 핵심: 분석 → 패턴 매칭 → 운동 추천

export async function analyzeAndRecommendFromPoints(
  points: PosePoints,
  options?: {
    muscleDB?: MusclePattern[];
    pilatesDB?: PilatesExercise[];
    autoFetch?: boolean;
  }
) {
  // (A) 지표 계산
  const results: PostureResults = {
    PTA: calcPelvicTilt(points.asis, points.psis),
    // CVA: calcCVA(points.tragus, points.c7),
    // SAA: calcSAA(points.acromion, someRef),
    // … 필요한 지표 계속 추가
  };

  // (B) DB 로드 (옵션에서 제공되면 사용, 없으면 자동 로드)
  const muscleDB = options?.muscleDB ?? await loadMuscleDB();
  const pilatesDB = options?.pilatesDB ?? await loadPilatesDB();

  // (C) 패턴 매칭 룰
  //   ※ "값이 null이면 매칭에서 제외" — 좌표 빠져도 앱이 안 터짐
  const activePatterns = muscleDB.filter((m) => {
    switch (m.key) {
      case 'PTA':
        if (results.PTA == null) return false;
        // 절대값 기준 임계치 (예: |PTA| > 10° 비정상) — 필요시 조절
        return Math.abs(results.PTA) > 10;
      case 'CVA':
        if (results.CVA == null) return false;
        return results.CVA < 55;
      case 'SAA':
        if (results.SAA == null) return false;
        return results.SAA > 10;
      // … 나머지 지표도 같은 방식으로 추가
      default:
        return false;
    }
  });

  // (D) 운동 추천 (posture_key 매칭)
  const recommended = pilatesDB.filter(ex => activePatterns.some(p => p.key === ex.posture_key));

  return {
    results,
    activePatterns,
    recommendedExercises: recommended.slice(0, 8), // 화면/리포트에 8개까지
  };
}

// 기존 analyzeAndRecommend와 호환성 유지
export async function analyzeAndRecommend(
  posturePoints: PosePoints | Record<string, any>,
  options: {
    muscleDB?: any;
    pilatesDB?: any;
    autoFetch?: boolean;
  } = {}
): Promise<{
  results: PostureResults;
  activePatterns: any[];
  recommendedExercises: any[];
}> {
  // PosePoints 형태로 변환
  const points: PosePoints = {
    asis: posturePoints.asis || null,
    psis: posturePoints.psis || null,
    tragus: posturePoints.tragus || null,
    c7: posturePoints.c7 || null,
    acromion: posturePoints.acromion || null,
    hip: posturePoints.hip || null,
    knee: posturePoints.knee || null,
    ankle: posturePoints.ankle || null
  };

  return await analyzeAndRecommendFromPoints(points, options);
}

// ─────────────────────────────────────────────────────────────
// 6) PDF 본문 문자열 (텍스트 버전; 그래프/이미지는 기존 pdf 모듈에서 addImage)

export function buildReportText(payload: {
  memberName: string;
  centerName: string;
  results: PostureResults;
  activePatterns: MusclePattern[];
  recommendedExercises: PilatesExercise[];
}) {
  const { memberName, centerName, results, activePatterns, recommendedExercises } = payload;
  const lines: string[] = [];

  lines.push(`📋 ${centerName} AI 자세 분석 리포트`);
  lines.push(`👤 회원: ${memberName}`);
  lines.push(`📅 날짜: ${new Date().toLocaleDateString()}`);
  lines.push('');

  lines.push('— 분석 항목 요약 —');
  lines.push('경추/두부: CVA, HPD, HTA');
  lines.push('체간/상체: TIA, TD, SAA, STA, SPP');
  lines.push('골반/하지: PTA, POA, HPA, LLD, KA, Knee Dev, KAS, Tibial, Q-Angle, LLAS');
  lines.push('전체 균형: GSB, PDS');
  lines.push('');

  // 핵심 수치(있는 것만)
  const show = (label: string, v: number | null | undefined, unit = '°') =>
    v == null ? `${label}: —` : `${label}: ${v}${unit}`;

  lines.push('— 주요 측정값(요약) —');
  lines.push(show('PTA(골반 전후경사각)', results.PTA));
  if (results.CVA !== undefined) lines.push(show('CVA(두개경추각)', results.CVA));
  if (results.SAA !== undefined) lines.push(show('SAA(어깨전방각)', results.SAA));
  if (results.TIA !== undefined) lines.push(show('TIA(체간경사각)', results.TIA));
  if (results.KA !== undefined)  lines.push(show('KA(무릎각)', results.KA));
  if (results.GSB !== undefined) lines.push(show('GSB(중력중심선)', results.GSB, 'cm'));
  lines.push('');

  lines.push(`— 주요 문제 패턴(${activePatterns.length}) —`);
  if (activePatterns.length === 0) {
    lines.push('정상 범위 내 또는 특이 소견 없음.');
  } else {
    activePatterns.forEach((p, i) => {
      lines.push(`${i + 1}. ${p.posture_ko} (${p.pattern_name})`);
      lines.push(`   • 해석: ${p.description}`);
      lines.push(`   • 관련 근육: ${p.muscles.join(', ')}`);
    });
  }

  lines.push('');

  lines.push(`— 맞춤 필라테스 추천(${recommendedExercises.length}) —`);
  recommendedExercises.forEach((ex, i) => {
    lines.push(`${i + 1}. ${ex.name_ko} [${ex.equipment_ko}]`);
    lines.push(`   • 목적: ${ex.purpose}`);
    lines.push(`   • 방법: ${ex.how_to_do}`);
    lines.push(`   • 세트/반복: ${ex.sets_reps}`);
    lines.push(`   • 주의: ${Array.isArray(ex.cues) ? ex.cues.join(' / ') : ex.cues}`);
  });

  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────
// 7) 결과 포맷팅 (화면 표시용) - 기존 함수 유지

export function formatAnalysisResults(results: PostureResults): {
  items: Array<{
    항목: string;
    값: string;
    해석: string;
  }>;
} {
  const items: Array<{
    항목: string;
    값: string;
    해석: string;
  }> = [];

  // PTA 포맷팅
  if (results.PTA != null) {
    const pta = results.PTA;
    let interpretation = "";
    if (pta > 0) {
      interpretation = `전방경사 (Anterior Tilt) - ${pta.toFixed(1)}°`;
    } else if (pta < 0) {
      interpretation = `후방경사 (Posterior Tilt) - ${pta.toFixed(1)}°`;
    } else {
      interpretation = "중립 (0°)";
    }

    items.push({
      항목: "PTA",
      값: `${pta.toFixed(1)}°`,
      해석: interpretation
    });
  }

  // TODO: 다른 지표 포맷팅 추가
  // if (results.CVA != null) { ... }
  // if (results.SAA != null) { ... }

  return { items };
}

// ─────────────────────────────────────────────────────────────
// 8) Before/After 비교 그래프 생성 (Chart.js) - 기존 함수 유지

async function createComparisonChart(
  beforeData: Record<string, number>,
  afterData: Record<string, number>,
  options: { width?: number; height?: number; disableAnimation?: boolean } = {}
): Promise<{ chart: any; canvas: HTMLCanvasElement }> {
  const { width = 600, height = 300, disableAnimation = true } = options;

  // Chart.js가 로드되어 있는지 확인
  if (typeof window === 'undefined' || !(window as any).Chart) {
    throw new Error('Chart.js가 로드되지 않았습니다.');
  }

  const Chart = (window as any).Chart;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context를 가져올 수 없습니다.');
  }

  // 주요 지표 선택 (값이 있는 것만)
  const metrics = ['CVA', 'PTA', 'SAA', 'TIA', 'KA', 'GSB', 'HPD', 'HPA'];
  const labels: string[] = [];
  const beforeValues: number[] = [];
  const afterValues: number[] = [];

  metrics.forEach(metric => {
    if (beforeData[metric] != null && afterData[metric] != null) {
      labels.push(metric);
      beforeValues.push(beforeData[metric]);
      afterValues.push(afterData[metric]);
    }
  });

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Before',
          data: beforeValues,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: 'After',
          data: afterValues,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: disableAnimation ? false : {
        duration: 0
      },
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { position: 'bottom' },
        title: {
          display: true,
          text: 'Before–After 비교 그래프',
          font: { size: 16, weight: 'bold' }
        }
      }
    }
  });

  // 렌더링 완료 대기
  if (typeof chart.update === 'function') {
    chart.update('none');
  }

  // 여러 프레임 대기하여 렌더링 완료 보장
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve(null);
        });
      });
    });
  });

  return { chart, canvas };
}

// ─────────────────────────────────────────────────────────────
// 9) Chart.js 렌더링 완료 대기 - 기존 함수 유지

function waitForChartRender(chart: any, timeout = 2000): Promise<any> {
  return new Promise((resolve) => {
    if (!chart || !chart.canvas) {
      resolve(chart);
      return;
    }

    try {
      if (typeof chart.update === 'function') {
        chart.update('none');
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(chart);
          });
        });
      });

      setTimeout(() => resolve(chart), timeout);
    } catch (err) {
      console.warn('Chart 렌더링 대기 중 오류:', err);
      setTimeout(() => resolve(chart), 100);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// 10) 모바일 호환 PDF 저장 - 기존 함수 유지

async function savePDFMobileCompatible(fileName: string, pdfInstance: any): Promise<void> {
  try {
    const blob = pdfInstance.output('blob');
    const fileURL = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = fileURL;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileURL);

    alert('📄 PDF가 다운로드 폴더 또는 파일 앱에 저장되었습니다.');
  } catch (err) {
    console.error('❌ PDF 저장 실패:', err);
    alert('⚠️ PDF 저장 중 오류가 발생했습니다.');
  }
}

// ─────────────────────────────────────────────────────────────
// 11) 변화 추세 그래프 생성 (최근 N회 측정) - 기존 함수 유지

async function createTrendChart(
  history: Array<Record<string, any>>,
  metrics: string[] = ['CVA', 'PTA', 'SAA'],
  count: number = 3
): Promise<{ chart: any; canvas: HTMLCanvasElement } | null> {
  if (!history || history.length < 2) {
    return null;
  }

  // Chart.js 확인
  if (typeof window === 'undefined' || !(window as any).Chart) {
    console.warn('Chart.js가 로드되지 않았습니다.');
    return null;
  }

  const Chart = (window as any).Chart;
  const recent = history.slice(-count); // 최근 N회

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 300;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  // 색상 팔레트
  const colors = [
    '#FF6384', // 빨강
    '#36A2EB', // 파랑
    '#FFCE56', // 노랑
    '#4BC0C0', // 청록
    '#9966FF', // 보라
    '#FF9F40'  // 주황
  ];

  const datasets = metrics.map((metric, idx) => {
    const data = recent.map(h => {
      const value = h[metric];
      return value != null ? Number(value) : null;
    }).filter(v => v != null);

    // 데이터가 없으면 스킵
    if (data.length === 0) return null;

    return {
      label: metric,
      data: data,
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length] + '40', // 투명도 추가
      borderWidth: 2,
      fill: false,
      tension: 0.1
    };
  }).filter(Boolean);

  if (datasets.length === 0) {
    return null;
  }

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: recent.map(h => {
        const date = new Date(h.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: datasets as any
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { position: 'bottom' },
        title: {
          display: true,
          text: `AI 변화 트렌드 (최근 ${recent.length}회 측정)`,
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  // 렌더링 완료 대기
  if (typeof chart.update === 'function') {
    chart.update('none');
  }

  await new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve(null);
        });
      });
    });
  });

  return { chart, canvas };
}

// ─────────────────────────────────────────────────────────────
// 12) Before/After 비교 그래프 + 자세 이미지가 포함된 완전한 PDF 리포트 생성

export async function generateFullPDFReport(
  beforeData: Record<string, number>,
  afterData: Record<string, number>,
  analysis: {
    activePatterns: any[];
    recommendedExercises: any[];
  },
  memberName: string,
  centerName: string,
  beforeImg?: HTMLElement | string | null,
  afterImg?: HTMLElement | string | null,
  options: {
    sessionName?: string;
    additionalNotes?: string;
  } = {}
): Promise<void> {
  // jsPDF 확인
  if (typeof window === 'undefined' || !(window as any).jspdf || !(window as any).jspdf.jsPDF) {
    throw new Error('jsPDF가 로드되지 않았습니다.');
  }

  const { jsPDF } = (window as any).jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFont('helvetica', 'normal');

  // ========== 1️⃣ 표지 ==========
  pdf.setFontSize(20);
  pdf.text(`${centerName || 'AI 자세 분석'} 리포트`, pageWidth / 2, 25, { align: 'center' });

  pdf.setFontSize(12);
  pdf.text(`👤 회원명: ${memberName || '미입력'}`, 20, 40);
  pdf.text(`📅 분석일: ${new Date().toLocaleDateString('ko-KR')}`, 20, 48);
  if (options.sessionName) {
    pdf.text(`📋 세션: ${options.sessionName}`, 20, 56);
  }
  pdf.setFontSize(10);
  pdf.text('본 리포트는 AI 기반 자세 분석 및 필라테스 교정 추천 결과입니다.', 20, 68, {
    maxWidth: pageWidth - 40
  });

  // ========== 2️⃣ Before/After 이미지 비교 ==========
  if (beforeImg || afterImg) {
    pdf.addPage();

    try {
      // html2canvas 확인
      let html2canvas: any;
      if (typeof window !== 'undefined' && (window as any).html2canvas) {
        html2canvas = (window as any).html2canvas;
      } else {
        console.warn('html2canvas가 로드되지 않았습니다. 이미지 스킵.');
      }

      pdf.setFontSize(14);
      pdf.text('Before / After 자세 비교', 20, 20);

      if (html2canvas) {
        let beforeDataUrl: string | null = null;
        let afterDataUrl: string | null = null;

        // Before 이미지 처리
        if (beforeImg) {
          try {
            if (typeof beforeImg === 'string') {
              // URL인 경우
              beforeDataUrl = beforeImg;
            } else if (beforeImg instanceof HTMLElement) {
              // HTML 요소인 경우
              const canvas = await html2canvas(beforeImg, {
                scale: 2,
                useCORS: true,
                logging: false
              });
              beforeDataUrl = canvas.toDataURL('image/png');
            }
          } catch (err) {
            console.warn('Before 이미지 처리 실패:', err);
          }
        }

        // After 이미지 처리
        if (afterImg) {
          try {
            if (typeof afterImg === 'string') {
              afterDataUrl = afterImg;
            } else if (afterImg instanceof HTMLElement) {
              const canvas = await html2canvas(afterImg, {
                scale: 2,
                useCORS: true,
                logging: false
              });
              afterDataUrl = canvas.toDataURL('image/png');
            }
          } catch (err) {
            console.warn('After 이미지 처리 실패:', err);
          }
        }

        // 이미지 추가 - 실제 이미지 비율 유지
        const maxImgWidth = 80;
        const maxImgHeight = 100;
        const startY = 30;
        const spacing = 10;

        const getImageProps = (dataUrl: string) => {
          const img = new Image();
          return new Promise<{ width: number; height: number }>((resolve) => {
            img.onload = () => {
              resolve({ width: img.width, height: img.height });
            };
            img.onerror = () => {
              resolve({ width: maxImgWidth, height: maxImgHeight });
            };
            img.src = dataUrl;
          });
        };

        if (beforeDataUrl && beforeDataUrl !== 'data:,') {
          const imgProps = await getImageProps(beforeDataUrl);
          const aspectRatio = imgProps.width / imgProps.height;
          let imgWidth = maxImgWidth;
          let imgHeight = maxImgWidth / aspectRatio;
          
          if (imgHeight > maxImgHeight) {
            imgHeight = maxImgHeight;
            imgWidth = maxImgHeight * aspectRatio;
          }

          pdf.addImage(beforeDataUrl, 'PNG', 20, startY, imgWidth, imgHeight);
          pdf.setFontSize(10);
          pdf.text('Before', 20 + imgWidth / 2, startY + imgHeight + 5, { align: 'center' });
        }

        if (afterDataUrl && afterDataUrl !== 'data:,') {
          const imgProps = await getImageProps(afterDataUrl);
          const aspectRatio = imgProps.width / imgProps.height;
          let imgWidth = maxImgWidth;
          let imgHeight = maxImgWidth / aspectRatio;
          
          if (imgHeight > maxImgHeight) {
            imgHeight = maxImgHeight;
            imgWidth = maxImgHeight * aspectRatio;
          }

          const afterX = beforeDataUrl ? 20 + maxImgWidth + spacing : 20;
          pdf.addImage(afterDataUrl, 'PNG', afterX, startY, imgWidth, imgHeight);
          pdf.setFontSize(10);
          pdf.text('After', afterX + imgWidth / 2, startY + imgHeight + 5, { align: 'center' });
        }
      }
    } catch (err) {
      console.warn('이미지 추가 실패:', err);
    }
  }

  // ========== 3️⃣ Before/After 비교 그래프 ==========
  try {
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text('Before / After 주요 각도 변화', 20, 20);

    // 그래프 생성
    const { chart, canvas } = await createComparisonChart(beforeData, afterData, {
      width: 600,
      height: 300,
      disableAnimation: true
    });

    // 렌더링 완료 대기
    await waitForChartRender(chart);

    // 그래프 이미지 추출
    const chartImg = canvas.toDataURL('image/png', 1.0);

    if (chartImg && chartImg !== 'data:,') {
      const chartWidth = pageWidth - 40;
      const chartHeight = (chartWidth * canvas.height) / canvas.width;
      pdf.addImage(chartImg, 'PNG', 20, 30, chartWidth, chartHeight);
    } else {
      pdf.setFontSize(10);
      pdf.text('⚠️ 그래프 생성 실패', 20, 40);
    }

    // 차트 정리
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  } catch (err) {
    console.warn('그래프 생성 실패:', err);
    pdf.setFontSize(10);
    pdf.text('⚠️ 그래프 생성 실패', 20, 40);
  }

  // ========== 3.5️⃣ AI 변화 트렌드 그래프 (최근 3회 측정) ==========
  try {
    // Report_History_DB에서 최근 데이터 불러오기
    const storedHistory = localStorage.getItem('Report_History_DB');
    if (storedHistory) {
      const db = JSON.parse(storedHistory);
      const member = db.members?.find((m: any) => 
        m.name === memberName && (!centerName || m.center === centerName)
      );

      if (member && member.history && member.history.length >= 2) {
        // 변화 추세 그래프 생성
        const trendChart = await createTrendChart(
          member.history,
          ['CVA', 'PTA', 'SAA', 'TIA', 'KA'],
          3 // 최근 3회
        );

        if (trendChart) {
          await waitForChartRender(trendChart.chart);

          const trendImg = trendChart.canvas.toDataURL('image/png', 1.0);

          if (trendImg && trendImg !== 'data:,') {
            pdf.addPage();
            pdf.setFontSize(14);
            pdf.text('AI 변화 트렌드 (최근 3회 측정)', 20, 20);

            const chartWidth = pageWidth - 40;
            const chartHeight = (chartWidth * trendChart.canvas.height) / trendChart.canvas.width;
            pdf.addImage(trendImg, 'PNG', 20, 30, chartWidth, chartHeight);

            // 차트 정리
            if (trendChart.chart && typeof trendChart.chart.destroy === 'function') {
              trendChart.chart.destroy();
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('트렌드 그래프 생성 실패:', err);
    // 실패해도 계속 진행
  }

  // ========== 4️⃣ AI 분석 결과 요약 ==========
  pdf.addPage();
  pdf.setFontSize(14);
  pdf.text('🔎 주요 문제 패턴', 20, 20);
  pdf.setFontSize(11);

  let y = 30;
  if (analysis.activePatterns && analysis.activePatterns.length > 0) {
    analysis.activePatterns.forEach((p, idx) => {
      const patternName = p.posture_ko || p.name || p.description || `패턴 ${idx + 1}`;
      const patternDesc = p.pattern_name || p.type || '';
      const text = `${idx + 1}. ${patternName}${patternDesc ? ` — ${patternDesc}` : ''}`;
      const lines = pdf.splitTextToSize(text, pageWidth - 40);
      lines.forEach((line: string) => {
        if (y > pageHeight - 30) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, 20, y);
        y += 6;
      });
    });
  } else {
    pdf.text('분석된 문제 패턴이 없습니다.', 20, y);
  }

  // ========== 5️⃣ 추천 필라테스 운동 ==========
  pdf.addPage();
  pdf.setFontSize(14);
  pdf.text('🧘 추천 필라테스 운동', 20, 20);
  pdf.setFontSize(11);

  y = 30;
  if (analysis.recommendedExercises && analysis.recommendedExercises.length > 0) {
    analysis.recommendedExercises.forEach((ex, idx) => {
      const exName = ex.name_ko || ex.name || ex.ko || `운동 ${idx + 1}`;
      const equipment = ex.equipment_ko || ex.equipment || '';
      const purpose = ex.purpose || '';

      const title = `${idx + 1}. ${exName}${equipment ? ` (${equipment})` : ''}`;
      const titleLines = pdf.splitTextToSize(title, pageWidth - 40);
      titleLines.forEach((line: string) => {
        if (y > pageHeight - 30) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, 20, y);
        y += 6;
      });

      if (purpose) {
        const purposeText = `  목적: ${purpose}`;
        const purposeLines = pdf.splitTextToSize(purposeText, pageWidth - 45);
        purposeLines.forEach((line: string) => {
          if (y > pageHeight - 30) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(line, 25, y);
          y += 6;
        });
        y += 2;
      }

      // 운동 설명 추가
      const howToDo = (ex as any).how_to_do || (ex as any).how || (ex as any).instructions || '';
      if (howToDo) {
        const howText = `  운동 설명: ${howToDo}`;
        const howLines = pdf.splitTextToSize(howText, pageWidth - 45);
        howLines.forEach((line: string) => {
          if (y > pageHeight - 30) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(line, 25, y);
          y += 6;
        });
        y += 2;
      }

      y += 4; // 항목 간 간격

      if (y > pageHeight - 30) {
        pdf.addPage();
        y = 20;
      }
    });
  } else {
    pdf.text('추천 운동이 없습니다.', 20, y);
  }

  // ========== 6️⃣ 정기 재측정 권장 메시지 ==========
  pdf.addPage();
  pdf.setFontSize(12);
  pdf.text('📌 정기 재측정 권장', 20, 20);
  pdf.setFontSize(10);

  const recommendationText = [
    '자세 개선은 지속적인 관찰과 교정이 필요합니다.',
    '권장 재측정 주기: 2-4주 간격',
    '정기적인 측정을 통해 변화를 추적하고 운동 프로그램을 조정하세요.',
    '',
    '본 리포트는 참고용이며, 전문가 상담을 권장합니다.'
  ];

  y = 35;
  recommendationText.forEach(line => {
    if (line) {
      const lines = pdf.splitTextToSize(line, pageWidth - 40);
      pdf.text(lines, 20, y);
      y += lines.length * 6;
    } else {
      y += 4;
    }
  });

  // 추가 메모
  if (options.additionalNotes) {
    y += 10;
    pdf.setFontSize(10);
    pdf.text('추가 메모:', 20, y);
    y += 6;
    const noteLines = pdf.splitTextToSize(options.additionalNotes, pageWidth - 40);
    noteLines.forEach((line: string) => {
      if (y > pageHeight - 30) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 20, y);
      y += 6;
    });
  }

  // ========== 저장 ==========
  const fileName = `${memberName || 'member'}_${options.sessionName || 'session'}_AI_Posture_Report.pdf`;
  await savePDFMobileCompatible(fileName, pdf);

  // ========== 히스토리 자동 저장 ==========
  try {
    // After 데이터를 히스토리에 저장
    await saveReportHistory(
      memberName,
      centerName,
      afterData,
      analysis.activePatterns?.length > 0
        ? `${analysis.activePatterns.length}개 문제 패턴 감지`
        : '정상 범위 내'
    );
  } catch (err) {
    console.warn('히스토리 저장 실패 (PDF는 정상 생성됨):', err);
  }

  console.log(`✅ 완전한 PDF 리포트 생성 완료: ${fileName}`);
}

// ─────────────────────────────────────────────────────────────
// 13) Report_History_DB에 분석 결과 저장 (LocalStorage 기반)

export async function saveReportHistory(
  memberName: string,
  centerName: string,
  results: Record<string, number | string>,
  summary?: string
): Promise<void> {
  try {
    // LocalStorage에서 기존 DB 가져오기 또는 초기화
    let db: {
      members: Array<{
        id: string;
        name: string;
        center: string;
        history: Array<{
          date: string;
          [key: string]: any;
        }>;
      }>;
    };

    const stored = localStorage.getItem('Report_History_DB');
    if (stored) {
      db = JSON.parse(stored);
    } else {
      // 초기 템플릿 생성
      db = {
        members: []
      };
    }

    // 기존 회원 찾기
    let member = db.members.find(m => m.name === memberName && m.center === centerName);

    if (!member) {
      // 새 회원 생성
      member = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID() 
          : `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: memberName,
        center: centerName,
        history: []
      };
      db.members.push(member);
    }

    // 오늘 결과 저장
    const today = new Date().toISOString().split('T')[0];
    const historyEntry = {
      date: today,
      ...results,
      summary: summary || 'AI 자동 분석 결과 저장됨'
    };

    // 같은 날짜의 기록이 있으면 업데이트, 없으면 추가
    const existingIndex = member.history.findIndex(h => h.date === today);
    if (existingIndex >= 0) {
      member.history[existingIndex] = historyEntry;
    } else {
      member.history.push(historyEntry);
    }

    // 날짜순 정렬 (오래된 것부터)
    member.history.sort((a, b) => a.date.localeCompare(b.date));

    // LocalStorage에 저장
    localStorage.setItem('Report_History_DB', JSON.stringify(db));

    console.log(`✅ 리포트 히스토리 저장 완료: ${memberName} (${today})`);
  } catch (err) {
    console.error('❌ 리포트 히스토리 저장 실패:', err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// 14) 회원의 리포트 히스토리 가져오기

export function getReportHistory(
  memberName: string,
  centerName?: string
): Array<{
  date: string;
  [key: string]: any;
}> {
  try {
    const stored = localStorage.getItem('Report_History_DB');
    if (!stored) return [];

    const db = JSON.parse(stored);
    const member = db.members.find((m: any) => 
      m.name === memberName && (!centerName || m.center === centerName)
    );

    return member ? member.history : [];
  } catch (err) {
    console.error('❌ 리포트 히스토리 로드 실패:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// DB 기반 분석 함수 (새 버전)
// ─────────────────────────────────────────────────────────────

export async function analyzePostureWithDB(
  measured: Metrics
): Promise<AnalysisWithDBResult> {
  const { postureMetrics, exercises } = await loadPrescriptionDataset();

  const metricSummaries: MetricSummary[] = metricOrder.map((key) => {
    const value = measured[key as keyof Metrics] ?? null;
    const normalizedValue =
      typeof value === "number" && !Number.isNaN(value) ? value : null;
    const { status, deviationKey } = evaluateMetricDeviation(key, normalizedValue);
    const postureEntry = deviationKey ? postureMetrics[deviationKey] : undefined;

    return {
      key,
      value: normalizedValue,
      status,
      deviationKey,
      tightMuscles: postureEntry?.tightMuscles ?? [],
      weakMuscles: postureEntry?.weakMuscles ?? [],
      strategy: postureEntry?.strategy ?? "",
    };
  });

  const activePatterns: PostureMetricEntry[] = metricSummaries
    .map((m) => (m.deviationKey ? postureMetrics[m.deviationKey] : undefined))
    .filter((entry): entry is PostureMetricEntry => Boolean(entry));

  const tightAll = Array.from(
    new Set(activePatterns.flatMap((pattern) => pattern.tightMuscles))
  );
  const weakAll = Array.from(
    new Set(activePatterns.flatMap((pattern) => pattern.weakMuscles))
  );

  const { stretch, strengthen } = buildExerciseRecommendations(
    activePatterns,
    exercises
  );

  const legacyPatterns: LegacyPatternSummary[] = metricSummaries
    .filter((m) => m.deviationKey)
    .map((metric) => ({
      posture_ko: `${metric.key} (${metric.status})`,
      posture_en: metric.deviationKey,
      summary: metric.strategy,
      muscle_pattern: {
        tight: { primary: metric.tightMuscles },
        weak: { primary: metric.weakMuscles },
      },
    }));

  return {
    metrics: metricSummaries,
    stretchRecommendations: stretch,
    strengthenRecommendations: strengthen,
    activePatterns: legacyPatterns,
    tightAll,
    weakAll,
    pilatesAll: [...stretch, ...strengthen],
  };
}

type MetricRule = {
  min?: number;
  max?: number;
  lowCode?: string;
  highCode?: string;
  positiveCode?: string;
  negativeCode?: string;
  absThreshold?: number;
  labelLow?: string;
  labelHigh?: string;
  labelPositive?: string;
  labelNegative?: string;
};

const metricOrder: (keyof Metrics)[] = [
  "CVA",
  "HPD",
  "TIA",
  "SAA",
  "PTA",
  "KA",
  "Tibial",
  "QAngle",
  "KneeDev",
  "LLD",
  "GSB",
  "HPA",
  "PDS",
  "STA",
  "POA",
  "TD",
  "HTA",
  "SPP",
  "KAS",
  "LLAS",
];

const metricRules: Record<string, MetricRule> = {
  CVA: { min: 50, max: 80, lowCode: "CVA_LOW", highCode: "CVA_HIGH" },
  HPD: { min: -2, max: 2, lowCode: "HPD_LOW", highCode: "HPD_HIGH" },
  TIA: { min: -5, max: 10, lowCode: "TIA_LOW", highCode: "TIA_HIGH" },
  SAA: { min: -5, max: 10, lowCode: "SAA_LOW", highCode: "SAA_HIGH" },
  PTA: { positiveCode: "PTA_ANT", negativeCode: "PTA_POST", absThreshold: 1, labelPositive: "전방경사", labelNegative: "후방경사" },
  KA: { min: 175, max: 185, lowCode: "KA_VARUS", highCode: "KA_VALGUS" },
  Tibial: { min: -5, max: 10, lowCode: "TIB_INTERNAL", highCode: "TIB_EXTERNAL" },
  QAngle: { min: 10, max: 20, lowCode: "QANGLE_SMALL", highCode: "QANGLE_LARGE" },
  KneeDev: { min: -1, max: 3, lowCode: "KNEEDEV_MEDIAL", highCode: "KNEEDEV_LATERAL" },
  LLD: { absThreshold: 1, highCode: "LLD_IMBALANCE", labelHigh: "불균형" },
  GSB: { positiveCode: "GSB_FORWARD", negativeCode: "GSB_BACKWARD", absThreshold: 0.5, labelPositive: "전방 편위", labelNegative: "후방 편위" },
  HPA: { positiveCode: "HPA_LEFT", negativeCode: "HPA_RIGHT", absThreshold: 5, labelPositive: "좌회전", labelNegative: "우회전" },
  PDS: { positiveCode: "PDS_HIGH", negativeCode: "PDS_LOW", absThreshold: 3, labelPositive: "골반 하강", labelNegative: "골반 거상" },
  STA: { positiveCode: "STA_HIGH", negativeCode: "STA_LOW", absThreshold: 2, labelPositive: "전방 경사", labelNegative: "후방 경사" },
  POA: { positiveCode: "POA_RIGHT", negativeCode: "POA_LEFT", absThreshold: 2, labelPositive: "우하강", labelNegative: "좌하강" },
  TD: { positiveCode: "TD_KYPHOSIS", negativeCode: "TD_LORDOSIS", absThreshold: 5, labelPositive: "후만 증가", labelNegative: "편평 흉추" },
  HTA: { positiveCode: "HTA_RIGHT", negativeCode: "HTA_LEFT", absThreshold: 1, labelPositive: "우측 기울기", labelNegative: "좌측 기울기" },
  SPP: { positiveCode: "SPP_FORWARD", negativeCode: "SPP_BACKWARD", absThreshold: 1, labelPositive: "전방 편위", labelNegative: "후방 편위" },
  KAS: { positiveCode: "KAS_EXTERNAL", negativeCode: "KAS_INTERNAL", absThreshold: 2, labelPositive: "외회전", labelNegative: "내회전" },
  LLAS: { positiveCode: "LLAS_RIGHT", negativeCode: "LLAS_LEFT", absThreshold: 2, labelPositive: "우측 이동", labelNegative: "좌측 이동" },
};

function evaluateMetricDeviation(
  key: string,
  value: number | null
): { status: string; deviationKey?: string } {
  if (value == null) return { status: "—" };
  const rule = metricRules[key];
  if (!rule) return { status: "정상" };

  if (rule.positiveCode || rule.negativeCode) {
    const threshold = rule.absThreshold ?? 0;
    if (value > threshold && rule.positiveCode) {
      return {
        status: rule.labelPositive || "→ 편위(+)",
        deviationKey: rule.positiveCode,
      };
    }
    if (value < -threshold && rule.negativeCode) {
      return {
        status: rule.labelNegative || "→ 편위(-)",
        deviationKey: rule.negativeCode,
      };
    }
  }

  if (rule.min !== undefined && value < rule.min && rule.lowCode) {
    return { status: rule.labelLow || "↓ 낮음", deviationKey: rule.lowCode };
  }
  if (rule.max !== undefined && value > rule.max && rule.highCode) {
    return { status: rule.labelHigh || "↑ 높음", deviationKey: rule.highCode };
  }

  if (rule.highCode && rule.absThreshold !== undefined) {
    if (Math.abs(value) > rule.absThreshold) {
      return {
        status: rule.labelHigh || "↑ 편차",
        deviationKey: rule.highCode,
      };
    }
  }

  return { status: "정상" };
}

function buildExerciseRecommendations(
  patterns: PostureMetricEntry[],
  exercises: ExerciseEntry[]
): {
  stretch: ExerciseRecommendation[];
  strengthen: ExerciseRecommendation[];
} {
  const tightMuscles = new Set<string>();
  const weakMuscles = new Set<string>();

  patterns.forEach((pattern) => {
    pattern.tightMuscles.forEach((m) => tightMuscles.add(m));
    pattern.weakMuscles.forEach((m) => weakMuscles.add(m));
  });

  const stretch: ExerciseRecommendation[] = [];
  const strengthen: ExerciseRecommendation[] = [];

  exercises.forEach((exercise) => {
    const stretchMatch = exercise.stretchMuscles.filter((m) =>
      tightMuscles.has(m)
    );
    if (stretchMatch.length) {
      stretch.push({ ...exercise, matchedMuscles: stretchMatch });
    }

    const strengthMatch = exercise.strengthenMuscles.filter((m) =>
      weakMuscles.has(m)
    );
    if (strengthMatch.length) {
      strengthen.push({ ...exercise, matchedMuscles: strengthMatch });
    }
  });

  return {
    stretch: uniqueById(stretch).slice(0, 20),
    strengthen: uniqueById(strengthen).slice(0, 20),
  };
}

function uniqueById(list: ExerciseRecommendation[]): ExerciseRecommendation[] {
  const seen = new Set<string>();
  const result: ExerciseRecommendation[] = [];
  list.forEach((item) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    result.push(item);
  });
  return result;
}
