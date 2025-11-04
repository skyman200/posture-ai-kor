# 배포 가이드

## GitHub Pages 배포 단계

### 1. GitHub 저장소 생성

1. GitHub에 로그인
2. 새 저장소 생성 (Repository name: `posture-ai-kor`)
3. Public으로 설정
4. 저장소 생성

### 2. package.json 수정

✅ **완료됨**: `package.json`의 `homepage` 필드가 이미 `skyman200`으로 설정되어 있습니다.

### 3. 원격 저장소 연결 및 배포

터미널에서 다음 명령어 실행:

```bash
# 원격 저장소 추가
git remote add origin https://github.com/skyman200/posture-ai-kor.git

# main 브랜치로 푸시
git branch -M main
git push -u origin main

# GitHub Pages 배포
npm run deploy
```

### 4. 접속 확인

배포 완료 후 약 1-2분 후 다음 주소로 접속:
```
https://skyman200.github.io/posture-ai-kor
```

## 로컬 개발

```bash
# 개발 서버 실행
npm run dev

# 빌드 테스트
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 참고사항

- GitHub Pages 배포는 `gh-pages` 브랜치에 자동으로 생성됩니다.
- 배포 후 변경사항이 반영되지 않으면 브라우저 캐시를 지워보세요.
- 모든 처리는 브라우저 로컬에서 수행되므로 서버가 필요 없습니다.

