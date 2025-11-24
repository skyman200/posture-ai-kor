# PDF 저장 문제 해결 및 다중 사용자 지원

## 문제 분석

### 1. PDF 저장 시 Before/After 이미지가 저장되지 않는 문제
**원인:**
- `captureSessionSnapshot` 함수가 전역 canvas와 전역 상태(`cur`, `sessions`)를 사용
- Before와 After를 전환하면서 전역 상태가 변경되어 충돌 발생
- 여러 사용자가 동시에 PDF를 생성할 때 전역 상태가 공유되어 충돌

### 2. 다중 사용자 접속 시 충돌 문제
**원인:**
- 모든 사용자가 같은 전역 변수(`sessions`, `cur`, `cv`)를 공유
- 사용자별 데이터 격리가 없음
- 동시에 여러 명이 접속하면 데이터가 섞임

## 구현된 해결책

### 1. 세션 ID 기반 데이터 격리 ✅

각 사용자에게 고유한 세션 ID를 부여하여 데이터를 격리합니다.

**변경 내용:**
```javascript
// 고유 세션 ID 생성 함수
const generateSessionId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${random}`;
};

// sessions 객체에 세션 ID 추가
const sessions = {
  _sessionId: sessionId,  // 고유 ID 저장
  Before: { ... },
  After: { ... }
};
```

**위치:** `index.html` 라인 17220-17256

**효과:**
- 각 사용자마다 고유한 세션 ID가 생성됨
- 디버깅 시 어떤 세션의 데이터인지 추적 가능
- 향후 서버 연동 시 세션 관리 기반 마련

### 2. 독립적인 임시 캔버스 사용 ✅

PDF 생성 시 전역 canvas 대신 임시 canvas를 생성하여 사용합니다.

**변경 내용:**
```javascript
const captureSessionSnapshot = async (sessionName, orientation) => {
  // ✅ 임시 캔버스 생성 (전역 canvas 사용 안 함)
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  // ✅ 세션 데이터에서 직접 이미지와 포인트 가져오기
  const imgRef = orientation === "front" ? session.imgFront : session.imgSide;
  const pointsMap = orientation === "front" ? session.frontPoints : session.sidePoints;
  
  // ✅ 임시 캔버스에 이미지와 점, 선 그리기
  tempCanvas.width = imgWidth;
  tempCanvas.height = imgHeight;
  tempCtx.drawImage(imgRef, 0, 0, imgWidth, imgHeight);
  
  // 키포인트와 연결선 그리기
  // ...
  
  // ✅ 데이터 URL로 변환 후 메모리 정리
  const snapshot = tempCanvas.toDataURL("image/png", 1.0);
  tempCanvas.width = 1;
  tempCanvas.height = 1;
  
  return snapshot;
};
```

**위치:** `index.html` 라인 11309-11432

**효과:**
- 전역 canvas 상태 변경 없음 (switchSession, setOrientation 호출 제거)
- Before/After 이미지를 동시에 안전하게 캡처 가능
- 다중 사용자가 동시에 PDF 생성해도 충돌 없음
- PDF 생성 속도 향상 (불필요한 DOM 업데이트 제거)

### 3. 향상된 데이터 검증 및 오류 메시지

Before와 After 데이터를 각각 검증하고 명확한 안내를 제공합니다.

**변경 내용:**
```javascript
// Before/After 세션 데이터 각각 확인
const hasBeforeSide = beforeSession?.imgSide || (beforeSession?.sidePoints && beforeSession.sidePoints.size > 0);
const hasBeforeFront = beforeSession?.imgFront || (beforeSession?.frontPoints && beforeSession.frontPoints.size > 0);
const hasAfterSide = afterSession?.imgSide || (afterSession?.sidePoints && afterSession.sidePoints.size > 0);
const hasAfterFront = afterSession?.imgFront || (afterSession?.frontPoints && afterSession.frontPoints.size > 0);

// 사용자에게 명확한 안내
if (hasBeforeData && hasAfterData) {
  console.log("✅ Before와 After 데이터 모두 존재 - 비교 리포트 생성");
} else if (hasBeforeData) {
  const proceed = confirm("Before 데이터만 있습니다. After 데이터 없이 리포트를 생성하시겠습니까?");
  // ...
}
```

## 테스트 방법

### 1. 단일 사용자 테스트
1. Before 이미지 업로드 및 분석
2. After 이미지 업로드 및 분석
3. PDF 저장 버튼 클릭
4. **확인사항:** Before와 After 이미지가 모두 PDF에 포함되어 있는지 확인

### 2. 다중 사용자 테스트
1. 두 개 이상의 브라우저 창 열기
2. 각 창에서 다른 이미지 업로드
3. 동시에 PDF 생성
4. **확인사항:** 각 PDF에 올바른 이미지가 포함되어 있는지 확인

### 3. 예외 상황 테스트
- Before만 있는 경우
- After만 있는 경우
- 이미지 없이 PDF 생성 시도
- **확인사항:** 적절한 경고 메시지가 표시되는지 확인

## 추가 개선 권장사항

### 1. 서버 측 세션 관리
현재는 클라이언트에서만 세션 ID를 생성하므로, 서버 연동 시:
- 서버에서 세션 ID 발급
- 세션별 데이터 저장소 구현
- 세션 타임아웃 관리

### 2. 진행 상황 표시
PDF 생성 시 진행률 표시:
```javascript
btn.textContent = "⏳ 이미지 캡처 중... (1/4)";
// ...
btn.textContent = "⏳ PDF 생성 중... (3/4)";
```

### 3. 에러 로깅
프로덕션 환경에서는 에러를 서버로 전송:
```javascript
catch (error) {
  // 서버로 에러 전송
  await fetch('/api/log-error', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: sessions._sessionId,
      error: error.message,
      stack: error.stack
    })
  });
}
```

## 변경 사항 요약

| 항목 | 변경 전 | 변경 후 | 효과 |
|------|---------|---------|------|
| 세션 관리 | 전역 변수 공유 | 세션 ID 기반 격리 | 다중 사용자 지원 |
| 캔버스 사용 | 전역 canvas 재사용 | 임시 canvas 생성 | 충돌 방지 |
| 상태 전환 | switchSession 호출 | 직접 데이터 접근 | 성능 향상 |
| 데이터 검증 | 단순 확인 | 상세 검증 + 안내 | 사용자 경험 개선 |

## 적용 방법

변경된 `index.html` 파일을 배포하면 즉시 적용됩니다.
브라우저 캐시를 지우고 새로고침하여 확인하세요.
