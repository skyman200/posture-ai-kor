# 한글 폰트 설정 가이드

jsPDF에서 한글을 정상적으로 표시하려면 한글 폰트를 추가해야 합니다.

## 📋 단계별 가이드

### 1. 폰트 파일 다운로드

1. **Noto Sans CJK KR** 폰트 다운로드:
   - [Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+KR)에서 다운로드
   - 또는 [GitHub - googlefonts/noto-cjk](https://github.com/googlefonts/noto-cjk)에서 다운로드
   - `NotoSansCJKkr-Regular.ttf` 파일을 다운로드

2. 다운로드한 폰트 파일을 `js/fonts/` 디렉토리에 저장:
   ```
   js/fonts/NotoSansCJKkr-Regular.ttf
   ```

### 2. 폰트 파일을 Base64로 변환

#### 방법 1: Node.js 스크립트 사용 (권장)

```bash
# Node.js가 설치되어 있어야 합니다
cd js/fonts
node convertFont.js
```

`convertFont.js` 파일을 수정하여 실제 폰트 경로를 지정:

```javascript
// convertFont.js 파일 하단에 추가
const fontPath = './NotoSansCJKkr-Regular.ttf';
const base64 = convertFontToBase64(fontPath);
saveBase64ToJS(base64, './NotoSansCJKkr-Regular.js', 'NotoSansCJKkr_Regular');
```

#### 방법 2: 온라인 도구 사용

1. [Base64 Encoder](https://www.base64encode.org/) 같은 온라인 도구 사용
2. 폰트 파일을 업로드하여 Base64 문자열 생성
3. 생성된 Base64 문자열을 `NotoSansCJKkr-Regular.js` 파일에 저장:

```javascript
// NotoSansCJKkr-Regular.js
export const NotoSansCJKkr_Regular_Base64 = "여기에_Base64_문자열_붙여넣기";
```

### 3. 폰트 파일을 HTML에 로드

`index.html` 파일의 `<head>` 섹션에 폰트 파일을 로드하는 스크립트 추가:

```html
<script type="module">
  // 폰트 파일 import
  import { NotoSansCJKkr_Regular_Base64 } from './js/fonts/NotoSansCJKkr-Regular.js';
  
  // 전역 변수에 할당
  window.koreanFontBase64 = NotoSansCJKkr_Regular_Base64;
  window.koreanFontLoaded = true;
</script>
```

또는 인라인으로:

```html
<script>
  // 폰트 Base64 데이터 (변환된 파일에서 복사)
  window.koreanFontBase64 = "여기에_Base64_문자열";
  window.koreanFontLoaded = true;
</script>
```

### 4. PDF 생성 함수에서 폰트 사용

PDF 생성 함수에서 `loadKoreanFontForPDF()` 함수를 호출하면 자동으로 폰트가 적용됩니다:

```javascript
const pdf = new jsPDF('p', 'mm', 'a4');
await loadKoreanFontForPDF(pdf); // 한글 폰트 로드

// 한글 텍스트 추가
pdfAddKoreanText(pdf, '안녕하세요', 10, 10, { fontSize: 12 });
```

## 🔧 문제 해결

### 폰트가 로드되지 않는 경우

1. **콘솔 확인**: 브라우저 개발자 도구에서 에러 메시지 확인
2. **파일 경로 확인**: 폰트 파일 경로가 올바른지 확인
3. **Base64 형식 확인**: Base64 문자열이 올바르게 인코딩되었는지 확인

### 폰트 파일이 너무 큰 경우

- 폰트 파일이 크면 (일반적으로 2-5MB) 로딩 시간이 길어질 수 있습니다
- 서브셋 폰트를 사용하거나 필요한 글자만 포함하는 폰트를 생성하는 것을 고려하세요

## 📝 참고

- jsPDF는 기본적으로 한글을 지원하지 않으므로 폰트 추가가 필수입니다
- 폰트 파일은 라이선스를 확인하여 사용하세요 (Noto Sans는 Apache 2.0 라이선스)
- 프로덕션 환경에서는 CDN이나 서버에서 폰트를 제공하는 것을 고려하세요

