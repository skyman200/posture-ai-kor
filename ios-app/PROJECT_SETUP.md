# iOS 프로젝트 설정 가이드

## 1. Xcode 프로젝트 생성

### 방법 1: Xcode에서 직접 생성 (권장)

1. **Xcode 실행**
   - Xcode를 열고 `File → New → Project` 선택

2. **프로젝트 템플릿 선택**
   - iOS 탭 선택
   - **App** 템플릿 선택
   - Next 클릭

3. **프로젝트 설정**
   - Product Name: `PilatesApp`
   - Team: 본인의 Apple Developer Team 선택
   - Organization Identifier: `com.yourname` (예: `com.skyman200`)
   - Interface: **SwiftUI**
   - Language: **Swift**
   - ☑️ **Use Core Data** 체크 (중요!)
   - ☑️ Include Tests 체크 해제 (선택사항)
   - Next 클릭

4. **저장 위치**
   - 원하는 위치에 저장
   - Create 클릭

### 방법 2: 기존 프로젝트에 파일 추가

이미 프로젝트가 있다면:
1. `ios-app/PilatesApp/` 폴더의 모든 `.swift` 파일을 프로젝트에 드래그
2. `PilatesApp.xcdatamodeld` 폴더를 프로젝트에 추가

## 2. Core Data 모델 설정

1. **Xcode에서 프로젝트 열기**
   - `PilatesApp.xcodeproj` 파일 열기

2. **Core Data 모델 확인**
   - 프로젝트 네비게이터에서 `PilatesApp.xcdatamodeld` 파일 확인
   - 없으면 `ios-app/PilatesApp/PilatesApp.xcdatamodeld/` 폴더를 프로젝트에 추가

3. **모델 검증**
   - `PilatesApp.xcdatamodeld` 파일을 열어서 다음 엔티티들이 있는지 확인:
     - MuscleGroup
     - PilatesEquipment
     - Exercise
     - MuscleProblem
     - ExerciseRecommendation

## 3. 파일 구조 확인

프로젝트 네비게이터에서 다음 구조가 있어야 합니다:

```
PilatesApp/
├── PilatesAppApp.swift (또는 PilatesApp.swift)
├── ContentView.swift
├── PersistenceController.swift
├── DataSeeder.swift
├── Services/
│   └── CVAIntegrationService.swift
└── Views/
    ├── MuscleProblemListView.swift
    ├── ExerciseRecommendationView.swift
    ├── ExerciseDetailView.swift
    ├── ExerciseListView.swift
    ├── FavoritesView.swift
    ├── WorkoutBuilderView.swift
    ├── NewWorkoutProgramView.swift
    ├── WorkoutProgramDetailView.swift
    ├── CVAIntegrationView.swift
    └── SettingsView.swift
```

## 4. 빌드 및 실행

1. **시뮬레이터 선택**
   - 상단 툴바에서 원하는 iOS 시뮬레이터 선택 (iOS 15.0 이상 권장)

2. **빌드**
   - `Cmd + B` 또는 Product → Build

3. **실행**
   - `Cmd + R` 또는 Product → Run

4. **초기 데이터 확인**
   - 앱이 실행되면 자동으로 필라테스 데이터가 로드됩니다
   - "근육 문제" 탭에서 18개의 근육 문제가 표시되는지 확인

## 5. 문제 해결

### Core Data 오류

만약 Core Data 관련 오류가 발생하면:

1. **모델 파일 확인**
   - `PilatesApp.xcdatamodeld` 파일이 프로젝트에 포함되어 있는지 확인
   - Target Membership이 체크되어 있는지 확인

2. **빌드 클린**
   - `Cmd + Shift + K` (Clean Build Folder)
   - 다시 빌드

### 데이터가 로드되지 않음

1. **DataSeeder 확인**
   - `PersistenceController.swift`의 `init` 메서드에서 `DataSeeder.seedInitialData`가 호출되는지 확인

2. **시뮬레이터 재설정**
   - 시뮬레이터 → Device → Erase All Content and Settings

## 6. 추가 설정

### 한국어 지원

프로젝트 설정에서:
1. Project → Info → Localizations
2. Korean 추가

### 앱 아이콘

`Assets.xcassets`에 앱 아이콘 추가:
- 다양한 크기의 아이콘 이미지 필요
- 1024x1024px 아이콘 권장

### Info.plist

필요한 경우 `Info.plist`에 추가 설정:
- Privacy 설정 (카메라, 사진 라이브러리 등)
- URL Schemes (웹 앱과 연동 시)

## 7. 웹 앱과 연동

### JSON 파일 공유

1. 웹 앱에서 측정 결과를 JSON으로 내보내기
2. iOS 앱에서 파일 공유로 JSON 가져오기
3. `CVAIntegrationService`로 자동 분석 및 추천

### API 연동 (선택사항)

나중에 서버 API를 구축하면:
- REST API 엔드포인트 설정
- 네트워크 레이어 추가
- JSON 파싱 및 Core Data 저장

## 8. 테스트

### 기능 테스트

1. 근육 문제 목록이 표시되는지 확인
2. 운동 추천이 정상적으로 작동하는지 확인
3. 즐겨찾기 기능이 작동하는지 확인
4. 운동 프로그램 빌더가 정상 작동하는지 확인

### 데이터 무결성

1. Core Data에 모든 데이터가 제대로 저장되었는지 확인
2. 관계(Relationships)가 올바르게 설정되었는지 확인

## 9. 배포 준비

### App Store Connect 설정

1. App Store Connect에서 앱 등록
2. 앱 정보 및 스크린샷 준비
3. 개인정보 처리방침 준비

### 코드 서명

1. Apple Developer 계정 필요
2. Provisioning Profile 설정
3. 코드 서명 설정

## 참고사항

- 최소 iOS 버전: iOS 15.0
- Swift 버전: Swift 5.5+
- Xcode 버전: Xcode 13.0+










