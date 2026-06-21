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

## 실시간 스코어 (라이브 API)

기본 동작은 `data.json`(하루 1회 스케줄 갱신)이고, 그 위에 **라이브 API 오버레이**를 얹어
진행 중 경기의 스코어를 분 단위로 덮어쓸 수 있습니다. 설정은 `public/live-config.json`에서 합니다.

정적 사이트(GitHub Pages)는 외부 API를 직접 부르면 **CORS로 차단**되고 키가 노출되므로,
키를 숨겨주는 **Cloudflare Worker 프록시**(`cloudflare/worker.js`)를 두는 방식을 권장합니다.

### 설정 절차 (권장)
1. **무료 키 발급** — https://www.football-data.org/client/register (이메일만, 1분)
2. **Worker 배포** — `cloudflare/worker.js` 파일 주석의 안내대로 Cloudflare에 배포하고,
   Secret `FOOTBALL_DATA_KEY`에 발급받은 키를 넣는다. 배포되면 `https://...workers.dev` URL이 나온다.
3. **앱 연결** — `public/live-config.json`을 아래처럼 수정 후 커밋·푸시:
   ```json
   {
     "enabled": true,
     "provider": "football-data",
     "endpoint": "https://<당신의-워커>.workers.dev",
     "apiKey": "",
     "corsProxy": "",
     "pollSeconds": 60
   }
   ```
4. 앱 상단에 `🟢 라이브 API 연결됨 (N경기)`가 뜨면 성공. 진행 중 경기 스코어가 60초마다 갱신된다.

### 프록시 없이 (비권장)
워커가 부담되면 공용 CORS 프록시를 쓸 수 있으나(키가 노출되고 불안정),
`endpoint`는 football-data URL, `apiKey`에 키, `corsProxy`에 프록시 접두사(`https://corsproxy.io/?url=` 등)를 넣는다.

> 참고: football-data.org 무료 티어는 분당 10요청 제한이며, 분 단위 라이브 갱신 범위는 제공자 정책을 따른다.
> 라이브 API가 비활성/오류여도 앱은 항상 `data.json`으로 폴백한다(화면이 비지 않음).

## 데이터 갱신 (자동)

`public/data.json`만 바꾸면 됩니다. 매일 도는 스케줄 작업이 최신 결과로 이 파일을 갱신하고
`git push`하면 GitHub Actions가 재배포 → 폴링 중인 사용자 화면에 반영됩니다.

`data.json` 스키마:
- `meta`: `asOf`(기준일), `today`(오늘 강조용 M/D), `status`, `sources`
- `groups[]`: `id`, `matches[[날짜, 대진, 경기장, 스코어|null|"live"]]`, `standings[[팀, 승점, "adv"|"elim"|""]]`
- `bracket[]`: `title`, `final?`, `ties[[경기번호, 일시, 대진]]`
- `venues[]`: `country`, `list[[도시, 경기장, 수용인원, 비고]]`
