/**
 * PDF 리포트 생성 통합 사용 예제
 * 
 * 이 파일은 참고용 예제입니다.
 * 실제 사용 시에는 아래 코드를 복사해서 사용하세요.
 */

import { generateReportHtml, ReportData } from "./makeReportHtml";
import { renderElementToPdf } from "./generatePdfReport";
import { analyzePostureWithDB } from "./analyzePosture";

/**
 * 예제 1: 분석 → HTML 생성 → PDF 저장 (전체 플로우)
 */
export async function example1_FullFlow() {
  // 1. 측정 데이터
  const measured = {
    CVA: 65.7,
    HPD: 1.0,
    TIA: 4.0,
    SAA: 15.1,
    PTA: 18.0,
    KA: 176.2,
    Tibial: 2.5,
    GSB: 0.2,
    HPA: 12.0,
    PDS: 6.0,
  };

  // 2. AI 분석 수행 (DB 기반)
  const analysis = await analyzePostureWithDB(measured);

  // 3. 리포트 데이터 준비
  const reportData: ReportData = {
    memberName: "홍길동",
    centerName: "필라테스 센터",
    postureResults: measured,
    activePatterns: analysis.activePatterns || [],
    muscleStatus: {
      tight: analysis.tightAll || [],
      weak: analysis.weakAll || [],
    },
    exercises: analysis.pilatesAll || [],
  };

  // 4. HTML 생성
  const html = generateReportHtml(reportData);

  // 5. DOM에 임시로 추가
  const container = document.createElement("div");
  container.id = "report-container";
  container.innerHTML = html;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "800px";
  document.body.appendChild(container);

  // 6. PDF 생성 및 저장
  try {
    await renderElementToPdf(
      container,
      `${reportData.memberName}_자세분석리포트.pdf`
    );
  } finally {
    // 정리
    document.body.removeChild(container);
  }
}

/**
 * 예제 2: 기존 분석 결과를 사용하여 PDF 생성
 */
export async function example2_FromExistingAnalysis(
  analysisResult: any,
  memberName: string,
  centerName: string
) {
  // 리포트 데이터 구성
  const reportData: ReportData = {
    memberName,
    centerName,
    postureResults: analysisResult.measured || {},
    activePatterns: analysisResult.activePatterns || [],
    muscleStatus: {
      tight: analysisResult.tightAll || [],
      weak: analysisResult.weakAll || [],
    },
    exercises: analysisResult.pilatesAll || [],
  };

  // HTML 생성
  const html = generateReportHtml(reportData);

  // 컨테이너 생성 및 추가
  const container = document.createElement("div");
  container.id = "report-container";
  container.innerHTML = html;
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "800px";
  document.body.appendChild(container);

  // PDF 생성
  try {
    await renderElementToPdf(container, `${memberName}_리포트.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * 예제 3: React 컴포넌트에서 사용
 */
export function example3_ReactComponent() {
  const handleGeneratePDF = async () => {
    // 분석 데이터 가져오기 (예시)
    const measured = {
      CVA: 65.7,
      PTA: 18.0,
      // ... 기타 측정값
    };

    // 분석 수행
    const analysis = await analyzePostureWithDB(measured);

    // 리포트 데이터 준비
    const reportData: ReportData = {
      memberName: "홍길동",
      centerName: "필라테스 센터",
      postureResults: measured,
      activePatterns: analysis.activePatterns || [],
      muscleStatus: {
        tight: analysis.tightAll || [],
        weak: analysis.weakAll || [],
      },
      exercises: analysis.pilatesAll || [],
    };

    // HTML 생성
    const html = generateReportHtml(reportData);

    // 컨테이너 생성
    const container = document.createElement("div");
    container.id = "report-container";
    container.innerHTML = html;
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.width = "800px";
    document.body.appendChild(container);

    // PDF 생성
    try {
      await renderElementToPdf(container, "자세분석리포트.pdf");
    } finally {
      document.body.removeChild(container);
    }
  };

  return (
    <button onClick={handleGeneratePDF}>PDF 리포트 생성</button>
  );
}

/**
 * 예제 4: 화면에 표시된 리포트를 PDF로 변환
 */
export async function example4_FromVisibleElement() {
  // 화면에 이미 표시된 리포트 요소
  const reportElement = document.getElementById("report-section");
  
  if (!reportElement) {
    alert("리포트 요소를 찾을 수 없습니다.");
    return;
  }

  // PDF 생성
  await renderElementToPdf(
    reportElement as HTMLElement,
    "자세분석리포트.pdf"
  );
}

/**
 * 예제 5: 그래프/차트가 포함된 리포트
 */
export async function example5_WithCharts() {
  // 리포트 컨테이너 생성
  const container = document.createElement("div");
  container.id = "full-report-container";
  container.style.width = "800px";
  container.style.padding = "20px";
  container.style.backgroundColor = "#ffffff";

  // 1. 헤더 추가
  const header = document.createElement("div");
  header.innerHTML = `
    <h1>자세 분석 리포트</h1>
    <p>회원: 홍길동 · 생성일: ${new Date().toLocaleString("ko-KR")}</p>
  `;
  container.appendChild(header);

  // 2. 차트 추가 (기존 차트 요소를 복사)
  const chartElement = document.getElementById("my-chart");
  if (chartElement) {
    const chartClone = chartElement.cloneNode(true) as HTMLElement;
    container.appendChild(chartClone);
  }

  // 3. 리포트 HTML 추가
  const measured = { CVA: 65.7, PTA: 18.0 };
  const analysis = await analyzePostureWithDB(measured);
  const reportData: ReportData = {
    memberName: "홍길동",
    centerName: "필라테스 센터",
    postureResults: measured,
    activePatterns: analysis.activePatterns || [],
    muscleStatus: {
      tight: analysis.tightAll || [],
      weak: analysis.weakAll || [],
    },
    exercises: analysis.pilatesAll || [],
  };
  const html = generateReportHtml(reportData);
  const reportDiv = document.createElement("div");
  reportDiv.innerHTML = html;
  container.appendChild(reportDiv);

  // 4. DOM에 추가 (보이지 않게)
  container.style.position = "absolute";
  container.style.left = "-9999px";
  document.body.appendChild(container);

  // 5. PDF 생성
  try {
    await renderElementToPdf(container, "완전한_리포트.pdf");
  } finally {
    document.body.removeChild(container);
  }
}

