# 📄 PDF 리포트 생성 가이드

완전한 PDF 리포트 생성 시스템입니다. DB 기반 분석 결과를 HTML로 변환하고, html2canvas + jsPDF로 PDF를 생성합니다.

## ✨ 주요 기능

- ✅ `Posture_Muscle_DB_Full.json` / `Pilates_Exercise_DB_1000_v2.json` 기반 분석·추천
- ✅ 그래프, 오버레이 이미지, 텍스트를 HTML로 생성
- ✅ html2canvas + jsPDF로 페이지 자동 분할
- ✅ 모바일 호환: Blob + navigator.share 지원
- ✅ 교수님 확정 문구 포함: "우리는 걱정 대신 근거(데이터)로 움직입니다."

## 📦 필요한 패키지

```bash
npm install html2canvas jspdf --save
npm install --save-dev @types/html2canvas
```

## 🚀 빠른 시작

### 1. 기본 사용법

```typescript
import { generateReportHtml, ReportData } from "./utils/makeReportHtml";
import { renderElementToPdf } from "./utils/generatePdfReport";
import { analyzePostureWithDB } from "./utils/analyzePosture";

// 1. 측정 데이터
const measured = {
  CVA: 65.7,
  PTA: 18.0,
  // ... 기타 측정값
};

// 2. AI 분석
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

// 5. DOM에 추가
const container = document.createElement("div");
container.id = "report-container";
container.innerHTML = html;
container.style.position = "absolute";
container.style.left = "-9999px";
container.style.width = "800px";
document.body.appendChild(container);

// 6. PDF 생성
try {
  await renderElementToPdf(container, "자세분석리포트.pdf");
} finally {
  document.body.removeChild(container);
}
```

### 2. React 컴포넌트에서 사용

```tsx
import { useState } from "react";
import { generateReportHtml } from "./utils/makeReportHtml";
import { renderElementToPdf } from "./utils/generatePdfReport";

function ReportButton() {
  const [loading, setLoading] = useState(false);

  const handleGeneratePDF = async () => {
    setLoading(true);
    try {
      // 리포트 데이터 준비
      const reportData = {
        memberName: "홍길동",
        centerName: "필라테스 센터",
        // ... 기타 데이터
      };

      // HTML 생성
      const html = generateReportHtml(reportData);

      // 컨테이너 생성
      const container = document.createElement("div");
      container.innerHTML = html;
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.width = "800px";
      document.body.appendChild(container);

      // PDF 생성
      await renderElementToPdf(container, "리포트.pdf");
    } finally {
      setLoading(false);
      // 정리
      const container = document.getElementById("report-container");
      if (container) {
        document.body.removeChild(container);
      }
    }
  };

  return (
    <button onClick={handleGeneratePDF} disabled={loading}>
      {loading ? "생성 중..." : "PDF 리포트 생성"}
    </button>
  );
}
```

### 3. 화면에 표시된 리포트를 PDF로 변환

```typescript
// 화면에 이미 표시된 리포트 요소
const reportElement = document.getElementById("report-section");

if (reportElement) {
  await renderElementToPdf(
    reportElement as HTMLElement,
    "자세분석리포트.pdf"
  );
}
```

## 📋 API 문서

### `generateReportHtml(data: ReportData): string`

리포트 HTML을 생성합니다.

**파라미터:**
- `data.memberName`: 회원명
- `data.centerName`: 센터명
- `data.postureResults`: 측정 결과 객체 (예: `{ CVA: 65.7, PTA: 18.0 }`)
- `data.activePatterns`: 활성 패턴 배열 (DB에서 매칭된 패턴)
- `data.muscleStatus`: 근육 상태 (`{ tight: string[], weak: string[] }`)
- `data.exercises`: 추천 운동 배열

**반환값:** HTML 문자열

### `renderElementToPdf(containerEl, fileName, options?)`

HTML 요소를 PDF로 변환하여 저장/공유합니다.

**파라미터:**
- `containerEl`: HTML 요소 (HTMLElement)
- `fileName`: 저장할 파일명 (기본값: "posture_report.pdf")
- `options`: 옵션 객체
  - `pageFormat`: 페이지 형식 ("a4" | "letter" | [number, number])
  - `margin`: 여백 (mm, 기본값: 12)
  - `includeDate`: 파일명에 날짜 추가 (기본값: true)

## 🎨 리포트 구성

생성되는 리포트는 다음 섹션을 포함합니다:

1. **헤더**: 센터명, 회원명, 생성일
2. **측정 결과 요약**: 측정값 표
3. **근육 상태 분석**: 긴장/약화 근육 목록
4. **맞춤 필라테스 루틴**: 추천 운동 상세 정보
5. **결론 및 향후 권장사항**:
   - 단기(1~4주) 권장사항
   - 중기(4~8주) 권장사항
   - 장기(8~12주 이상) 권장사항
   - **교수님 확정 문구**: "우리는 걱정 대신 근거(데이터)로 움직입니다."

## 📱 모바일 지원

- **자동 공유**: `navigator.share`가 지원되면 공유 대화상자 표시
- **폴백 다운로드**: 공유가 불가능하면 Blob 다운로드
- **안정적인 처리**: Blob URL 자동 정리

## ⚠️ 주의사항

1. **폰트**: 외부 폰트(Google Fonts)가 모바일에서 로드 실패할 수 있으므로, CSS에 시스템 폰트 폴백을 추가하세요:
   ```css
   font-family: 'Noto Sans KR', system-ui, -apple-system, "Segoe UI", Roboto, Arial;
   ```

2. **컨테이너 크기**: 리포트 컨테이너는 최소 너비 800px을 권장합니다.

3. **차트/그래프**: Chart.js 등으로 생성된 차트는 `html2canvas`로 캡처되므로, PDF 생성 전에 차트가 완전히 렌더링되었는지 확인하세요.

4. **이미지**: 외부 이미지는 CORS 설정이 필요할 수 있습니다.

## 🔧 문제 해결

### PDF가 잘리는 경우
- `container.style.width`를 명시적으로 설정하세요 (예: "800px")
- `html2canvas`의 `scale` 옵션을 조정하세요

### 모바일에서 저장이 안 되는 경우
- `navigator.share` 폴백이 자동으로 작동합니다
- 브라우저 권한을 확인하세요

### 폰트가 깨지는 경우
- 시스템 폰트를 사용하거나, 폰트를 base64로 인라인화하세요

## 📚 더 많은 예제

`src/utils/generatePdfReport.example.ts` 파일을 참고하세요.

