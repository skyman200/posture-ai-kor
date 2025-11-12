/**
 * 폰트 파일을 Base64로 변환하는 유틸리티 스크립트
 * 
 * 사용 방법:
 * 1. Node.js 환경에서 실행: node convertFont.js
 * 2. 또는 브라우저에서 FileReader API 사용
 */

// Node.js 환경에서 사용
if (typeof require !== 'undefined') {
  const fs = require('fs');
  const path = require('path');
  
  /**
   * 폰트 파일을 Base64로 변환
   * @param {string} fontPath - 폰트 파일 경로
   * @returns {string} Base64 인코딩된 폰트 데이터
   */
  function convertFontToBase64(fontPath) {
    try {
      const fontData = fs.readFileSync(fontPath);
      const base64 = fontData.toString('base64');
      return base64;
    } catch (error) {
      console.error('폰트 파일 읽기 실패:', error);
      throw error;
    }
  }
  
  /**
   * Base64 데이터를 JavaScript 파일로 저장
   * @param {string} base64Data - Base64 인코딩된 폰트 데이터
   * @param {string} outputPath - 출력 파일 경로
   * @param {string} fontName - 폰트 이름 (변수명)
   */
  function saveBase64ToJS(base64Data, outputPath, fontName) {
    const jsContent = `// ${fontName} 폰트 Base64 데이터
// 이 파일은 자동 생성되었습니다.

export const ${fontName}_Base64 = "${base64Data}";

// CommonJS 형식도 지원
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ${fontName}_Base64 };
}
`;
    
    fs.writeFileSync(outputPath, jsContent, 'utf8');
    console.log(`✅ 폰트 파일 생성 완료: ${outputPath}`);
    console.log(`📦 Base64 데이터 크기: ${(base64Data.length / 1024).toFixed(2)} KB`);
  }
  
  // 사용 예시 (주석 처리)
  // const fontPath = './NotoSansCJKkr-Regular.ttf';
  // const base64 = convertFontToBase64(fontPath);
  // saveBase64ToJS(base64, './NotoSansCJKkr-Regular.js', 'NotoSansCJKkr_Regular');
  
  module.exports = { convertFontToBase64, saveBase64ToJS };
}

// 브라우저 환경에서 사용 (FileReader API)
if (typeof window !== 'undefined') {
  /**
   * 브라우저에서 폰트 파일을 Base64로 변환
   * @param {File} file - 폰트 파일 객체
   * @returns {Promise<string>} Base64 인코딩된 폰트 데이터
   */
  function convertFontToBase64Browser(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1]; // data:font/ttf;base64, 제거
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  window.convertFontToBase64Browser = convertFontToBase64Browser;
}

