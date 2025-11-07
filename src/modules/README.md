# AI 리포트 관리 모듈 사용 가이드

## 📦 모듈 구조

```
src/
├── modules/
│   └── aiReportManager.js    # AI 분석 + 리포트 + PDF 통합 관리
└── utils/
    └── userDataManager.js      # 사용자별 localStorage 관리
```

## 🚀 빠른 시작

### 1. 기본 사용법

```javascript
// 모듈 import
import { AIReportManager } from './src/modules/aiReportManager.js';

// AI 분석 및 자동 저장 실행
await AIReportManager.analyzeAndSave('After', {
  CVA: 72.3,
  PTA: 13.1,
  KA: 177.3,
  HPD: 1.2
}, {
  centerName: '테스트 센터',
  memberName: '홍길동',
  beforeSession: 'Before',  // Before 세션과 비교
  autoPDF: true             // PDF 자동 생성
});
```

### 2. Before-After 비교 리포트 생성

```javascript
// Before 세션 저장
await AIReportManager.analyzeAndSave('Before', {
  CVA: 65.0,
  PTA: 15.0,
  KA: 180.0
}, {
  memberName: '홍길동',
  autoPDF: false
});

// After 세션 저장 및 비교 리포트 생성
await AIReportManager.generateComparisonReport('Before', 'After', {
  centerName: '테스트 센터',
  memberName: '홍길동',
  autoPDF: true
});
```

### 3. 리포트 조회

```javascript
// 특정 리포트 불러오기
const report = AIReportManager.loadReport('After');
console.log(report);

// 전체 리포트 히스토리 가져오기
const allReports = AIReportManager.getAllReports();
console.log(allReports);

// Before-After 비교 데이터 가져오기
const comparison = AIReportManager.getBeforeAfterComparison('Before', 'After');
console.log(comparison);
```

### 4. 리포트 삭제

```javascript
AIReportManager.deleteReport('After');
```

## 📋 주요 기능

| 기능 | 설명 |
|------|------|
| 🧍‍♂️ AI 분석 | 측정값 기반 자동 해석 |
| 🧘 필라테스 추천 | 근육 패턴 → 추천 세션 연결 |
| 💾 로컬 저장 | 사용자별 localStorage 저장 |
| 🧾 PDF 자동 생성 | 분석결과 + 그래프 + 코멘트 자동 리포트 |
| 🕓 히스토리 관리 | 세션별 Before–After 비교 저장 가능 |

## 🔧 API 레퍼런스

### `analyzeAndSave(sessionName, postureData, options)`

AI 분석을 실행하고 리포트를 저장합니다.

**Parameters:**
- `sessionName` (string): 세션 이름 (예: 'Before', 'After', '2025-01-15_After')
- `postureData` (object): 자세 측정 데이터 `{CVA: 72.3, PTA: 13.1, ...}`
- `options` (object, optional):
  - `centerName` (string): 센터명
  - `memberName` (string): 회원명
  - `beforeSession` (string): 비교할 Before 세션 이름
  - `autoPDF` (boolean): PDF 자동 생성 여부 (기본값: true)

**Returns:** `Promise<object>` - 저장된 리포트 데이터

### `generateComparisonReport(beforeSession, afterSession, options)`

Before-After 비교 리포트를 생성합니다.

**Parameters:**
- `beforeSession` (string): Before 세션 이름
- `afterSession` (string): After 세션 이름
- `options` (object, optional):
  - `centerName` (string): 센터명
  - `memberName` (string): 회원명
  - `autoPDF` (boolean): PDF 자동 생성 여부 (기본값: true)

**Returns:** `Promise<object>` - 비교 리포트 데이터

### `loadReport(sessionName)`

저장된 리포트를 불러옵니다.

**Parameters:**
- `sessionName` (string): 세션 이름

**Returns:** `object|null` - 리포트 데이터 또는 null

### `getAllReports()`

모든 리포트 히스토리를 가져옵니다.

**Returns:** `object` - 모든 리포트 객체

### `deleteReport(sessionName)`

리포트를 삭제합니다.

**Parameters:**
- `sessionName` (string): 삭제할 세션 이름

**Returns:** `boolean` - 삭제 성공 여부

## 💡 사용 예시

### 예시 1: 단일 세션 분석

```javascript
// 측정 완료 후 자동 분석 및 저장
const postureData = {
  CVA: 72.3,
  PTA: 13.1,
  KA: 177.3,
  HPD: 1.2
};

await AIReportManager.analyzeAndSave('After', postureData, {
  centerName: '필라테스 센터',
  memberName: '김철수',
  autoPDF: true
});
```

### 예시 2: Before-After 비교

```javascript
// 1. Before 세션 저장
await AIReportManager.analyzeAndSave('Before', {
  CVA: 65.0,
  PTA: 15.0,
  KA: 180.0
}, {
  memberName: '김철수',
  autoPDF: false
});

// 2. After 세션 저장
await AIReportManager.analyzeAndSave('After', {
  CVA: 72.3,
  PTA: 13.1,
  KA: 177.3
}, {
  memberName: '김철수',
  beforeSession: 'Before',
  autoPDF: true
});

// 3. 비교 리포트 생성
await AIReportManager.generateComparisonReport('Before', 'After', {
  centerName: '필라테스 센터',
  memberName: '김철수',
  autoPDF: true
});
```

### 예시 3: 히스토리 조회

```javascript
// 모든 리포트 가져오기
const allReports = AIReportManager.getAllReports();

// 리포트 목록 표시
Object.keys(allReports).forEach(sessionName => {
  const report = allReports[sessionName];
  console.log(`${sessionName}: ${report.timestamp}`);
  console.log(`  - CVA: ${report.postureData.CVA}`);
  console.log(`  - PTA: ${report.postureData.PTA}`);
});
```

## 🔒 데이터 저장 구조

데이터는 `localStorage`에 사용자별로 저장됩니다:

```
diposture_{userId}_reports: {
  "Before": {
    timestamp: "2025-01-15T10:30:00.000Z",
    sessionName: "Before",
    postureData: { CVA: 65.0, PTA: 15.0, ... },
    aiSummary: { ... },
    pilatesPlan: [ ... ],
    centerName: "필라테스 센터",
    memberName: "김철수"
  },
  "After": { ... }
}
```

## ⚠️ 주의사항

1. **브라우저 호환성**: ES6 모듈을 지원하는 브라우저에서만 동작합니다.
2. **localStorage 용량**: 브라우저별로 localStorage 용량 제한이 있습니다 (일반적으로 5-10MB).
3. **PDF 생성**: `html2canvas`와 `jsPDF` 라이브러리가 미리 로드되어 있어야 합니다.

## 🐛 문제 해결

### 모듈을 찾을 수 없음
```javascript
// 상대 경로 확인
import { AIReportManager } from './src/modules/aiReportManager.js';
```

### PDF 생성 실패
- `html2canvas`와 `jsPDF`가 로드되었는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 데이터가 저장되지 않음
- 브라우저의 localStorage가 활성화되어 있는지 확인
- 브라우저 개발자 도구에서 localStorage 확인


