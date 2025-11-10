# DB 기반 AI 분석 및 리포트 모듈

## 📦 모듈 구조

```
src/
├── ai/
│   ├── analyzerWithDB.js    # DB 기반 분석기 (Posture_Muscle_DB_Full.json 사용)
│   ├── reportPdf.js         # 상세 PDF 리포트 생성
│   └── README.md            # 이 문서
```

## 🎯 핵심 특징

- **DB를 절대 기준으로 사용**: 모든 해석/운동 추천은 `Posture_Muscle_DB_Full.json`에서만 가져옴
- **정면/측면 통합 분석**: side/front 섹션별 지표 자동 분석
- **상세 PDF 리포트**: 모든 분석 결과를 포함한 긴 리포트 자동 생성
- **모바일 호환**: iOS/Android에서도 정상 저장

## 🚀 빠른 시작

### 1. 기본 사용법 (측정값 → 분석 → PDF)

```javascript
// 모듈 import
import { analyzeWithDB } from './src/ai/analyzerWithDB.js';
import { exportDetailedPDF } from './src/ai/reportPdf.js';

// 1) 측정값 준비 (정면 + 측면)
const side = { 
  CVA: 53.1, 
  HPD: 0.8, 
  TIA: 6.4, 
  SAA: 0.0, 
  PTA: 28.1, 
  KA: 177.2, 
  Tibial: 5.7, 
  GSB: 0.5, 
  HPA: 0 
};

const front = { 
  STA: 2.1, 
  POA: 4.3, 
  TD: 1.0, 
  HTA: 0.5, 
  SPP: 1.2, 
  KAS: 2.9, 
  LLAS: 1.0, 
  FBA: 7.0 
};

// 2) DB 기반 분석
const analysis = await analyzeWithDB({ side, front });

// 3) 상세 PDF 생성
await exportDetailedPDF({
  centerName: '레드코어 트레이닝센터',
  memberName: '홍길동',
  sessionName: 'After',
  analysis,
  before: { side: {...}, front: {...} },  // Before 데이터 (선택)
  after: { side, front },
  charts: {
    overviewCanvas: document.getElementById('chart-overview'),
    sideChartCanvas: document.getElementById('chart-side'),
    frontChartCanvas: document.getElementById('chart-front')
  }
});
```

### 2. 전역 함수 사용 (index.html에서)

```javascript
// 페이지 로드 후 자동으로 전역 함수로 노출됨
const side = { CVA: 53.1, PTA: 28.1, KA: 177.2 };
const front = { STA: 2.1, POA: 4.3 };

// 분석
const analysis = await window.analyzeWithDB({ side, front });

// PDF 생성
await window.exportDetailedPDF({
  centerName: '테스트 센터',
  memberName: '김철수',
  sessionName: 'After',
  analysis,
  after: { side, front }
});
```

### 3. AIReportManager와 통합 사용

```javascript
// AIReportManager가 자동으로 DB 기반 분석기 사용
await window.AIReportManager.analyzeAndSave('After', {
  side: { CVA: 53.1, PTA: 28.1 },
  front: { STA: 2.1, POA: 4.3 }
}, {
  centerName: '테스트 센터',
  memberName: '홍길동',
  beforeSession: 'Before',
  autoPDF: true  // 자동으로 상세 PDF 생성
});
```

## 📋 API 레퍼런스

### `analyzeWithDB(measured)`

DB 기반 통합 분석을 수행합니다.

**Parameters:**
- `measured` (object): 측정값 객체
  - `side` (object): 측면 지표 `{CVA: 53.1, PTA: 28.1, ...}`
  - `front` (object): 정면 지표 `{STA: 2.1, POA: 4.3, ...}`
  - 또는 flat 구조: `{CVA: 53.1, PTA: 28.1, ...}` (자동으로 side로 분류)

**Returns:** `Promise<object>`
```javascript
{
  results: [        // 지표별 상세 분석
    {
      metric: 'CVA',
      name: '경추 전만각',
      value: 53.1,
      unit: '°',
      normalText: '≥50°',
      status: '정상',
      pattern: '...',
      tight: ['상부승모근', '...'],
      weak: ['심부굴곡근', '...'],
      pilates: [{ equipment: 'mat', name: 'Swan', purpose: '...' }],
      exerciseGuide: '...'
    },
    // ...
  ],
  sections: [       // 섹션별 요약
    { section: 'side', summary: 'CVA: 53.1° (정상 / 정상:≥50°) · ...' },
    { section: 'front', summary: 'STA: 2.1° (정상 / 정상:≤3°) · ...' }
  ],
  tightAll: ['상부승모근', '...'],      // 긴장 근육 통합
  weakAll: ['심부굴곡근', '...'],       // 약화 근육 통합
  pilatesAll: [{ equipment: 'mat', name: 'Swan', ... }, ...]  // 필라테스 통합
}
```

### `exportDetailedPDF(options)`

상세 PDF 리포트를 생성합니다.

**Parameters:**
- `options` (object):
  - `centerName` (string): 센터명
  - `memberName` (string): 회원명
  - `sessionName` (string): 세션명
  - `analysis` (object): `analyzeWithDB()` 결과
  - `before` (object, optional): Before 측정값
  - `after` (object, optional): After 측정값
  - `charts` (object, optional): 차트 캔버스
    - `overviewCanvas`: Before-After 비교 그래프
    - `sideChartCanvas`: 측면 지표 그래프
    - `frontChartCanvas`: 정면 지표 그래프

**Returns:** `Promise<void>`

## 📊 DB 구조 요구사항

`Posture_Muscle_DB_Full.json`은 다음 구조를 지원해야 합니다:

### 객체 형태 (권장)
```json
{
  "CVA": {
    "name": "경추 전만각",
    "unit": "°",
    "normalRange": "≥50°",
    "tight_muscles": ["상부승모근"],
    "weak_muscles": ["심부굴곡근"],
    "pilates": [
      { "equipment": "mat", "name": "Swan", "purpose": "경추 신전 강화" }
    ],
    "exerciseGuide": "경추 신전 운동 권장"
  }
}
```

### 배열 형태 (기존 호환)
```json
[
  {
    "지표코드": "CVA",
    "지표명": "경추 전만각",
    "측정단위": "°",
    "정상범위": "≥50°",
    "긴장근육(주요)": "상부승모근",
    "약화근육(주요)": "심부굴곡근",
    "필라테스운동(Mat)": "Swan",
    "교정운동(도수/자가)": "경추 신전 운동"
  }
]
```

## 🔧 정상 범위 형식

DB의 `normalRange` 필드는 다음 형식을 지원합니다:

- `≥50°`: 최소값 (value >= 50)
- `≤2cm`: 최대값 (value <= 2)
- `0-10°` 또는 `0–10°`: 범위 (0 <= value <= 10)
- `{min: 50, max: 70}`: 객체 형태

## 💡 사용 예시

### 예시 1: 단일 세션 분석

```javascript
const side = { CVA: 72.3, PTA: 13.1, KA: 177.3 };
const front = { STA: 2.1, POA: 4.3 };

const analysis = await analyzeWithDB({ side, front });

console.log('분석 결과:', analysis.results);
console.log('긴장 근육:', analysis.tightAll);
console.log('약화 근육:', analysis.weakAll);
console.log('필라테스 추천:', analysis.pilatesAll);
```

### 예시 2: Before-After 비교 리포트

```javascript
const before = {
  side: { CVA: 65.0, PTA: 15.0 },
  front: { STA: 3.0, POA: 5.0 }
};

const after = {
  side: { CVA: 72.3, PTA: 13.1 },
  front: { STA: 2.1, POA: 4.3 }
};

// 분석
const analysis = await analyzeWithDB({ side: after.side, front: after.front });

// PDF 생성 (Before-After 비교 그래프 포함)
await exportDetailedPDF({
  centerName: '필라테스 센터',
  memberName: '김철수',
  sessionName: 'After',
  analysis,
  before,
  after,
  charts: {
    overviewCanvas: drawComparisonChart(before.side, after.side).chart?.canvas
  }
});
```

### 예시 3: 차트와 함께 PDF 생성

```javascript
// Chart.js로 그래프 생성
const sideChart = drawComparisonChart(sideData, null, 'chart-side');
const frontChart = drawComparisonChart(frontData, null, 'chart-front');

// 분석
const analysis = await analyzeWithDB({ side: sideData, front: frontData });

// PDF 생성
await exportDetailedPDF({
  centerName: '테스트 센터',
  memberName: '홍길동',
  sessionName: 'After',
  analysis,
  after: { side: sideData, front: frontData },
  charts: {
    sideChartCanvas: sideChart,
    frontChartCanvas: frontChart
  }
});
```

## ⚠️ 주의사항

1. **DB 파일 위치**: `/public/db/Posture_Muscle_DB_Full.json`에 있어야 합니다.
2. **jsPDF 필요**: PDF 생성 시 `jsPDF` 라이브러리가 로드되어 있어야 합니다.
3. **차트 캔버스**: Chart.js로 생성된 캔버스는 렌더링 완료 후 전달해야 합니다.

## 🐛 문제 해결

### DB 로드 실패
```javascript
// 수동으로 DB 로드 확인
import { loadPostureDB } from './src/ai/analyzerWithDB.js';
const db = await loadPostureDB();
console.log('DB 로드됨:', Object.keys(db).length, '지표');
```

### PDF 생성 실패
- `jsPDF`가 로드되었는지 확인: `window.jspdf`
- 브라우저 콘솔에서 에러 메시지 확인

### 차트가 PDF에 포함되지 않음
- Chart.js 렌더링 완료 대기: `await waitForChartRender(chart)`
- 캔버스가 DOM에 추가되어 있는지 확인







