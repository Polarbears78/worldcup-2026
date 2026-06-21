// football-data.org에서 2026 월드컵 경기 스코어 + 공식 순위표를 받아
// public/data.json을 갱신한다. (GitHub Actions에서 주기 실행 — CORS 없음, 키는 Secret)
//
// 사용: FOOTBALL_DATA_KEY=<키> node scripts/update-data.mjs
// 종료코드 0. 변경 여부는 stdout의 "CHANGED" / "NOCHANGE"로 표시.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { toKo } from '../src/teams.js'
import { matchTeams } from '../src/live.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '..', 'public', 'data.json')
const KEY = process.env.FOOTBALL_DATA_KEY
const BASE = 'https://api.football-data.org/v4/competitions/WC'

if (!KEY) { console.error('FOOTBALL_DATA_KEY 미설정'); process.exit(1) }

async function api(pathname) {
  const res = await fetch(`${BASE}${pathname}`, { headers: { 'X-Auth-Token': KEY } })
  if (!res.ok) throw new Error(`API ${pathname} → HTTP ${res.status}`)
  return res.json()
}

function groupLetter(apiGroup) {
  // "GROUP_A" → "A"
  const m = /GROUP_([A-L])/.exec(apiGroup || '')
  return m ? m[1] : null
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))
  const before = JSON.stringify(data)

  const [matchesRes, standingsRes] = await Promise.all([
    api('/matches'),
    api('/standings'),
  ])

  // 1) 경기 스코어/라이브 갱신 — (그룹, 팀쌍)으로 조인하여 API를 그대로 미러링
  // 인덱스: groupLetter + 팀쌍키 → { status, goals, live }
  const idx = {}
  for (const m of matchesRes.matches || []) {
    const gl = groupLetter(m.group)
    if (!gl) continue // 토너먼트 단계는 별도 처리(추후)
    const homeKo = toKo(m.homeTeam && (m.homeTeam.name || m.homeTeam.shortName))
    const awayKo = toKo(m.awayTeam && (m.awayTeam.name || m.awayTeam.shortName))
    if (!homeKo || !awayKo) continue
    const key = [homeKo, awayKo].sort().join('|')
    const st = m.status
    const live = st === 'IN_PLAY' || st === 'PAUSED'
    const finished = st === 'FINISHED'
    const ft = (m.score && m.score.fullTime) || {}
    const hasScore = ft.home != null && ft.away != null
    idx[`${gl}|${key}`] = {
      live, finished,
      goals: hasScore ? { [homeKo]: ft.home, [awayKo]: ft.away } : null,
    }
  }

  let scoreUpdates = 0
  const unmatched = []
  for (const g of data.groups) {
    for (const m of g.matches) {
      const mt = matchTeams(m[1])
      if (!mt) { unmatched.push(`${g.id}:${m[1]}`); continue }
      const hit = idx[`${g.id}|${mt.key}`]
      if (!hit) { unmatched.push(`${g.id}:${m[1]}`); continue }
      let newScore
      let newLive = false
      if ((hit.finished || hit.live) && hit.goals) {
        newScore = `${hit.goals[mt.ordered[0]]}-${hit.goals[mt.ordered[1]]}`
        newLive = hit.live
      } else {
        newScore = null // 미시작(예정) — API 기준으로 정리
      }
      if (m[3] !== newScore) scoreUpdates++
      m[3] = newScore
      if (newLive) m[4] = true
      else if (m.length > 4) m.length = 4
    }
  }
  if (unmatched.length) console.log('UNMATCHED:', unmatched.join(' | '))

  // 2) 순위표 갱신 — 공식 standings(TOTAL) 사용, 기존 태그(adv/elim)는 팀명 기준 보존
  const stByGroup = {}
  for (const s of standingsRes.standings || []) {
    if (s.type !== 'TOTAL') continue
    const gl = (/(Group|그룹)\s*([A-L])/.exec(s.group) || [])[2]
      || (s.group && s.group.trim().slice(-1)) // "Group A" → A
    if (!gl) continue
    stByGroup[gl] = s.table
  }
  for (const g of data.groups) {
    const table = stByGroup[g.id]
    if (!table) continue
    const prevTag = {}
    for (const row of g.standings) prevTag[row[0].replace(/^[^\p{L}]+/u, '').trim()] = row[2]
    g.standings = table.map(r => {
      const ko = toKo(r.team && (r.team.name || r.team.shortName)) || r.team.name
      // 기존 표기(국기 이모지 포함)를 유지하기 위해 이전 항목에서 같은 KO 찾기
      const prev = g.standings.find(x => x[0].includes(ko))
      const label = prev ? prev[0] : ko
      const tag = prev ? prev[2] : ''
      return [label, r.points, tag]
    })
  }

  // 3) 메타 갱신
  const now = new Date()
  const y = now.getUTCFullYear(), mo = now.getUTCMonth() + 1, d = now.getUTCDate()
  data.meta.asOf = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  data.meta.today = `${mo}/${d}`
  const allFinished = (matchesRes.matches || [])
    .filter(m => groupLetter(m.group))
    .every(m => m.status === 'FINISHED')
  data.meta.status = allFinished ? '토너먼트 단계' : '조별리그 진행 중'

  const after = JSON.stringify(data)
  if (after === before) { console.log('NOCHANGE'); return }
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n')
  console.log(`CHANGED scoreUpdates=${scoreUpdates}`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
