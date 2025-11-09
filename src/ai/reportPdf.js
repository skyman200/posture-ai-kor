// src/ai/reportPdf.js
// jsPDF만 사용 (모바일 저장 호환) – html2canvas 없이 캔버스/이미지 직접 삽입도 가능

/**
 * 모바일 감지 함수
 */
function isMobileDevice() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
         (window.innerWidth <= 768 && 'ontouchstart' in window);
}

/**
 * 모바일 호환 PDF 저장
 * @param {string} fileName - 파일명
 * @param {object} pdfInstance - jsPDF 인스턴스
 */
async function savePDFMobileCompatible(fileName, pdfInstance) {
  try {
    // 모바일에서는 간단한 방식 우선 사용
    if (isMobileDevice()) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        pdfInstance.save(fileName);
        console.log('✅ PDF 저장 성공 (직접 save)');
        return;
      } catch (saveErr) {
        console.warn('⚠️ 직접 save 실패:', saveErr);
      }
    }
    
    // Blob 생성
    let blob;
    try {
      blob = pdfInstance.output('blob');
      if (!blob || blob.size === 0) {
        throw new Error('PDF Blob 생성 실패');
      }
    } catch (blobErr) {
      // 최종 폴백: data URI
      try {
        const dataUri = pdfInstance.output('datauristring');
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 1000);
        return;
      } catch (finalErr) {
        throw new Error('PDF 저장에 실패했습니다: ' + finalErr.message);
      }
    }
    
    // 다운로드 링크 사용
    const fileURL = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = fileURL;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    requestAnimationFrame(() => {
      try {
        link.click();
      } catch (e) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        link.dispatchEvent(clickEvent);
      }
    });
    
    setTimeout(() => {
      try {
        URL.revokeObjectURL(fileURL);
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      } catch (e) {
        console.warn('정리 중 오류:', e);
      }
    }, 3000);
    
  } catch (err) {
    console.error('❌ PDF 저장 실패:', err);
    alert('⚠️ PDF 저장 중 오류가 발생했습니다.\n페이지를 새로고침하고 다시 시도해주세요.');
  }
}

/**
 * 상세 PDF 리포트 생성
 * @param {object} options - 리포트 옵션
 * @param {string} options.centerName - 센터명
 * @param {string} options.memberName - 회원명
 * @param {string} options.sessionName - 세션명
 * @param {object} options.analysis - analyzeWithDB() 결과
 * @param {object} options.before - Before 측정값 (선택)
 * @param {object} options.after - After 측정값 (선택)
 * @param {object} options.charts - 차트 캔버스 객체 (선택)
 *   - overviewCanvas: Before-After 비교 그래프
 *   - sideChartCanvas: 측면 지표 그래프
 *   - frontChartCanvas: 정면 지표 그래프
 */
export async function exportDetailedPDF({ 
  centerName, 
  memberName, 
  sessionName,
  analysis,         // analyzeWithDB(measured) 결과
  before,           // before 원시값(객체) – 그래프/표에 사용
  after,            // after 원시값(객체) – 그래프/표에 사용
  charts = {}       // { sideChartCanvas, frontChartCanvas, overviewCanvas } 옵션
}) {
  // jsPDF 확인
  if (typeof window === 'undefined' || !window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('jsPDF가 로드되지 않았습니다.');
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  pdf.setFont('helvetica', 'normal');

  // 공통 헤더 함수
  const header = (title) => {
    pdf.setFontSize(18);
    pdf.text(title, 14, 18);
    pdf.setFontSize(11);
    pdf.text(`센터: ${centerName || '-'}`, 14, 26);
    pdf.text(`회원: ${memberName || '-'}`, 14, 31);
    pdf.text(`세션: ${sessionName || '-'}`, 14, 36);
    pdf.text(`생성: ${new Date().toLocaleString('ko-KR')}`, 14, 41);
    pdf.line(14, 44, 196, 44);
  };

  // 페이지 1 — 개요 + 섹션 요약
  header('AI 자세 분석 종합 리포트');
  let y = 52;
  
  pdf.setFontSize(12);
  pdf.text('① 종합 요약', 14, y); 
  y += 6;

  if (analysis.sections && analysis.sections.length > 0) {
    analysis.sections.forEach(sec => {
      const sectionName = sec.section === 'side' ? '측면' : 
                          sec.section === 'front' ? '정면' : 
                          sec.section || '기타';
      const summaryLines = pdf.splitTextToSize(`- ${sectionName}: ${sec.summary}`, 180);
      pdf.text(summaryLines, 18, y);
      y += 6 * summaryLines.length;
      
      if (y > 270) { 
        pdf.addPage(); 
        header('AI 자세 분석 종합 리포트'); 
        y = 52; 
      }
    });
  } else {
    pdf.text('- 분석 결과가 없습니다.', 18, y);
    y += 6;
  }

  // 그래프 추가 (옵션) – Before-After 비교, 사이드/프론트
  const addCanvas = (canvas, title) => {
    if (!canvas) return;
    
    try {
      // Chart.js 캔버스인 경우
      let imgData;
      if (canvas.toDataURL) {
        imgData = canvas.toDataURL('image/png', 1.0);
      } else if (canvas.chart && canvas.chart.canvas) {
        imgData = canvas.chart.canvas.toDataURL('image/png', 1.0);
      } else {
        return;
      }

      if (imgData && imgData !== 'data:,') {
        pdf.addPage();
        header(title);
        pdf.addImage(imgData, 'PNG', 14, 52, 182, 100);
      }
    } catch (err) {
      console.warn('그래프 추가 실패:', err);
    }
  };

  // Before-After 비교 그래프
  if (before && after && charts.overviewCanvas) {
    addCanvas(charts.overviewCanvas, '② Before–After 비교 그래프(개요)');
  }

  // 측면 그래프
  if (charts.sideChartCanvas) {
    addCanvas(charts.sideChartCanvas, '③ 측면(사이드) 지표 그래프');
  }

  // 정면 그래프
  if (charts.frontChartCanvas) {
    addCanvas(charts.frontChartCanvas, '④ 정면(프론트) 지표 그래프');
  }

  // 페이지 N — 지표별 상세(긴 설명 + 정상범위 + 근육/운동)
  pdf.addPage();
  header('⑤ 지표별 상세 해석(모든 내용 DB 기준)');
  y = 52;
  pdf.setFontSize(11);

  if (analysis.results && analysis.results.length > 0) {
    for (const r of analysis.results) {
      const secTag = r.section === 'side' ? '[측면]' : 
                     (r.section === 'front' ? '[정면]' : '[기타]');
      
      const line1 = `${secTag} ${r.name} (${r.metric})  →  ${r.value}${r.unit} | 정상:${r.normalText || '-'} | 상태:${r.status}`;
      const line1Wrapped = pdf.splitTextToSize(line1, 180);
      pdf.text(line1Wrapped, 14, y);
      y += 6 * line1Wrapped.length;

      if (r.pattern) {
        const patternWrapped = pdf.splitTextToSize(`• 패턴: ${r.pattern}`, 180);
        pdf.text(patternWrapped, 18, y);
        y += 6 * patternWrapped.length;
      }

      if (r.tight && r.tight.length > 0) {
        const tightText = Array.isArray(r.tight) ? r.tight.join(', ') : r.tight;
        const tightWrapped = pdf.splitTextToSize(`• 긴장근: ${tightText}`, 180);
        pdf.text(tightWrapped, 18, y);
        y += 6 * tightWrapped.length;
      }

      if (r.weak && r.weak.length > 0) {
        const weakText = Array.isArray(r.weak) ? r.weak.join(', ') : r.weak;
        const weakWrapped = pdf.splitTextToSize(`• 약화근: ${weakText}`, 180);
        pdf.text(weakWrapped, 18, y);
        y += 6 * weakWrapped.length;
      }

      if (r.exerciseGuide) {
        const guideWrapped = pdf.splitTextToSize(`• 가이드: ${r.exerciseGuide}`, 180);
        pdf.text(guideWrapped, 18, y);
        y += 6 * guideWrapped.length;
      }

      if (r.pilates && r.pilates.length > 0) {
        pdf.text('• 필라테스 추천:', 18, y);
        y += 6;
        
        r.pilates.forEach(p => {
          const pText = `  - ${p.equipment || ''}: ${p.name || ''}${p.purpose ? ` (${p.purpose})` : ''}`;
          const pWrapped = pdf.splitTextToSize(pText, 176);
          pdf.text(pWrapped, 22, y);
          y += 6 * pWrapped.length;
        });
      }

      y += 4; // 항목 간 간격

      if (y > 270) { 
        pdf.addPage(); 
        header('지표별 상세 해석(계속)'); 
        y = 52; 
      }
    }
  } else {
    pdf.text('분석 결과가 없습니다.', 14, y);
  }

  // 페이지 마지막 — 종합 근육/운동 묶음
  pdf.addPage();
  header('⑥ 종합 근육/운동 요약');
  y = 52;

  const tightAllText = (analysis.tightAll && analysis.tightAll.length > 0) 
    ? analysis.tightAll.join(', ') 
    : '-';
  const tightWrapped = pdf.splitTextToSize(`긴장된 근육(통합): ${tightAllText}`, 180);
  pdf.text(tightWrapped, 14, y);
  y += 6 * tightWrapped.length;

  const weakAllText = (analysis.weakAll && analysis.weakAll.length > 0)
    ? analysis.weakAll.join(', ')
    : '-';
  const weakWrapped = pdf.splitTextToSize(`약화된 근육(통합): ${weakAllText}`, 180);
  pdf.text(weakWrapped, 14, y);
  y += 6 * weakWrapped.length;

  pdf.text('필라테스 세션(통합):', 14, y);
  y += 6;

  if (analysis.pilatesAll && analysis.pilatesAll.length > 0) {
    analysis.pilatesAll.forEach(p => {
      const pText = `- ${p.equipment || ''}: ${p.name || ''}${p.purpose ? ` (${p.purpose})` : ''}`;
      const pWrapped = pdf.splitTextToSize(pText, 180);
      pdf.text(pWrapped, 18, y);
      y += 6 * pWrapped.length;
      
      if (y > 270) { 
        pdf.addPage(); 
        header('필라테스 세션(계속)'); 
        y = 52; 
      }
    });
  } else {
    pdf.text('- 추천 세션이 없습니다.', 18, y);
  }

  // 저장 (모바일 호환)
  const fileName = `${memberName || 'member'}_${sessionName || 'session'}_AI_Posture_Report.pdf`;
  await savePDFMobileCompatible(fileName, pdf);
  
  console.log(`✅ 상세 PDF 리포트 생성 완료: ${fileName}`);
}



