# DIT 자세 분석 AI (한국어)

- 사진 업로드 → 5포인트 자동/수동 보정 → 각도 계산 → 근육 타이트/약화/추천
- 브라우저 로컬 처리 (개인정보 업로드 없음)
- GitHub Pages로 누구나 접속하여 실행 가능

## 실행

```bash
npm i
npm run dev
```

## 배포 (GitHub Pages)

```bash
npm run deploy
```

먼저 GitHub에 public repo를 생성하고, `package.json`의 `homepage` 필드를 실제 GitHub 사용자명으로 수정하세요.

```json
"homepage": "https://<깃허브아이디>.github.io/posture-ai-kor"
```

그 다음:

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<깃허브아이디>/posture-ai-kor.git
git push -u origin main

npm run deploy
```

접속: `https://<깃허브아이디>.github.io/posture-ai-kor`
