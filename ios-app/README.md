# PilatesApp - iOS 필라테스 운동 추천 앱

자세 분석 결과를 기반으로 필라테스 운동을 추천하는 iOS 앱입니다.

## 프로젝트 구조

```
PilatesApp/
├── PilatesApp.swift                 # 앱 진입점
├── PersistenceController.swift      # Core Data 관리
├── DataSeeder.swift                 # 초기 데이터 로드
├── ContentView.swift                # 메인 탭 뷰
├── Views/
│   ├── MuscleProblemListView.swift     # 근육 문제 목록
│   ├── ExerciseRecommendationView.swift # 운동 추천 상세
│   ├── ExerciseDetailView.swift        # 운동 상세 정보
│   ├── ExerciseListView.swift         # 전체 운동 목록
│   ├── FavoritesView.swift             # 즐겨찾기
│   ├── WorkoutBuilderView.swift        # 운동 프로그램 빌더
│   ├── NewWorkoutProgramView.swift     # 새 프로그램 생성
│   ├── WorkoutProgramDetailView.swift  # 프로그램 상세
│   └── SettingsView.swift              # 설정
└── PilatesApp.xcdatamodeld/         # Core Data 모델
    └── PilatesApp.xcdatamodel/
        └── contents
```

## Xcode 프로젝트 생성 방법

1. **Xcode에서 새 프로젝트 생성**
   - File → New → Project
   - iOS → App 선택
   - Product Name: `PilatesApp`
   - Interface: SwiftUI
   - Language: Swift
   - ☑️ Use Core Data 체크

2. **파일 추가**
   - 이 디렉토리의 모든 `.swift` 파일을 프로젝트에 드래그 앤 드롭
   - `PilatesApp.xcdatamodeld` 폴더를 프로젝트에 추가

3. **Core Data 모델 설정**
   - Xcode에서 `PilatesApp.xcdatamodeld` 파일 열기
   - 모델이 제대로 로드되었는지 확인

4. **빌드 및 실행**
   - 시뮬레이터 또는 실제 기기에서 실행
   - 초기 데이터가 자동으로 로드됩니다

## 주요 기능

### 1. 근육 문제 기반 추천
- CVA 측정 결과에 따른 자동 추천
- 근육 그룹별 카테고리 필터링
- 검색 기능

### 2. 필라테스 운동 데이터베이스
- 18개 근육 문제별 운동 추천
- 5가지 장비별 동작 (매트, 리포머, 캐딜락, 체어, 바렐)
- 운동 상세 설명 및 난이도 정보

### 3. 운동 프로그램 빌더
- 커스텀 운동 프로그램 생성
- 운동 추가/제거
- 세트/횟수 설정

### 4. 즐겨찾기
- 자주 사용하는 운동 저장
- 빠른 접근

### 5. 장비 필터링
- 사용 가능한 장비만 표시
- 장비별 운동 필터링

## 데이터 모델

### Core Data Entities

- **MuscleProblem**: 근육 문제 (이름, 카테고리, 설명)
- **Exercise**: 운동 (이름, 장비, 근육 그룹, 난이도, 설명)
- **ExerciseRecommendation**: 운동 추천 (근육 문제 ↔ 운동 연결)
- **MuscleGroup**: 근육 그룹 (이름, 카테고리)
- **PilatesEquipment**: 필라테스 장비 (이름, 타입)

## CVA 측정 연동

웹 앱의 CVA 측정 결과를 iOS 앱과 연동하려면:

1. 웹 앱에서 측정 결과를 JSON으로 내보내기
2. iOS 앱에서 JSON 파일을 읽어서 근육 문제 자동 매핑
3. 해당 근육 문제에 대한 필라테스 운동 자동 추천

## 추가 개발 필요 사항

1. **CVA 측정 결과 연동 API**
2. **운동 진행도 추적**
3. **운동 프로그램 일정 관리**
4. **PDF/이미지 내보내기**
5. **다국어 지원 확장**

## 라이선스

이 프로젝트는 웹 앱과 동일한 라이선스를 따릅니다.










