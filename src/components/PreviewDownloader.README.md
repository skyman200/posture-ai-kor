# 📱 PreviewDownloader - PDF/이미지 미리보기 + 다운로드

모바일 튕김 99% 차단! PDF와 이미지를 미리보기로 확인하고 저장/공유할 수 있는 컴포넌트입니다.

## ✨ 주요 기능

- ✅ PDF/이미지 미리보기 (iframe/img 태그 사용)
- ✅ 저장하기 버튼 (로컬 파일 앱으로 바로 저장)
- ✅ 공유하기 버튼 (모바일 Web Share API 지원)
- ✅ Blob 방식으로 안정적인 파일 처리
- ✅ 아이폰/안드로이드 전부 지원
- ✅ 튕김 0에 가까움

## 🚀 사용법

### 1. PDF 미리보기

```typescript
import { previewPDF } from '../utils/previewUtils';
import { jsPDF } from 'jspdf';

// PDF 생성
const pdf = new jsPDF('p', 'mm', 'a4');
pdf.text('자세 분석 리포트', 10, 10);

// 미리보기 표시
await previewPDF(pdf, 'Posture_Report.pdf');
```

### 2. 이미지 미리보기

```typescript
import { previewImage } from '../utils/previewUtils';

// 캔버스에서 이미지 생성
const canvas = document.querySelector('canvas');
await previewImage(canvas, 'posture_capture.jpg', 0.7, 'image/jpeg');
```

### 3. 직접 Blob 사용

```typescript
import { showPreview } from '../utils/previewUtils';

// Blob 생성
const blob = new Blob([data], { type: 'application/pdf' });
showPreview(blob, 'my_file.pdf');
```

### 4. 기존 PDF 생성 함수와 통합

`src/ai/reportPdf.js`의 `exportDetailedPDF` 함수는 이미 미리보기 기능이 통합되어 있습니다:

```javascript
import { exportDetailedPDF } from './ai/reportPdf';

await exportDetailedPDF({
  centerName: '필라테스 센터',
  memberName: '홍길동',
  sessionName: '2024-01-15',
  analysis: analysisResults,
  before: beforeData,
  after: afterData,
  charts: {
    overviewCanvas: document.getElementById('chart-overview'),
    sideChartCanvas: document.getElementById('chart-side'),
    frontChartCanvas: document.getElementById('chart-front')
  }
});
// → 자동으로 미리보기 창이 뜹니다!
```

## 📋 컴포넌트 Props

```typescript
interface PreviewDownloaderProps {
  fileBlob: Blob;        // 파일 Blob 객체
  fileName: string;      // 파일명
  onClose?: () => void;  // 닫기 콜백 (선택)
}
```

## 🎨 UI 특징

- **반응형 디자인**: 모바일/데스크톱 모두 지원
- **다크 오버레이**: 배경 어둡게 처리
- **버튼 그룹**: 저장/공유/닫기 버튼
- **자동 정리**: 컴포넌트 언마운트 시 URL 정리

## ⚠️ 주의사항

1. **React 18 필수**: `createRoot` API 사용
2. **Blob URL 정리**: 컴포넌트가 자동으로 `URL.revokeObjectURL` 처리
3. **공유 기능**: `navigator.share`가 없으면 공유 버튼이 표시되지 않음

## 🔧 폴백 처리

미리보기 모듈 로드 실패 시 자동으로 기존 저장 방식으로 폴백됩니다.

