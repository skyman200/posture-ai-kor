// src/ai/reportPdf.js
// jsPDF만 사용 (모바일 저장 호환) – html2canvas 없이 캔버스/이미지 직접 삽입도 가능

/**
 * pdfMake docDefinition 안에서 { pageBreak: 'after' } 같은 애들 다 잡아서 안전하게 바꿔주는 함수
 * @param {any} node - pdfMake docDefinition 또는 그 일부
 */
function sanitizePdfDoc(node) {
  if (!node) return;

  // 배열이면 내부 요소들 재귀
  if (Array.isArray(node)) {
    node.forEach(sanitizePdfDoc);
    return;
  }

  // 객체가 아니면 패스
  if (typeof node !== 'object') return;

  // (1) { pageBreak: 'after' } 같은 순수 pageBreak 객체 → 더미 text 추가
  const keys = Object.keys(node);
  if (keys.length === 1 && keys[0] === 'pageBreak') {
    node.text = ' ';         // 여기서 한 줄짜리 공백 텍스트 넣어주면 pdfMake 인정함
    return;
  }

  // (2) content / stack / columns 재귀
  if (Array.isArray(node.content)) sanitizePdfDoc(node.content);
  if (Array.isArray(node.stack)) sanitizePdfDoc(node.stack);
  if (Array.isArray(node.columns)) sanitizePdfDoc(node.columns);

  // (3) table.body (2차원 배열) 재귀
  if (node.table && Array.isArray(node.table.body)) {
    node.table.body.forEach(row => sanitizePdfDoc(row));
  }

  // (4) header/footer 안에 content가 배열로 있을 수도 있음
  if (Array.isArray(node.header)) sanitizePdfDoc(node.header);
  if (Array.isArray(node.footer)) sanitizePdfDoc(node.footer);
}

// 전역으로도 노출 (index.html 등에서 사용 가능)
if (typeof window !== 'undefined') {
  window.sanitizePdfDoc = sanitizePdfDoc;
}

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
 * 사용자 정보 입력 받기 (고객이름, 센터이름, 담당선생님)
 */
async function getUserInfo() {
  return new Promise((resolve) => {
    // 기존 값 가져오기
    const savedMemberName = localStorage.getItem('memberName') || '';
    const savedCenterName = localStorage.getItem('centerName') || '';
    const savedTeacherName = localStorage.getItem('teacherName') || '';

    // 모달 스타일 입력창 생성
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(11, 15, 20, 0.8);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', 'Nanum Gothic', 'Noto Sans KR', sans-serif;
    `;

    const form = document.createElement('div');
    form.style.cssText = `
      background: linear-gradient(135deg, rgba(30, 34, 42, 0.95) 0%, rgba(20, 24, 32, 0.95) 100%);
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(124, 156, 255, 0.3);
    `;

    form.innerHTML = `
      <h2 style="color: #7c9cff; font-size: 24px; font-weight: 800; margin: 0 0 30px 0; text-align: center;">
        📋 PDF 리포트 정보 입력
      </h2>
      <div style="margin-bottom: 20px;">
        <label style="display: block; color: #e7eef7; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
          👤 고객 이름 <span style="color: #ffb86c;">*</span>
        </label>
        <input type="text" id="memberName" value="${savedMemberName}" 
          style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(124, 156, 255, 0.3);
          background: rgba(11, 15, 20, 0.6); color: #e7eef7; font-size: 14px; box-sizing: border-box;"
          placeholder="고객 이름을 입력하세요">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; color: #e7eef7; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
          🏢 센터 이름 <span style="color: #ffb86c;">*</span>
        </label>
        <input type="text" id="centerName" value="${savedCenterName}" 
          style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(124, 156, 255, 0.3);
          background: rgba(11, 15, 20, 0.6); color: #e7eef7; font-size: 14px; box-sizing: border-box;"
          placeholder="센터 이름을 입력하세요">
      </div>
      <div style="margin-bottom: 30px;">
        <label style="display: block; color: #e7eef7; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
          👨‍🏫 담당 선생님
        </label>
        <input type="text" id="teacherName" value="${savedTeacherName}" 
          style="width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(124, 156, 255, 0.3);
          background: rgba(11, 15, 20, 0.6); color: #e7eef7; font-size: 14px; box-sizing: border-box;"
          placeholder="담당 선생님 이름을 입력하세요 (선택)">
      </div>
      <div style="display: flex; gap: 12px;">
        <button id="cancelBtn" style="flex: 1; padding: 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05); color: #e7eef7; font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s;">
          취소
        </button>
        <button id="confirmBtn" style="flex: 1; padding: 14px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #7c9cff 0%, #5a7fff 100%); color: white; font-size: 14px; font-weight: 700;
          cursor: pointer; box-shadow: 0 4px 15px rgba(124, 156, 255, 0.4); transition: all 0.2s;">
          생성하기 ✨
        </button>
      </div>
    `;

    modal.appendChild(form);
    document.body.appendChild(modal);

    const memberInput = form.querySelector('#memberName');
    const centerInput = form.querySelector('#centerName');
    const teacherInput = form.querySelector('#teacherName');
    const confirmBtn = form.querySelector('#confirmBtn');
    const cancelBtn = form.querySelector('#cancelBtn');

    // 포커스
    memberInput.focus();

    // 버튼 호버 효과
    confirmBtn.onmouseenter = () => {
      confirmBtn.style.transform = 'translateY(-2px)';
      confirmBtn.style.boxShadow = '0 6px 20px rgba(124, 156, 255, 0.6)';
    };
    confirmBtn.onmouseleave = () => {
      confirmBtn.style.transform = 'translateY(0)';
      confirmBtn.style.boxShadow = '0 4px 15px rgba(124, 156, 255, 0.4)';
    };

    cancelBtn.onmouseenter = () => {
      cancelBtn.style.background = 'rgba(255,255,255,0.1)';
    };
    cancelBtn.onmouseleave = () => {
      cancelBtn.style.background = 'rgba(255,255,255,0.05)';
    };

    // 확인 버튼
    const handleConfirm = () => {
      const memberName = memberInput.value.trim();
      const centerName = centerInput.value.trim();
      const teacherName = teacherInput.value.trim();

      if (!memberName || !centerName) {
        alert('⚠️ 고객 이름과 센터 이름은 필수입니다.');
        return;
      }

      // localStorage에 저장
      localStorage.setItem('memberName', memberName);
      localStorage.setItem('centerName', centerName);
      if (teacherName) {
        localStorage.setItem('teacherName', teacherName);
      }

      document.body.removeChild(modal);
      resolve({ memberName, centerName, teacherName });
    };

    confirmBtn.onclick = handleConfirm;
    cancelBtn.onclick = () => {
      document.body.removeChild(modal);
      resolve(null);
    };

    // Enter 키 처리
    [memberInput, centerInput, teacherInput].forEach(input => {
      input.onkeypress = (e) => {
        if (e.key === 'Enter') {
          handleConfirm();
        }
      };
    });
  });
}

/**
 * 상세 PDF 리포트 생성 (앱 디자인 스타일 적용)
 * @param {object} options - 리포트 옵션
 * @param {string} options.centerName - 센터명 (선택, 없으면 입력받음)
 * @param {string} options.memberName - 회원명 (선택, 없으면 입력받음)
 * @param {string} options.sessionName - 세션명
 * @param {string} options.teacherName - 담당 선생님 (선택)
 * @param {object} options.analysis - analyzeWithDB() 결과
 * @param {object} options.before - Before 측정값 (선택)
 * @param {object} options.after - After 측정값 (선택)
 * @param {object} options.charts - 차트 캔버스 객체 (선택)
 *   - overviewCanvas: Before-After 비교 그래프
 *   - sideChartCanvas: 측면 지표 그래프
 *   - frontChartCanvas: 정면 지표 그래프
 * @param {object} options.images - 이미지 데이터 (선택)
 *   - sideBeforeImg: 측면 Before 이미지 (data URL)
 *   - sideAfterImg: 측면 After 이미지 (data URL)
 *   - sideOverlayImg: 측면 오버레이 이미지 (data URL)
 *   - frontBeforeImg: 정면 Before 이미지 (data URL)
 *   - frontAfterImg: 정면 After 이미지 (data URL)
 *   - frontOverlayImg: 정면 오버레이 이미지 (data URL)
 *   - sideSkeletonImg: 측면 스켈레톤 이미지 (data URL)
 *   - frontSkeletonImg: 정면 스켈레톤 이미지 (data URL)
 */
export async function exportDetailedPDF({ 
  centerName, 
  memberName, 
  sessionName,
  teacherName,
  analysis,         // analyzeWithDB(measured) 결과
  before,           // before 원시값(객체) – 그래프/표에 사용
  after,            // after 원시값(객체) – 그래프/표에 사용
  charts = {},      // { sideChartCanvas, frontChartCanvas, overviewCanvas } 옵션
  images = {}       // 이미지 데이터
}) {
  // 사용자 정보 입력 받기 (없으면)
  let finalMemberName = memberName;
  let finalCenterName = centerName;
  let finalTeacherName = teacherName;

  if (!finalMemberName || !finalCenterName) {
    const userInfo = await getUserInfo();
    if (!userInfo) {
      console.log('PDF 생성이 취소되었습니다.');
      return;
    }
    finalMemberName = userInfo.memberName;
    finalCenterName = userInfo.centerName;
    finalTeacherName = userInfo.teacherName || finalTeacherName;
  }
  // jsPDF 확인
  if (typeof window === 'undefined' || !window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('jsPDF가 로드되지 않았습니다.');
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // 한글 폰트 로드 시도 (전역 함수 사용)
  if (typeof loadKoreanFontForPDF === 'function') {
    await loadKoreanFontForPDF(pdf);
  }
  
  // 폰트가 로드되지 않았으면 기본 폰트 사용
  if (typeof window.koreanFontLoaded === 'undefined' || !window.koreanFontLoaded) {
    pdf.setFont('helvetica', 'normal');
  }

  // 이미지 데이터 가져오기 (옵션 또는 전역 변수에서)
  const sideBeforeImg = images.sideBeforeImg || window.sideBeforeImg || null;
  const sideAfterImg = images.sideAfterImg || window.sideAfterImg || null;
  const sideOverlayImg = images.sideOverlayImg || window.sideOverlayImg || null;
  const frontBeforeImg = images.frontBeforeImg || window.frontBeforeImg || null;
  const frontAfterImg = images.frontAfterImg || window.frontAfterImg || null;
  const frontOverlayImg = images.frontOverlayImg || window.frontOverlayImg || null;
  const sideSkeletonImg = images.sideSkeletonImg || null;
  const frontSkeletonImg = images.frontSkeletonImg || null;

  // 색상 텍스트 추가 헬퍼 함수 (이모지 + 색상 지원)
  const addColoredText = (text, x, y, color, options = {}) => {
    const { fontSize = 12, fontStyle = 'normal', align = 'left' } = options;
    pdf.setTextColor(color[0], color[1], color[2]);
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    
    // 중앙 정렬일 때 x 좌표 조정
    let finalX = x;
    if (align === 'center') {
      finalX = 105; // A4 가로 중앙 (210mm / 2)
    } else if (align === 'right') {
      finalX = 196; // 오른쪽 정렬
    }
    
    if (typeof window.pdfAddKoreanText === 'function') {
      window.pdfAddKoreanText(pdf, text, finalX, y, { fontSize, fontStyle, align });
    } else {
      if (align === 'center' || align === 'right') {
        pdf.text(text, finalX, y, { align });
      } else {
        pdf.text(text, finalX, y);
      }
    }
  };

  // 한글 텍스트 추가 헬퍼 함수 (전역 함수 사용)
  const addKoreanText = (text, x, y, options = {}) => {
    if (typeof window.pdfAddKoreanText === 'function') {
      window.pdfAddKoreanText(pdf, text, x, y, options);
    } else {
      pdf.text(text, x, y);
    }
  };

  // 이미지 추가 헬퍼 함수 (안전하게)
  const addImageSafe = (imgData, x, y, width, height, label = '') => {
    if (!imgData || imgData === 'data:,') return false;
    try {
      pdf.addImage(imgData, 'PNG', x, y, width, height);
      return true;
    } catch (err) {
      console.warn(`이미지 추가 실패 (${label}):`, err);
      return false;
    }
  };

  // 카드 스타일 박스 그리기
  const drawCard = (x, y, width, height, title = '') => {
    // 배경 (연한 회색)
    pdf.setFillColor(250, 251, 255);
    pdf.roundedRect(x, y, width, height, 3, 3, 'F');
    
    // 테두리
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, y, width, height, 3, 3, 'D');
    
    // 제목이 있으면 추가
    if (title) {
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      addKoreanText(title, x + 2, y + 5, { fontSize: 12, fontStyle: 'bold' });
    }
  };

  // 섹션 헤더 (이모지 + 색상)
  const drawSectionHeader = (title, y) => {
    // 배경 박스
    pdf.setFillColor(124, 156, 255, 0.1);
    pdf.roundedRect(14, y - 4, 182, 8, 2, 2, 'F');
    
    pdf.setFontSize(18);
    addColoredText(title, 14, y, [124, 156, 255], { fontSize: 18, fontStyle: 'bold' });
    
    // 액센트 라인
    pdf.setDrawColor(124, 156, 255);
    pdf.setLineWidth(1);
    pdf.line(14, y + 3, 196, y + 3);
    
    // 하단 그림자
    pdf.setFillColor(124, 156, 255, 0.05);
    pdf.rect(14, y + 4, 182, 1, 'F');
    
    return y + 8;
  };

  // 공통 헤더 함수 (개선된 디자인 - 이모지 + 색상)
  const header = (title) => {
    // 상단 그라데이션 효과 (어둡게)
    pdf.setFillColor(11, 15, 20); // --bg: #0b0f14
    pdf.rect(0, 0, 210, 35, 'F');
    
    // 액센트 바 (상단)
    pdf.setFillColor(124, 156, 255); // --accent: #7c9cff
    pdf.rect(0, 0, 210, 3, 'F');
    
    // 제목 (이모지 + 색상)
    pdf.setFontSize(22);
    addColoredText(title, 14, 20, [124, 156, 255], { fontSize: 22, fontStyle: 'bold' });
    
    // 정보 박스 (그라데이션 효과 시뮬레이션)
    pdf.setFillColor(30, 34, 42); // --panel: rgba(30, 34, 42, 0.7)
    pdf.roundedRect(14, 25, 182, 22, 3, 3, 'F');
    
    // 정보 텍스트 (색상 적용)
    pdf.setFontSize(10);
    addColoredText(`🏢 센터: ${finalCenterName || '-'}`, 16, 31, [231, 238, 247], { fontSize: 10 });
    addColoredText(`👤 회원: ${finalMemberName || '-'}`, 16, 36, [231, 238, 247], { fontSize: 10 });
    
    if (finalTeacherName) {
      addColoredText(`👨‍🏫 담당: ${finalTeacherName}`, 110, 31, [255, 184, 108], { fontSize: 10 });
    }
    addColoredText(`📅 세션: ${sessionName || '-'}`, 110, 36, [231, 238, 247], { fontSize: 10 });
    
    const dateStr = new Date().toLocaleString('ko-KR');
    addColoredText(`🕐 생성: ${dateStr}`, 14, 42, [155, 163, 175], { fontSize: 9 });
    
    // 구분선 (그라데이션 효과)
    pdf.setDrawColor(124, 156, 255);
    pdf.setLineWidth(0.5);
    pdf.line(14, 48, 196, 48);
    
    // 하단 그림자 효과
    pdf.setFillColor(0, 0, 0, 0.1);
    pdf.rect(14, 49, 182, 1, 'F');
  };

  // 페이지 1 — 커버 페이지 (이미지 포함)
  header('📋 AI 자세 분석 보고서');
  let y = 55;
  
  // 환영 메시지 (고객 맞춤)
  pdf.setFontSize(14);
  addColoredText(`✨ ${finalMemberName}님의 자세 분석 리포트에 오신 것을 환영합니다! ✨`, 14, y, [124, 156, 255], { fontSize: 14, align: 'center' });
  y += 8;
  
  // 서브 타이틀
  pdf.setFontSize(11);
  addColoredText('이 리포트는 AI 기반 자세 분석과 전문가 추천 운동을 포함합니다.', 14, y, [155, 163, 175], { fontSize: 11 });
  y += 10;

  // Before/After 이미지 섹션
  const hasBeforeAfter = sideBeforeImg || sideAfterImg || frontBeforeImg || frontAfterImg;
  if (hasBeforeAfter) {
    y = drawSectionHeader('📸 Before / After 비교', y);
    y += 2;
    
    // 측면 이미지
    if (sideBeforeImg || sideAfterImg) {
      drawCard(14, y, 182, 60, '측면 (Side View)');
      y += 8;
      
      if (sideBeforeImg) {
        addImageSafe(sideBeforeImg, 16, y, 85, 50, '측면 Before');
        pdf.setFontSize(9);
        addColoredText('🔵 Before', 16 + 42.5, y + 52, [59, 130, 246], { fontSize: 9, align: 'center' });
      }
      
      if (sideAfterImg) {
        addImageSafe(sideAfterImg, 111, y, 85, 50, '측면 After');
        pdf.setFontSize(9);
        addColoredText('🟠 After', 111 + 42.5, y + 52, [230, 126, 34], { fontSize: 9, align: 'center' });
      }
      
      y += 65;
    }
    
    // 정면 이미지
    if (frontBeforeImg || frontAfterImg) {
      drawCard(14, y, 182, 60, '정면 (Front View)');
      y += 8;
      
      if (frontBeforeImg) {
        addImageSafe(frontBeforeImg, 16, y, 85, 50, '정면 Before');
        pdf.setFontSize(9);
        addColoredText('🔵 Before', 16 + 42.5, y + 52, [59, 130, 246], { fontSize: 9, align: 'center' });
      }
      
      if (frontAfterImg) {
        addImageSafe(frontAfterImg, 111, y, 85, 50, '정면 After');
        pdf.setFontSize(9);
        addColoredText('🟠 After', 111 + 42.5, y + 52, [230, 126, 34], { fontSize: 9, align: 'center' });
      }
      
      y += 65;
    }
    
    // 페이지 넘김 체크
    if (y > 250) {
      pdf.addPage();
      header('📋 AI 자세 분석 보고서 (계속)');
      y = 52;
    }
  }

  // 오버레이 이미지 섹션
  if (sideOverlayImg || frontOverlayImg) {
    y = drawSectionHeader('🔄 Before-After 오버레이 (변화 시각화)', y);
    
    if (sideOverlayImg) {
      drawCard(14, y, 182, 70, '측면 오버레이');
      y += 8;
      addImageSafe(sideOverlayImg, 16, y, 178, 60, '측면 오버레이');
      pdf.setFontSize(9);
      addColoredText('🔵 파란색(Before) | 🟠 주황색(After)', 16, y + 62, [102, 102, 102], { fontSize: 9 });
      y += 75;
    }
    
    if (frontOverlayImg) {
      if (y > 240) {
        pdf.addPage();
        header('📋 AI 자세 분석 보고서 (계속)');
        y = 52;
      }
      drawCard(14, y, 182, 70, '정면 오버레이');
      y += 8;
      addImageSafe(frontOverlayImg, 16, y, 178, 60, '정면 오버레이');
      pdf.setFontSize(9);
      addColoredText('🔵 파란색(Before) | 🟠 주황색(After)', 16, y + 62, [102, 102, 102], { fontSize: 9 });
      y += 75;
    }
  }

  // 스켈레톤 이미지 섹션
  if (sideSkeletonImg || frontSkeletonImg) {
    if (y > 240) {
      pdf.addPage();
      header('📋 AI 자세 분석 보고서 (계속)');
      y = 52;
    }
    
    y = drawSectionHeader('📐 포즈 분석 오버레이 (스켈레톤)', y);
    
    if (sideSkeletonImg) {
      drawCard(14, y, 182, 70, '측면 스켈레톤');
      y += 8;
      addImageSafe(sideSkeletonImg, 16, y, 178, 60, '측면 스켈레톤');
      pdf.setFontSize(9);
      addColoredText('🔵 파란색 점선(Before) | 🟠 주황색 실선(After)', 16, y + 62, [102, 102, 102], { fontSize: 9 });
      y += 75;
    }
    
    if (frontSkeletonImg) {
      if (y > 240) {
        pdf.addPage();
        header('📋 AI 자세 분석 보고서 (계속)');
        y = 52;
      }
      drawCard(14, y, 182, 70, '정면 스켈레톤');
      y += 8;
      addImageSafe(frontSkeletonImg, 16, y, 178, 60, '정면 스켈레톤');
      pdf.setFontSize(9);
      addColoredText('🔵 파란색 점선(Before) | 🟠 주황색 실선(After)', 16, y + 62, [102, 102, 102], { fontSize: 9 });
      y += 75;
    }
  }

  // 페이지 2 — 종합 요약
  pdf.addPage();
  header('① 종합 요약');
  y = 52;
  
  pdf.setFontSize(12);
  pdf.setTextColor(15, 23, 42);

  if (analysis.sections && analysis.sections.length > 0) {
    analysis.sections.forEach((sec, idx) => {
      const sectionName = sec.section === 'side' ? '측면' : 
                          sec.section === 'front' ? '정면' : 
                          sec.section || '기타';
      
      // 카드 스타일로 섹션 표시
      const summaryLines = sec.summary ? pdf.splitTextToSize(sec.summary, 178) : [];
      const cardHeight = 25 + 6 * summaryLines.length;
      drawCard(14, y, 182, cardHeight, '');
      pdf.setFontSize(12);
      const emoji = sectionName === '측면' ? '📐' : sectionName === '정면' ? '📷' : '📊';
      addColoredText(`${emoji} ${sectionName}`, 16, y + 6, [124, 156, 255], { fontSize: 12, fontStyle: 'bold' });
      
      if (sec.summary) {
        pdf.setFontSize(10);
        addColoredText(sec.summary, 18, y + 12, [15, 23, 42], { fontSize: 10 });
        y += 12 + 6 * summaryLines.length;
      } else {
        y += 20;
      }
      
      y += 4; // 간격
      
      if (y > 250) { 
        pdf.addPage(); 
        header('① 종합 요약 (계속)'); 
        y = 52; 
      }
    });
  } else {
    drawCard(14, y, 182, 20, '');
    pdf.setFontSize(11);
    pdf.setTextColor(102, 102, 102);
    addKoreanText('분석 결과가 없습니다.', 18, y + 8, { fontSize: 11 });
    y += 25;
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
  header('⑤ 지표별 상세 해석');
  y = 52;
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);

  if (analysis.results && analysis.results.length > 0) {
    for (const r of analysis.results) {
      const secTag = r.section === 'side' ? '[측면]' : 
                     (r.section === 'front' ? '[정면]' : '[기타]');
      
      // 카드 스타일로 각 지표 표시
      const cardHeight = 40 + (r.pattern ? 15 : 0) + (r.tight?.length ? 15 : 0) + 
                         (r.weak?.length ? 15 : 0) + (r.exerciseGuide ? 15 : 0) + 
                         (r.pilates?.length ? 20 * r.pilates.length : 0);
      
      const statusEmoji = r.status === '정상' ? '✅' : r.status === '주의' ? '⚠️' : r.status === '위험' ? '🔴' : '📊';
      drawCard(14, y, 182, cardHeight, `${statusEmoji} ${secTag} ${r.name}`);
      
      pdf.setFontSize(10);
      const statusColor = r.status === '정상' ? [46, 204, 113] : 
                         r.status === '주의' ? [255, 184, 108] : 
                         r.status === '위험' ? [231, 76, 60] : [100, 100, 100];
      
      const line1 = `📏 ${r.metric}  →  ${r.value}${r.unit} | 정상:${r.normalText || '-'} | 상태:${r.status}`;
      const line1Wrapped = pdf.splitTextToSize(line1, 178);
      addColoredText(line1Wrapped, 16, y + 12, [15, 23, 42], { fontSize: 10 });
      y += 8 + 5 * line1Wrapped.length;

      if (r.pattern) {
        pdf.setFontSize(9);
        const patternWrapped = pdf.splitTextToSize(`🔍 패턴: ${r.pattern}`, 178);
        addColoredText(patternWrapped, 16, y, [71, 85, 105], { fontSize: 9 });
        y += 5 * patternWrapped.length;
      }

      if (r.tight && r.tight.length > 0) {
        const tightText = Array.isArray(r.tight) ? r.tight.join(', ') : r.tight;
        pdf.setFontSize(9);
        const tightWrapped = pdf.splitTextToSize(`🔴 긴장근: ${tightText}`, 178);
        addColoredText(tightWrapped, 16, y, [230, 38, 0], { fontSize: 9 });
        y += 5 * tightWrapped.length;
      }

      if (r.weak && r.weak.length > 0) {
        const weakText = Array.isArray(r.weak) ? r.weak.join(', ') : r.weak;
        pdf.setFontSize(9);
        const weakWrapped = pdf.splitTextToSize(`🔵 약화근: ${weakText}`, 178);
        addColoredText(weakWrapped, 16, y, [59, 130, 246], { fontSize: 9 });
        y += 5 * weakWrapped.length;
      }

      if (r.exerciseGuide) {
        pdf.setFontSize(9);
        const guideWrapped = pdf.splitTextToSize(`💡 가이드: ${r.exerciseGuide}`, 178);
        addColoredText(guideWrapped, 16, y, [15, 23, 42], { fontSize: 9 });
        y += 5 * guideWrapped.length;
      }

      if (r.pilates && r.pilates.length > 0) {
        pdf.setFontSize(10);
        addColoredText('🧘 필라테스 추천:', 16, y, [124, 156, 255], { fontSize: 10, fontStyle: 'bold' });
        y += 6;
        
        r.pilates.forEach(p => {
          pdf.setFontSize(8);
          const pText = `  ✨ ${p.equipment || ''}: ${p.name || ''}${p.purpose ? ` (${p.purpose})` : ''}`;
          const pWrapped = pdf.splitTextToSize(pText, 176);
          addColoredText(pWrapped, 18, y, [71, 85, 105], { fontSize: 8 });
          y += 4 * pWrapped.length;
        });
      }

      y += 6; // 항목 간 간격

      if (y > 250) { 
        pdf.addPage(); 
        header('⑤ 지표별 상세 해석 (계속)'); 
        y = 52; 
      }
    }
  } else {
    drawCard(14, y, 182, 20, '');
    pdf.setFontSize(11);
    pdf.setTextColor(102, 102, 102);
    addKoreanText('분석 결과가 없습니다.', 18, y + 8, { fontSize: 11 });
  }

  // 페이지 마지막 — 종합 근육/운동 묶음
  pdf.addPage();
  header('⑥ 종합 근육/운동 요약');
  y = 52;

  // 긴장된 근육
  drawCard(14, y, 182, 30, '🔴 긴장된 근육 (통합)');
  const tightAllText = (analysis.tightAll && analysis.tightAll.length > 0) 
    ? analysis.tightAll.join(', ') 
    : '없음';
  pdf.setFontSize(10);
  const tightWrapped = pdf.splitTextToSize(tightAllText, 178);
  addColoredText(tightWrapped, 16, y + 12, [230, 38, 0], { fontSize: 10 });
  y += 35 + 5 * tightWrapped.length;

  // 약화된 근육
  drawCard(14, y, 182, 30, '🔵 약화된 근육 (통합)');
  const weakAllText = (analysis.weakAll && analysis.weakAll.length > 0)
    ? analysis.weakAll.join(', ')
    : '없음';
  pdf.setFontSize(10);
  const weakWrapped = pdf.splitTextToSize(weakAllText, 178);
  addColoredText(weakWrapped, 16, y + 12, [59, 130, 246], { fontSize: 10 });
  y += 35 + 5 * weakWrapped.length;

  // 필라테스 세션
  if (y > 240) {
    pdf.addPage();
    header('⑥ 종합 근육/운동 요약 (계속)');
    y = 52;
  }
  
  drawCard(14, y, 182, 30, '🧘 필라테스 세션 (통합)');
  y += 12;

  if (analysis.pilatesAll && analysis.pilatesAll.length > 0) {
    pdf.setFontSize(9);
    analysis.pilatesAll.forEach(p => {
      const pText = `✨ ${p.equipment || ''}: ${p.name || ''}${p.purpose ? ` (${p.purpose})` : ''}`;
      const pWrapped = pdf.splitTextToSize(pText, 178);
      addColoredText(pWrapped, 16, y, [15, 23, 42], { fontSize: 9 });
      y += 5 * pWrapped.length;
      
      if (y > 250) { 
        pdf.addPage(); 
        header('⑥ 종합 근육/운동 요약 (계속)'); 
        y = 52; 
      }
    });
  } else {
    pdf.setFontSize(10);
    addColoredText('추천 세션이 없습니다.', 16, y, [102, 102, 102], { fontSize: 10 });
  }
  
  // 마지막 페이지에 감사 메시지
  pdf.addPage();
  header('💝 감사합니다');
  y = 80;
  
  pdf.setFontSize(16);
  addColoredText(`🙏 ${finalMemberName}님,`, 14, y, [124, 156, 255], { fontSize: 16, fontStyle: 'bold', align: 'center' });
  y += 10;
  
  pdf.setFontSize(12);
  addColoredText('이 리포트가 건강한 자세 개선에 도움이 되기를 바랍니다.', 14, y, [71, 85, 105], { fontSize: 12, align: 'center' });
  y += 15;
  
  pdf.setFontSize(11);
  addColoredText('💪 꾸준한 운동과 올바른 자세로 더 건강한 몸을 만들어가세요!', 14, y, [124, 156, 255], { fontSize: 11, align: 'center' });
  y += 20;
  
  if (finalTeacherName) {
    pdf.setFontSize(10);
    addColoredText(`담당: ${finalTeacherName} 선생님`, 14, y, [255, 184, 108], { fontSize: 10, align: 'center' });
    y += 8;
  }
  
  pdf.setFontSize(9);
  addColoredText(`${finalCenterName}에서 제공`, 14, y, [155, 163, 175], { fontSize: 9, align: 'center' });

  // 저장 (모바일 호환)
  const fileName = `${finalMemberName || 'member'}_${sessionName || 'session'}_AI_Posture_Report.pdf`;
  await savePDFMobileCompatible(fileName, pdf);
  
  console.log(`✅ 상세 PDF 리포트 생성 완료: ${fileName}`);
  console.log(`📋 고객: ${finalMemberName}, 센터: ${finalCenterName}, 담당: ${finalTeacherName || '없음'}`);
}

/**
 * 완전체 PDF 생성기 (웹앱 구조 100% 반영)
 * - 1페이지: 측면 전후 + 오버레이
 * - 2페이지: 정면 전후 + 오버레이
 * - 3페이지 이후: 모든 분석 패널 자동 캡쳐
 * - OCR 포함 (텍스트 검색 가능)
 * - 진행률 표시
 */
export async function saveFullPDF() {
  // 진행률 UI 생성/확인
  let progressBox = document.getElementById("pdfProgress");
  if (!progressBox) {
    progressBox = document.createElement("div");
    progressBox.id = "pdfProgress";
    progressBox.style.cssText = `
      position: fixed;
      bottom: 20px; left: 20px;
      background: rgba(0,0,0,0.85);
      color: #fff;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      display: none;
      z-index: 99999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      border: 1px solid rgba(124,156,255,0.3);
    `;
    document.body.appendChild(progressBox);
  }

  const update = (p) => {
    progressBox.style.display = "block";
    progressBox.innerText = `📄 PDF 저장 중... ${p}%`;
  };

  try {
    // html2canvas 확인
    if (typeof html2canvas === 'undefined') {
      throw new Error('html2canvas 라이브러리가 로드되지 않았습니다.');
    }

    // pdfMake 확인
    if (typeof pdfMake === 'undefined') {
      throw new Error('pdfMake 라이브러리가 로드되지 않았습니다.');
    }

    // Tesseract 확인 (선택적)
    const hasTesseract = typeof Tesseract !== 'undefined';

    // HTML → 이미지 캡쳐 함수
    const capture = async (selector, pctStart, pctEnd) => {
      update(pctStart);
      const el = document.querySelector(selector);
      if (!el || el.offsetParent === null) {
        // 요소가 없거나 display:none이면 skip
        update(pctEnd);
        return null;
      }

      try {
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#0b0f14',
          allowTaint: true
        });
        update(pctEnd);
        return canvas.toDataURL("image/png");
      } catch (err) {
        console.warn(`캡쳐 실패 (${selector}):`, err);
        update(pctEnd);
        return null;
      }
    };

    // PDF 문서 객체
    const doc = {
      pageSize: "A4",
      pageMargins: [20, 30, 20, 30],
      content: [],
      styles: {
        title: { 
          fontSize: 18, 
          bold: true, 
          margin: [0, 0, 0, 10],
          color: '#7c9cff'
        },
        subtitle: {
          fontSize: 14,
          margin: [0, 10, 0, 5],
          color: '#9bb0c7'
        }
      },
      defaultStyle: {
        fontSize: 11,
        color: '#e7eef7'
      }
    };

    // =====================================================
    // 📄 1페이지 — 측면 사진 (전후 + 오버레이)
    // =====================================================
    update(5);

    const sideBefore = window.sideBeforeImg || null;
    const sideAfter = window.sideAfterImg || null;
    const sideOverlay = window.sideOverlayImg || null;

    if (sideBefore || sideAfter || sideOverlay) {
      doc.content.push({
        text: '📐 측면 비교 (Side View)',
        style: 'title'
      });

      if (sideBefore || sideAfter) {
        const columns = [];
        if (sideBefore) {
          columns.push({ 
            image: sideBefore, 
            width: 85,
            margin: [0, 0, 5, 0]
          });
        }
        if (sideAfter) {
          columns.push({ 
            image: sideAfter, 
            width: 85,
            margin: [5, 0, 0, 0]
          });
        }
        if (columns.length > 0) {
          doc.content.push({ columns });
        }
      }

      if (sideOverlay) {
        doc.content.push({
          text: '🔄 측면 오버레이',
          style: 'subtitle'
        });
        doc.content.push({
          image: sideOverlay,
          width: 170,
          margin: [0, 5, 0, 10]
        });
      }

      doc.content.push({ text: ' ', pageBreak: 'after' });
    }

    update(25);

    // =====================================================
    // 📄 2페이지 — 정면 사진 (전후 + 오버레이)
    // =====================================================
    const frontBefore = window.frontBeforeImg || null;
    const frontAfter = window.frontAfterImg || null;
    const frontOverlay = window.frontOverlayImg || null;

    if (frontBefore || frontAfter || frontOverlay) {
      doc.content.push({
        text: '📷 정면 비교 (Front View)',
        style: 'title'
      });

      if (frontBefore || frontAfter) {
        const columns = [];
        if (frontBefore) {
          columns.push({ 
            image: frontBefore, 
            width: 85,
            margin: [0, 0, 5, 0]
          });
        }
        if (frontAfter) {
          columns.push({ 
            image: frontAfter, 
            width: 85,
            margin: [5, 0, 0, 0]
          });
        }
        if (columns.length > 0) {
          doc.content.push({ columns });
        }
      }

      if (frontOverlay) {
        doc.content.push({
          text: '🔄 정면 오버레이',
          style: 'subtitle'
        });
        doc.content.push({
          image: frontOverlay,
          width: 170,
          margin: [0, 5, 0, 10]
        });
      }

      doc.content.push({ text: ' ', pageBreak: 'after' });
    }

    update(45);

    // =====================================================
    // 📄 3페이지 이후 — 분석 패널 전체 자동 처리
    // =====================================================
    const panels = [
      '#report-box',
      '#liveAnalysisPanel',
      '#livePDS',
      '#livePatterns',
      '#musclePanel',
      '#muscleTight',
      '#muscleTightList',
      '#muscleWeak',
      '#muscleWeakList',
      '#aiCommentPanel',
      '#aiComment',
      '#postureTypeDesc',
      '#postureTypeContent',
      '#exercisePanel',
      '#exerciseList',
      '#pilatesPanel',
      '#pilatesList',
      '#pilatesExerciseModal',
      '#modalExerciseTitle',
      '#modalExerciseContent',
      '#conclusionPanel',
      '#conclusionContent',
      '#allMetricsPanel',
      '#allMetricsList',
      '#totalScore',
      '#scoreReason',
      '#pdsScore',
      '#pdsValue',
      '#currentSession',
      '#dispCva',
      '#dispPel',
      '#dispKnee',
      '#metricsDescPanel',
      '#metricsDescContent',
      '#pelvicDesc',
      '#coordEditPanel'
    ];

    let pct = 45;
    const pctPerPanel = 50 / panels.length; // 나머지 50%를 패널 수로 나눔

    for (let sel of panels) {
      const nextPct = Math.min(95, Math.floor(pct + pctPerPanel));
      const img = await capture(sel, pct, nextPct);
      
      if (!img) {
        pct = nextPct;
        continue;
      }

      // OCR 추출 (Tesseract가 있으면)
      let ocrText = '';
      if (hasTesseract) {
        try {
          update(nextPct);
          const ocr = await Tesseract.recognize(img, 'kor+eng', {
            logger: m => {
              if (m.status === 'recognizing text') {
                const prog = nextPct + Math.floor(m.progress * 2);
                update(Math.min(95, prog));
              }
            }
          });
          ocrText = ocr.data.text;
        } catch (ocrErr) {
          console.warn('OCR 실패:', ocrErr);
        }
      }

      // 이미지 추가
      doc.content.push({
        image: img,
        width: 170,
        margin: [0, 0, 0, 10],
        pageBreak: 'after'
      });

      // OCR 텍스트를 숨겨진 텍스트로 추가 (PDF 검색 가능하게)
      if (ocrText) {
        doc.content.push({
          text: ocrText,
          fontSize: 1,
          color: 'white',
          opacity: 0.0,
          absolutePosition: { x: -1000, y: -1000 }
        });
      }

      pct = nextPct;
    }

    // Before/After 비교 테이블 캡쳐 (있는 경우)
    const comparisonTable = document.querySelector('table');
    if (comparisonTable) {
      update(95);
      const tableImg = await capture('table', 95, 97);
      if (tableImg) {
        doc.content.push({
          text: '📊 Before/After 비교',
          style: 'title'
        });
        doc.content.push({
          image: tableImg,
          width: 170,
          margin: [0, 5, 0, 10],
          pageBreak: 'after'
        });
      }
    }

    // =====================================================
    // PDF 생성
    // =====================================================
    update(98);

    // pdfMake 폰트 준비 (index.html의 preparePdfMakeFonts 함수 사용)
    let vfs, fonts;
    if (typeof preparePdfMakeFonts === 'function') {
      const fontData = await preparePdfMakeFonts();
      vfs = fontData.vfs;
      fonts = fontData.fonts;
    } else {
      // 폰트 준비 함수가 없으면 기본 폰트 사용
      vfs = pdfMake.vfs || {};
      fonts = pdfMake.fonts || {};
    }
    pdfMake.fonts = fonts;
    pdfMake.vfs = vfs;

    // docDefinition 정화
    sanitizePdfDoc(doc);

    // PDF 생성 및 다운로드
    const fileName = `posture_full_report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdfMake.createPdf(doc).download(fileName);

    update(100);
    
    setTimeout(() => {
      progressBox.style.display = 'none';
    }, 1500);

    console.log('✅ 완전체 PDF 생성 완료:', fileName);

  } catch (err) {
    console.error('❌ PDF 생성 실패:', err);
    alert(`PDF 생성에 실패했습니다: ${err.message}`);
    progressBox.style.display = 'none';
  }
}

// 전역으로 노출
if (typeof window !== 'undefined') {
  window.saveFullPDF = saveFullPDF;
}


