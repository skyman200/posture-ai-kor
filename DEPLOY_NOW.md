# 배포 실행 가이드

## 현재 상태
- ✅ 원격 저장소 연결 완료: `https://github.com/skyman200/posture-ai-kor.git`
- ✅ 빌드 준비 완료
- ⚠️ GitHub 인증 필요

## 배포 방법

### 옵션 1: Personal Access Token 사용 (권장)

1. GitHub에서 Personal Access Token 생성:
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - "Generate new token (classic)" 클릭
   - `repo` 권한 체크
   - 토큰 생성 후 복사

2. 터미널에서 다음 명령어 실행:
```bash
# 코드 푸시 (사용자명: skyman200, 비밀번호: 위에서 생성한 토큰)
git push -u origin main

# 배포
npm run deploy
```

### 옵션 2: GitHub CLI 사용

```bash
# GitHub CLI 설치 (없는 경우)
brew install gh

# 로그인
gh auth login

# 코드 푸시 및 배포
git push -u origin main
npm run deploy
```

### 옵션 3: 수동으로 실행

터미널에서 직접 다음 명령어를 실행하세요:

```bash
cd "/Volumes/김ssd/앱개발/diposture"
git push -u origin main
npm run deploy
```

인증 프롬프트가 나오면:
- Username: `skyman200`
- Password: Personal Access Token (일반 비밀번호가 아님)

## 배포 완료 후

배포가 완료되면 약 1-2분 후 다음 주소로 접속:
```
https://skyman200.github.io/posture-ai-kor
```


















