/**
 * jsPDF에 한글 폰트를 추가하는 유틸리티
 * 
 * 사용 방법:
 * 1. Noto Sans CJK KR 폰트를 Base64로 변환한 파일을 import
 * 2. setupKoreanFont() 함수를 호출하여 폰트를 jsPDF에 등록
 */

/**
 * jsPDF 인스턴스에 한글 폰트를 추가하고 설정
 * @param {object} pdf - jsPDF 인스턴스
 * @param {string} fontBase64 - Base64 인코딩된 폰트 데이터 (선택)
 * @param {string} fontName - 폰트 이름 (기본값: 'NotoSansCJKkr')
 * @returns {boolean} 폰트 추가 성공 여부
 */
export function setupKoreanFont(pdf, fontBase64 = null, fontName = 'NotoSansCJKkr') {
  try {
    // 폰트 데이터가 제공되지 않으면 기본 폰트 사용 (나중에 로드)
    if (!fontBase64) {
      console.warn('⚠️ 폰트 데이터가 제공되지 않았습니다. 폰트 파일을 먼저 로드하세요.');
      return false;
    }
    
    // 폰트 파일을 VFS에 추가
    const fontFileName = `${fontName}.ttf`;
    pdf.addFileToVFS(fontFileName, fontBase64);
    
    // 폰트 등록
    pdf.addFont(fontFileName, fontName, 'normal');
    pdf.addFont(fontFileName, fontName, 'bold');
    
    // 기본 폰트로 설정
    pdf.setFont(fontName, 'normal');
    
    console.log(`✅ 한글 폰트 추가 완료: ${fontName}`);
    return true;
  } catch (error) {
    console.error('❌ 한글 폰트 추가 실패:', error);
    return false;
  }
}

/**
 * 한글 텍스트를 PDF에 추가 (폰트 자동 설정)
 * @param {object} pdf - jsPDF 인스턴스
 * @param {string} text - 한글 텍스트
 * @param {number} x - X 좌표
 * @param {number} y - Y 좌표
 * @param {object} options - 옵션 (fontSize, fontStyle, align 등)
 */
export function pdfAddKoreanText(pdf, text, x, y, options = {}) {
  const {
    fontSize = 12,
    fontStyle = 'normal',
    align = 'left',
    fontName = 'NotoSansCJKkr'
  } = options;
  
  // 폰트 설정
  try {
    pdf.setFont(fontName, fontStyle);
    pdf.setFontSize(fontSize);
    
    // 텍스트 추가
    if (align === 'center' || align === 'right') {
      pdf.text(text, x, y, { align });
    } else {
      pdf.text(text, x, y);
    }
  } catch (error) {
    // 폰트가 없으면 기본 폰트로 폴백
    console.warn('⚠️ 한글 폰트 사용 실패, 기본 폰트 사용:', error);
    pdf.setFont('helvetica', fontStyle);
    pdf.setFontSize(fontSize);
    pdf.text(text, x, y);
  }
}

// CommonJS 형식도 지원
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupKoreanFont, pdfAddKoreanText };
}

