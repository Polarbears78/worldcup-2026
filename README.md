# 🏆 2026 FIFA 월드컵 웹앱

2026 월드컵 일정·결과·순위·토너먼트 대진표·경기장을 한 화면에서 보는 웹앱입니다.
**Vite + React**로 빌드하고, `public/data.json`을 **60초마다 폴링**하여 새로고침 없이 결과를 갱신합니다.

## 구조

```
worldcup-2026/
├─ public/data.json        # 모든 데이터 (이 파일만 갱신하면 앱 전체가 바뀜)
├─ src/App.jsx             # UI + 폴링 로직
├─ src/styles.css
├─ index.html              # Vite 진입점
├─ vite.config.js          # base: './' (어떤 경로에서도 동작)
└─ .github/workflows/deploy.yml  # GitHub Pages 자동 배포
```

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:5173
```

빌드 미리보기:

```bash
npm run build && npm run preview
```

## GitHub Pages 배포

1. GitHub에 새 저장소를 만들고 푸시합니다.

   ```bash
   gh auth login                      # 최초 1회 (또는 PAT 설정)
   gh repo create worldcup-2026 --public --source=. --remote=origin --push
   ```

   (수동) 이미 저장소가 있다면:
   ```bash
   git remote add origin https://github.com/<USERNAME>/worldcup-2026.git
   git push -u origin main
   ```

2. GitHub 저장소 → **Settings → Pages → Build and deployment → Source: GitHub Actions** 선택.
3. `main`에 푸시될 때마다 `.github/workflows/deploy.yml`이 자동 빌드·배포합니다.
   배포 URL: `https://<USERNAME>.github.io/worldcup-2026/`

## 데이터 갱신 (자동)

`public/data.json`만 바꾸면 됩니다. 매일 도는 스케줄 작업이 최신 결과로 이 파일을 갱신하고
`git push`하면 GitHub Actions가 재배포 → 폴링 중인 사용자 화면에 반영됩니다.

`data.json` 스키마:
- `meta`: `asOf`(기준일), `today`(오늘 강조용 M/D), `status`, `sources`
- `groups[]`: `id`, `matches[[날짜, 대진, 경기장, 스코어|null|"live"]]`, `standings[[팀, 승점, "adv"|"elim"|""]]`
- `bracket[]`: `title`, `final?`, `ties[[경기번호, 일시, 대진]]`
- `venues[]`: `country`, `list[[도시, 경기장, 수용인원, 비고]]`
