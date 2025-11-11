# 빠른 배포 (3단계)

## 1단계: 토큰 생성 (1분)
https://github.com/settings/tokens 접속
- "Generate new token (classic)" 클릭
- `repo` 체크
- "Generate token" 클릭
- **토큰 복사** (예: ghp_xxxxxxxxxxxxxxxxxxxx)

## 2단계: 터미널 실행
```bash
cd "/Volumes/김ssd/앱개발/diposture"
git push -u origin main
```
- Username: `skyman200`
- Password: **복사한 토큰 붙여넣기**

## 3단계: 배포
```bash
npm run deploy
```

완료! https://skyman200.github.io/posture-ai-kor


















