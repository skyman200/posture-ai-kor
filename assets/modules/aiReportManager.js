// src/modules/aiReportManager.js

// ✅ GitHub Pages 경로 자동 감지 및 절대 경로 생성
const REPO_ROOT = typeof location !== 'undefined' 
  ? (location.origin + (location.pathname.includes('/posture-ai-kor') ? '/posture-ai-kor' : ''))
  : '';

// ✅ 절대 경로 기반 import (동적 import로 변경)
let UserDataManager, analyzeWithDB, exportDetailedPDF;

// 모듈 로드 함수
async function loadDependencies() {
  if (UserDataManager && analyzeWithDB && exportDetailedPDF) {
    return; // 이미 로드됨
  }

  try {
    const [userDataModule, analyzerModule, reportModule] = await Promise.all([
      import(`${REPO_ROOT}/assets/utils/userDataManager.js`),
      import(`${REPO_ROOT}/assets/ai/analyzerWithDB.js`),
      import(`${REPO_ROOT}/assets/ai/reportPdf.js`)
    ]);
    
    UserDataManager = userDataModule.UserDataManager;
    analyzeWithDB = analyzerModule.analyzeWithDB;
    exportDetailedPDF = reportModule.exportDetailedPDF;
  } catch (err) {
    console.warn('⚠️ aiReportManager 의존성 로드 실패:', err);
    // 폴백: 상대 경로 시도 (assets 기준)
    try {
      const [userDataModule, analyzerModule, reportModule] = await Promise.all([
        import('../utils/userDataManager.js'),
        import('../ai/analyzerWithDB.js'),
        import('../ai/reportPdf.js')
      ]);
      UserDataManager = userDataModule.UserDataManager;
      analyzeWithDB = analyzerModule.analyzeWithDB;
      exportDetailedPDF = reportModule.exportDetailedPDF;
    } catch (fallbackErr) {
      console.error('❌ aiReportManager 의존성 로드 완전 실패:', fallbackErr);
    }
  }
}

/**
 * ✅ AI 분석 + 리포트 + PDF 통합 관리 모듈
 *  - localStorage 기반 사용자별 데이터 저장
 *  - 분석 결과, 필라테스 추천, PDF 자동 저장
 *  - Before–After 히스토리 누적 가능
 */
export const AIReportManager = (() => {
  // ✅ 의존성 로드 확인 (비동기)
  let dependenciesLoaded = false;
  
  /**
   * 의존성 로드 확인 및 초기화
   */
  const ensureDependencies = async () => {
    if (!dependenciesLoaded) {
      await loadDependencies();
      dependenciesLoaded = true;
    }
  };

  /**
   * 리포트 저장
   * @param {string} sessionName - 세션 이름 (예: 'Before', 'After', '2025-01-15_After')
   * @param {object} data - 저장할 리포트 데이터
   */
  const saveReport = async (sessionName, data) => {
    await ensureDependencies();
    if (!UserDataManager) {
      throw new Error('UserDataManager가 로드되지 않았습니다.');
    }
    const reports = UserDataManager.load('reports', {});
    reports[sessionName] = {
      timestamp: new Date().toISOString(),
      ...data
    };
    UserDataManager.save('reports', reports);
    console.log(`💾 리포트 저장 완료: ${sessionName}`);
    return reports[sessionName];
  };

  /**
   * 리포트 불러오기
   * @param {string} sessionName - 세션 이름
   * @returns {object|null} 저장된 리포트 데이터
   */
  const loadReport = async (sessionName) => {
    await ensureDependencies();
    if (!UserDataManager) {
      console.warn('⚠️ UserDataManager가 로드되지 않았습니다.');
      return null;
    }
    const reports = UserDataManager.load('reports', {});
    return reports[sessionName] || null;
  };

  /**
   * 전체 리포트 히스토리 가져오기
   * @returns {object} 모든 리포트 객체
   */
  const getAllReports = async () => {
    await ensureDependencies();
    if (!UserDataManager) {
      console.warn('⚠️ UserDataManager가 로드되지 않았습니다.');
      return {};
    }
    return UserDataManager.load('reports', {});
  };

  /**
   * 리포트 삭제
   * @param {string} sessionName - 삭제할 세션 이름
   */
  const deleteReport = async (sessionName) => {
    await ensureDependencies();
    if (!UserDataManager) {
      console.warn('⚠️ UserDataManager가 로드되지 않았습니다.');
      return false;
    }
    const reports = UserDataManager.load('reports', {});
    if (reports[sessionName]) {
      delete reports[sessionName];
      UserDataManager.save('reports', reports);
      console.log(`🗑️ 리포트 삭제 완료: ${sessionName}`);
      return true;
    }
    return false;
  };

  /**
   * Before-After 비교 데이터 가져오기
   * @param {string} beforeSession - Before 세션 이름
   * @param {string} afterSession - After 세션 이름
   * @returns {object|null} {before, after} 객체 또는 null
   */
  const getBeforeAfterComparison = async (beforeSession, afterSession) => {
    const before = await loadReport(beforeSession);
    const after = await loadReport(afterSession);
    
    if (!before || !after) {
      return null;
    }
    
    return {
      before: before.postureData || before,
      after: after.postureData || after,
      beforeReport: before,
      afterReport: after
    };
  };

  /**
   * PDF 내보내기 (html2canvas 사용)
   * @param {string} sessionName - 세션 이름
   * @param {HTMLElement} htmlElement - PDF로 변환할 HTML 요소
   */
  const exportPDF = async (sessionName, htmlElement) => {
    try {
      // 전역 html2canvas와 jsPDF 사용 (이미 로드되어 있음)
      if (typeof html2canvas === 'undefined') {
        throw new Error('html2canvas가 로드되지 않았습니다.');
      }
      
      if (typeof window === 'undefined' || !window.jspdf || !window.jspdf.jsPDF) {
        throw new Error('jsPDF가 로드되지 않았습니다.');
      }

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      const canvas = await html2canvas(htmlElement, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      
      // 모바일 호환 저장
      await savePDFMobileCompatible(`${sessionName}_report.pdf`, pdf);
      
      console.log(`📄 PDF 내보내기 성공: ${sessionName}`);
    } catch (err) {
      console.error('❌ PDF 생성 실패:', err);
      throw err;
    }
  };

  /**
   * 모바일 호환 PDF 저장
   * @param {string} fileName - 파일명
   * @param {object} pdfInstance - jsPDF 인스턴스
   */
  const savePDFMobileCompatible = async (fileName, pdfInstance) => {
    try {
      const blob = pdfInstance.output('blob');
      const fileURL = URL.createObjectURL(blob);

      // 모바일 Safari나 Chrome에서 다운로드 강제 트리거
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
  };

  /**
   * AI 분석 + 운동 추천 + PDF 자동저장 통합 실행
   * @param {string} sessionName - 세션 이름
   * @param {object} postureData - 자세 측정 데이터 {CVA: 72.3, PTA: 13.1, ...}
   * @param {object} options - 옵션 {centerName, memberName, beforeSession, autoPDF}
   */
  const analyzeAndSave = async (sessionName, postureData, options = {}) => {
    const {
      centerName = '미입력',
      memberName = '회원',
      beforeSession = null,
      autoPDF = true
    } = options;

    console.log(`🤖 AI 분석 시작: ${sessionName}`);

    try {
      // Before 데이터 가져오기 (비교 분석용)
      let beforeData = null;
      if (beforeSession) {
        const beforeReport = loadReport(beforeSession);
        if (beforeReport) {
          beforeData = beforeReport.postureData || beforeReport;
        }
      }

      // AI 분석 실행 (DB 기반 분석기 우선 사용)
      let analysisResults = null;
      let aiSummary = null;
      let pilatesPlan = null;

      try {
        // DB 기반 분석기 사용 (새 모듈)
        if (typeof analyzeWithDB === 'function') {
          // 측정값을 섹션별로 구성 (side/front 구분)
          const measured = {};
          
          // postureData가 이미 섹션별로 구성되어 있는지 확인
          if (postureData.side || postureData.front) {
            measured.side = postureData.side || {};
            measured.front = postureData.front || {};
            // 기타 지표들도 추가
            Object.keys(postureData).forEach(key => {
              if (key !== 'side' && key !== 'front' && typeof postureData[key] === 'number') {
                if (!measured.general) measured.general = {};
                measured.general[key] = postureData[key];
              }
            });
          } else {
            // flat 구조인 경우 side로 가정 (기존 호환성)
            measured.side = postureData;
          }

          analysisResults = await analyzeWithDB(measured);
          
          // 분석 결과를 기존 형식으로 변환
          aiSummary = {
            results: analysisResults.results || [],
            sections: analysisResults.sections || [],
            muscles: {
              tight: analysisResults.tightAll || [],
              weak: analysisResults.weakAll || []
            }
          };
          pilatesPlan = analysisResults.pilatesAll || [];
        } else if (typeof window !== 'undefined' && typeof window.analyzeWithDB === 'function') {
          // 전역 analyzeWithDB 함수 사용
          const measured = postureData.side || postureData.front ? postureData : { side: postureData };
          analysisResults = await window.analyzeWithDB(measured);
          aiSummary = {
            results: analysisResults.results || [],
            sections: analysisResults.sections || [],
            muscles: {
              tight: analysisResults.tightAll || [],
              weak: analysisResults.weakAll || []
            }
          };
          pilatesPlan = analysisResults.pilatesAll || [];
        } else if (typeof window !== 'undefined' && typeof window.analyzePostureAI === 'function') {
          // 폴백: 기존 analyzePostureAI 함수 사용
          if (beforeData) {
            analysisResults = await window.analyzePostureAI(beforeData, postureData);
          } else {
            const tempBefore = {};
            Object.keys(postureData).forEach(key => {
              tempBefore[key] = postureData[key] * 0.9;
            });
            analysisResults = await window.analyzePostureAI(tempBefore, postureData);
          }
          
          if (analysisResults && !analysisResults.error) {
            aiSummary = {
              results: analysisResults.results || [],
              findings: analysisResults.findings || [],
              muscles: analysisResults.muscles || { tight: [], weak: [] }
            };
            pilatesPlan = analysisResults.topRecommendations || [];
          }
        } else {
          // 최종 폴백: 간단한 분석 로직
          aiSummary = analyzePostureData(postureData);
          pilatesPlan = recommendPilates(aiSummary);
        }
      } catch (err) {
        console.warn('AI 분석 중 오류:', err);
        // 폴백: 간단한 분석
        aiSummary = analyzePostureData(postureData);
        pilatesPlan = recommendPilates(aiSummary);
      }

      // 최종 리포트 데이터 구성
      const finalReport = {
        sessionName,
        postureData,
        aiSummary: aiSummary || analyzePostureData(postureData),
        pilatesPlan: pilatesPlan || recommendPilates(aiSummary || analyzePostureData(postureData)),
        beforeData,
        centerName,
        memberName,
        timestamp: new Date().toISOString()
      };

      // 리포트 저장
      saveReport(sessionName, finalReport);

      // PDF 자동 생성 (옵션)
      if (autoPDF) {
        try {
          // DB 기반 상세 PDF 생성 (새 모듈 우선 사용)
          if (typeof exportDetailedPDF === 'function' && analysisResults) {
            await exportDetailedPDF({
              centerName,
              memberName,
              sessionName,
              analysis: analysisResults,
              before: beforeData,
              after: postureData,
              charts: {
                overviewCanvas: document.getElementById('chart-overview') || 
                               document.querySelector('#comparisonChart') ||
                               null,
                sideChartCanvas: document.getElementById('chart-side') || null,
                frontChartCanvas: document.getElementById('chart-front') || null
              }
            });
          } else if (typeof window !== 'undefined' && typeof window.exportDetailedPDF === 'function' && analysisResults) {
            // 전역 exportDetailedPDF 함수 사용
            await window.exportDetailedPDF({
              centerName,
              memberName,
              sessionName,
              analysis: analysisResults,
              before: beforeData,
              after: postureData,
              charts: {
                overviewCanvas: document.getElementById('chart-overview') || 
                               document.querySelector('#comparisonChart') ||
                               null,
                sideChartCanvas: document.getElementById('chart-side') || null,
                frontChartCanvas: document.getElementById('chart-front') || null
              }
            });
          } else if (typeof window !== 'undefined' && typeof window.generatePosturePDF === 'function' && beforeData) {
            // 폴백: 기존 generatePosturePDF 함수 사용
            await window.generatePosturePDF(centerName, memberName, beforeData, postureData);
          } else {
            // 최종 폴백: 리포트 섹션을 캡처하여 PDF 생성
            const reportEl = document.querySelector('#report-section') || document.querySelector('.report-container');
            if (reportEl) {
              await exportPDF(sessionName, reportEl);
            } else {
              console.warn('⚠️ 리포트 섹션을 찾을 수 없어 PDF를 생성하지 않습니다.');
            }
          }
        } catch (pdfErr) {
          console.warn('⚠️ PDF 자동 생성 실패:', pdfErr);
        }
      }

      console.log('✅ AI 분석 + 저장 완료');
      return finalReport;
    } catch (err) {
      console.error('❌ AI 분석 실패:', err);
      throw err;
    }
  };

  /**
   * Before-After 비교 리포트 생성
   * @param {string} beforeSession - Before 세션 이름
   * @param {string} afterSession - After 세션 이름
   * @param {object} options - 옵션 {centerName, memberName, autoPDF}
   */
  const generateComparisonReport = async (beforeSession, afterSession, options = {}) => {
    const {
      centerName = '미입력',
      memberName = '회원',
      autoPDF = true
    } = options;

    const comparison = getBeforeAfterComparison(beforeSession, afterSession);
    if (!comparison) {
      throw new Error('Before 또는 After 리포트를 찾을 수 없습니다.');
    }

    // 전역 generatePosturePDF 함수 사용
    if (typeof window !== 'undefined' && typeof window.generatePosturePDF === 'function') {
      if (autoPDF) {
        await window.generatePosturePDF(
          centerName,
          memberName,
          comparison.before,
          comparison.after
        );
      }
      return {
        before: comparison.before,
        after: comparison.after,
        beforeReport: comparison.beforeReport,
        afterReport: comparison.afterReport
      };
    } else {
      throw new Error('PDF 생성 함수를 사용할 수 없습니다.');
    }
  };

  return {
    saveReport,
    loadReport,
    getAllReports,
    deleteReport,
    getBeforeAfterComparison,
    exportPDF,
    analyzeAndSave,
    generateComparisonReport,
    savePDFMobileCompatible
  };
})();

/**
 * 🧠 자세 분석 로직 (요약) - 폴백용
 * @param {object} data - 자세 측정 데이터
 * @returns {object} 분석 결과
 */
function analyzePostureData(data) {
  const result = {};
  const thresholds = {
    CVA: { high: 70, low: 50 },
    PTA: { high: 20, low: 10 },
    KA: { high: 185, low: 175 },
    HPD: { high: 2, low: 0 }
  };

  Object.entries(data).forEach(([key, value]) => {
    const threshold = thresholds[key] || { high: 20, low: 5 };
    if (value > threshold.high) {
      result[key] = '⚠ 과긴장';
    } else if (value < threshold.low) {
      result[key] = '약화';
    } else {
      result[key] = '정상';
    }
  });

  return result;
}

/**
 * 🧘 필라테스 추천 - 폴백용
 * @param {object} analysis - 분석 결과
 * @returns {array} 추천 운동 목록
 */
function recommendPilates(analysis) {
  const recommendations = [];
  
  if (analysis['CVA'] === '⚠ 과긴장') {
    recommendations.push('Swan, Neck Extension');
  }
  if (analysis['PTA'] === '⚠ 과긴장') {
    recommendations.push('Pelvic Curl, Bridge Series');
  }
  if (analysis['TIA'] === '약화') {
    recommendations.push('Roll Up, Spine Stretch Forward');
  }
  if (analysis['KA'] === '⚠ 과긴장' || analysis['KA'] === '약화') {
    recommendations.push('Leg Circles, Single Leg Stretch');
  }
  if (analysis['HPD'] === '⚠ 과긴장') {
    recommendations.push('Hundred, Roll Up');
  }

  return recommendations;
}

