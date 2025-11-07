// src/utils/analyzePosture.example.ts
// ✅ 사용 예시

import { 
  calcPelvicTilt, 
  analyzeAndRecommend, 
  formatAnalysisResults,
  generateFullPDFReport,
  saveReportHistory,
  getReportHistory
} from './analyzePosture';

/**
 * 예시 1: PTA 계산만 수행
 */
export function example1_CalcPTA() {
  // AI가 추출한 좌표값
  const posturePoints = {
    asis: { x: 500, y: 600 },  // 전상장골극
    psis: { x: 480, y: 580 }   // 후상장골극 (위쪽에 위치)
  };

  // PTA 계산
  const PTA = calcPelvicTilt(posturePoints.asis, posturePoints.psis);
  
  console.log(`PTA: ${PTA}°`);
  // ASIS가 PSIS보다 아래쪽(y값이 큼) → 전방경사 → 양수 (예: 8.2°)
  // ASIS가 PSIS보다 위쪽(y값이 작음) → 후방경사 → 음수 (예: -5.3°)
}

/**
 * 예시 2: 전체 분석 및 운동 추천
 */
export async function example2_FullAnalysis() {
  // AI가 추출한 좌표값
  const posturePoints = {
    asis: { x: 500, y: 600 },
    psis: { x: 480, y: 580 },
    tragus: { x: 450, y: 200 },
    c7: { x: 460, y: 250 },
    // ... 기타 좌표
  };

  // 전체 분석 실행
  const { results, activePatterns, recommendedExercises } = await analyzeAndRecommend(
    posturePoints,
    {
      autoFetch: true  // DB 자동 로드
    }
  );

  console.log('분석 결과:', results);
  console.log('활성 패턴:', activePatterns);
  console.log('추천 운동:', recommendedExercises);

  // 결과 포맷팅
  const formatted = formatAnalysisResults(results);
  console.table(formatted.items);
}

/**
 * 예시 3: Before/After 비교 PDF 리포트 생성 (히스토리 자동 저장 포함)
 */
export async function example3_FullPDFReport() {
  // Before 측정값
  const beforeData = {
    CVA: 65.0,
    PTA: 15.0,
    SAA: 12.0,
    TIA: 8.0,
    KA: 180.0,
    GSB: 1.5,
    HPD: 2.0,
    HPA: 5.0
  };

  // After 측정값
  const afterData = {
    CVA: 72.3,
    PTA: 13.1,
    SAA: 10.5,
    TIA: 6.4,
    KA: 177.2,
    GSB: 1.2,
    HPD: 1.8,
    HPA: 4.5
  };

  // 분석 실행
  const analysis = await analyzeAndRecommend({
    // After 데이터를 기반으로 분석
    ...afterData
  });

  // Before/After 이미지 요소 가져오기
  const beforeImg = document.getElementById('beforeImage') as HTMLElement;
  const afterImg = document.getElementById('afterImage') as HTMLElement;

  // 또는 이미지 URL 사용
  // const beforeImg = '/images/before.jpg';
  // const afterImg = '/images/after.jpg';

  // 완전한 PDF 리포트 생성
  // ⚠️ 자동으로 히스토리에 저장됨 (generateFullPDFReport 내부에서)
  await generateFullPDFReport(
    beforeData,
    afterData,
    analysis,
    '홍길동',
    '레드코어 트레이닝센터',
    beforeImg,
    afterImg,
    {
      sessionName: 'After',
      additionalNotes: '2주간 필라테스 프로그램 진행 후 재측정 결과입니다.'
    }
  );
  
  // PDF 생성 후 히스토리 확인
  const history = getReportHistory('홍길동', '레드코어 트레이닝센터');
  console.log('저장된 히스토리:', history);
}

/**
 * 예시 4: React 컴포넌트에서 사용
 */
export function example4_ReactComponent() {
  // React 예시
  /*
  import { useState, useEffect } from 'react';
  import { generateFullPDFReport, analyzeAndRecommend } from '@/utils/analyzePosture';
  
  function PostureReport({ beforeData, afterData, beforeImg, afterImg }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
      async function loadAnalysis() {
        const result = await analyzeAndRecommend(afterData);
        setAnalysis(result);
      }
      loadAnalysis();
    }, [afterData]);
    
    const handleGeneratePDF = async () => {
      setLoading(true);
      try {
        await generateFullPDFReport(
          beforeData,
          afterData,
          analysis,
          '회원명',
          '센터명',
          beforeImg,
          afterImg
        );
      } catch (err) {
        console.error('PDF 생성 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <div>
        <button onClick={handleGeneratePDF} disabled={loading || !analysis}>
          {loading ? 'PDF 생성 중...' : '📄 PDF 리포트 생성'}
        </button>
      </div>
    );
  }
  */
}

/**
 * 예시 5: 전역 함수로 사용 (index.html)
 */
export function example5_GlobalFunction() {
  // 페이지 로드 후 자동으로 전역 함수로 노출됨
  /*
  async function runFullReport() {
    const beforeData = {
      CVA: 65.0, PTA: 15.0, SAA: 12.0, TIA: 8.0, KA: 180.0, GSB: 1.5
    };
    
    const afterData = {
      CVA: 72.3, PTA: 13.1, SAA: 10.5, TIA: 6.4, KA: 177.2, GSB: 1.2
    };
    
    // 분석
    const analysis = await window.analyzeAndRecommend(afterData);
    
    // PDF 생성
    await window.generateFullPDFReport(
      beforeData,
      afterData,
      analysis,
      '홍길동',
      '레드코어 트레이닝센터',
      document.getElementById('beforeImage'),
      document.getElementById('afterImage'),
      { sessionName: 'After' }
    );
  }
  
  // 버튼 클릭 시 실행
  document.getElementById('btnGeneratePDF').onclick = runFullReport;
  */
}

/**
 * 예시 6: 리포트 히스토리 저장 및 조회
 */
export async function example6_ReportHistory() {
  // 1. 분석 결과 저장
  const results = {
    CVA: 72.3,
    PTA: 13.1,
    SAA: 10.5,
    TIA: 6.4,
    KA: 177.2,
    GSB: 1.2
  };

  await saveReportHistory(
    '홍길동',
    '레드코어 트레이닝센터',
    results,
    '2주간 필라테스 프로그램 진행 후 개선됨'
  );

  // 2. 히스토리 조회
  const history = getReportHistory('홍길동', '레드코어 트레이닝센터');
  console.log('히스토리:', history);

  // 3. 최근 3회 데이터 확인
  const recent = history.slice(-3);
  console.log('최근 3회:', recent);

  // 4. 변화 추세 확인
  recent.forEach((entry, idx) => {
    console.log(`${entry.date}: CVA=${entry.CVA}°, PTA=${entry.PTA}°`);
  });
}
