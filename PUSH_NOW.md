# 즉시 푸시 및 배포 방법

## 방법 1: GitHub CLI 사용 (가장 쉬움)

터미널에서 다음 명령어를 실행하세요:

```bash
# GitHub CLI 설치 (처음 한 번만)
brew install gh

# GitHub 로그인 (브라우저가 열리면 로그인)
gh auth login

# 코드 푸시
cd "/Volumes/김ssd/앱개발/diposture"
git push -u origin main

# 배포
npm run deploy
```

## 방법 2: Personal Access Token 사용

1. **토큰 생성**:
   - https://github.com/settings/tokens 접속
   - "Generate new token (classic)" 클릭
   - 토큰 이름: `posture-ai-kor-deploy`
   - 권한: `repo` 체크
   - "Generate token" 클릭
   - **토큰을 복사** (한 번만 보여줍니다!)

2. **터미널에서 실행**:
```bash
cd "/Volumes/김ssd/앱개발/diposture"
git push -u origin main
```

프롬프트가 나오면:
- Username: `skyman200`
- Password: **위에서 복사한 토큰** (일반 비밀번호 아님)

3. **배포**:
```bash
npm run deploy
```

## 방법 3: URL에 토큰 포함 (보안 주의)

토큰을 생성한 후:
```bash
cd "/Volumes/김ssd/앱개발/diposture"
git remote set-url origin https://YOUR_TOKEN@github.com/skyman200/posture-ai-kor.git
git push -u origin main
npm run deploy
```

⚠️ **주의**: 이 방법은 보안상 권장되지 않습니다. 사용 후 토큰을 삭제하세요.

## 배포 완료 후

약 1-2분 후 접속:
https://skyman200.github.io/posture-ai-kor










