# 자세 분석 유틸리티 모듈

## 📦 파일 구조

```
src/utils/
├── analyzePosture.ts          # 메인 모듈 (PTA 계산 + 분석 + 추천)
├── analyzePosture.example.ts   # 사용 예시
└── README_analyzePosture.md   # 이 문서
```

## 🎯 주요 기능

### 1. PTA (골반 전후경사각) 계산

**기준:**
- PSIS 기준으로 ASIS와 같은 높이 = 0도
- **ASIS가 PSIS보다 위쪽에 있으면** → 후방경사 (Posterior Tilt) → **음수 (-1도부터)**
- **ASIS가 PSIS보다 밑쪽에 있으면** → 전방경사 (Anterior Tilt) → **양수 (1도부터)**

### 2. 자동 분석 및 운동 추천

- AI가 추출한 좌표값으로 자동 계산
- DB 기반 패턴 매칭
- 맞춤 운동 추천

## 🚀 빠른 시작

### 기본 사용법

```typescript
import { calcPelvicTilt, analyzeAndRecommend } from '@/utils/analyzePosture';

// 1. PTA 계산만 수행
const asis = { x: 500, y: 600 };  // 전상장골극
const psis = { x: 480, y: 580 };   // 후상장골극

const PTA = calcPelvicTilt(asis, psis);
console.log(`PTA: ${PTA}°`);  // 예: 8.2° (전방경사) 또는 -5.3° (후방경사)

// 2. 전체 분석 및 운동 추천
const posturePoints = {
  asis: { x: 500, y: 600 },
  psis: { x: 480, y: 580 },
  // ... 기타 좌표
};

const { results, activePatterns, recommendedExercises } = 
  await analyzeAndRecommend(posturePoints);

console.log('PTA:', results.PTA);
console.log('활성 패턴:', activePatterns);
console.log('추천 운동:', recommendedExercises);
```

## 📊 결과 예시

### PTA 값 해석

| PTA 값 | 해석 | 의미 |
|--------|------|------|
| `> 0` (예: `8.2°`) | 전방경사 (Anterior Tilt) | ASIS가 PSIS보다 밑쪽에 위치 |
| `< 0` (예: `-5.3°`) | 후방경사 (Posterior Tilt) | ASIS가 PSIS보다 위쪽에 위치 |
| `0` | 중립 | ASIS와 PSIS가 같은 높이 |

### 분석 결과 예시

```typescript
{
  results: {
    PTA: -8.2  // 후방경사
  },
  activePatterns: [
    {
      key: "PTA",
      type: "posterior_tilt",
      value: -8.2,
      severity: "mild",
      description: "골반 후방 경사 (Posterior Pelvic Tilt) - -8.2°",
      interpretation: "ASIS가 PSIS보다 위쪽에 위치하여 골반이 후방으로 기울어짐"
    }
  ],
  recommendedExercises: [
    // 후방경사 교정 운동 목록
  ]
}
```

## 🔧 API 레퍼런스

### `calcPelvicTilt(asis, psis)`

골반 전후경사각을 계산합니다.

**Parameters:**
- `asis` (object): 전상장골극 좌표 `{x: number, y: number}`
- `psis` (object): 후상장골극 좌표 `{x: number, y: number}`

**Returns:** `number` - PTA 각도 (양수: 전방경사, 음수: 후방경사, 최소 ±1도)

**Example:**
```typescript
const PTA = calcPelvicTilt(
  { x: 500, y: 600 },
  { x: 480, y: 580 }
);
// ASIS.y (600) > PSIS.y (580) → 전방경사 → 양수 반환
```

### `analyzeAndRecommend(posturePoints, options)`

전체 자세 분석 및 운동 추천을 수행합니다.

**Parameters:**
- `posturePoints` (object): AI가 추출한 좌표값
  - `asis` (object, optional): 전상장골극 좌표
  - `psis` (object, optional): 후상장골극 좌표
  - 기타 좌표...
- `options` (object, optional):
  - `muscleDB` (any, optional): 근육/자세 패턴 DB (없으면 자동 로드)
  - `pilatesDB` (any, optional): 필라테스 운동 DB (없으면 자동 로드)
  - `autoFetch` (boolean, optional): DB 자동 로드 여부 (기본값: true)

**Returns:** `Promise<object>`
```typescript
{
  results: {
    PTA?: number;
    // 기타 지표...
  };
  activePatterns: Array<{
    key: string;
    type: string;
    value: number;
    severity: string;
    description: string;
    interpretation: string;
  }>;
  recommendedExercises: Array<any>;
}
```

### `formatAnalysisResults(results)`

분석 결과를 화면 표시용으로 포맷팅합니다.

**Parameters:**
- `results` (object): 분석 결과 `{ PTA?: number, ... }`

**Returns:** `object`
```typescript
{
  items: Array<{
    항목: string;
    값: string;
    해석: string;
  }>;
}
```

## 💡 사용 예시

### 예시 1: React 컴포넌트에서 사용

```tsx
import { useState, useEffect } from 'react';
import { analyzeAndRecommend } from '@/utils/analyzePosture';

function PostureAnalysis({ posturePoints }) {
  const [results, setResults] = useState(null);

  useEffect(() => {
    async function analyze() {
      const analysis = await analyzeAndRecommend(posturePoints);
      setResults(analysis);
    }
    
    if (posturePoints?.asis && posturePoints?.psis) {
      analyze();
    }
  }, [posturePoints]);

  if (!results) return <div>분석 중...</div>;

  return (
    <div>
      <h3>PTA: {results.results.PTA}°</h3>
      {results.results.PTA > 0 ? (
        <p>전방경사 (Anterior Tilt)</p>
      ) : results.results.PTA < 0 ? (
        <p>후방경사 (Posterior Tilt)</p>
      ) : (
        <p>중립</p>
      )}
      
      <h4>추천 운동</h4>
      <ul>
        {results.recommendedExercises.map((ex, i) => (
          <li key={i}>{ex.name || ex.ko}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 예시 2: Vue 컴포넌트에서 사용

```vue
<template>
  <div>
    <div v-if="results">
      <h3>PTA: {{ results.results.PTA }}°</h3>
      <p v-if="results.results.PTA > 0">전방경사</p>
      <p v-else-if="results.results.PTA < 0">후방경사</p>
      <p v-else>중립</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { analyzeAndRecommend } from '@/utils/analyzePosture';

const props = defineProps<{
  posturePoints: {
    asis?: { x: number; y: number };
    psis?: { x: number; y: number };
  };
}>();

const results = ref(null);

onMounted(async () => {
  if (props.posturePoints?.asis && props.posturePoints?.psis) {
    results.value = await analyzeAndRecommend(props.posturePoints);
  }
});
</script>
```

### 예시 3: 전역 함수로 사용 (index.html)

```javascript
// 페이지 로드 후 자동으로 전역 함수로 노출됨
const posturePoints = {
  asis: { x: 500, y: 600 },
  psis: { x: 480, y: 580 }
};

// PTA 계산
const PTA = window.calcPelvicTilt(posturePoints.asis, posturePoints.psis);
console.log(`PTA: ${PTA}°`);

// 전체 분석
const analysis = await window.analyzeAndRecommend(posturePoints);
console.log('분석 결과:', analysis);
```

## ⚠️ 주의사항

1. **좌표계**: 이미지 좌표계를 사용합니다 (y축이 아래로 증가)
2. **최소값**: 각도는 최소 ±1도로 보장됩니다 (0도 제외)
3. **DB 파일**: `/public/db/` 경로에 DB 파일이 있어야 합니다
   - `Posture_Muscle_DB_Full.json`
   - `Pilates_Exercise_DB_1000_v2.json`

## 🔗 관련 모듈

- `src/ai/analyzerWithDB.js` - DB 기반 통합 분석
- `src/ai/reportPdf.js` - 상세 PDF 리포트 생성
- `src/modules/aiReportManager.js` - 리포트 관리

## 📊 리포트 히스토리 관리

### `saveReportHistory(memberName, centerName, results, summary?)`

분석 결과를 LocalStorage에 저장합니다.

**Parameters:**
- `memberName` (string): 회원명
- `centerName` (string): 센터명
- `results` (object): 측정 결과 `{ CVA, PTA, SAA, ... }`
- `summary` (string, optional): 분석 요약

**Example:**
```typescript
await saveReportHistory(
  '홍길동',
  '레드코어 트레이닝센터',
  { CVA: 72.3, PTA: 13.1, SAA: 10.5 },
  '2주간 필라테스 프로그램 진행 후 개선됨'
);
```

### `getReportHistory(memberName, centerName?)`

회원의 리포트 히스토리를 가져옵니다.

**Parameters:**
- `memberName` (string): 회원명
- `centerName` (string, optional): 센터명

**Returns:** `Array<{date: string, ...}>` - 히스토리 배열

**Example:**
```typescript
const history = getReportHistory('홍길동', '레드코어 트레이닝센터');
console.log('최근 3회:', history.slice(-3));
```

## 📈 PDF 리포트 구성

`generateFullPDFReport()` 함수가 생성하는 PDF 구성:

1. **표지** - 회원 정보 / 날짜 / 센터명
2. **Before/After 사진** - 나란히 표시
3. **Before/After 비교 그래프** - 주요 측정 항목 (CVA, PTA, SAA, TIA, KA, GSB 등)
4. **AI 변화 트렌드 그래프** - 최근 3회 측정 추세 (자동 포함, 히스토리가 2회 이상일 때)
5. **AI 분석 결과 요약** - 주요 문제 패턴
6. **추천 필라테스 운동** - 맞춤 운동 5종
7. **정기 재측정 권장** - 메시지 및 추가 메모

**자동 기능:**
- PDF 생성 후 자동으로 히스토리에 저장
- 히스토리가 2회 이상이면 트렌드 그래프 자동 포함

## 📝 변경 이력

- **2025-01-XX**: 리포트 히스토리 관리 기능 추가 (LocalStorage 기반)
- **2025-01-XX**: PDF에 변화 트렌드 그래프 자동 포함 기능 추가
- **2025-01-XX**: PTA 계산 기준 수정 (ASIS 위쪽 → 후방경사, 아래쪽 → 전방경사)
- **2025-01-XX**: 최소 각도 보장 (±1도) 추가

