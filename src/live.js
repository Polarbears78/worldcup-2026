import { toKo, EN_TO_KO } from './teams.js'

// 두 한글 팀명으로 정렬된 매칭 키 (경기 순서/홈원정 무관 조인용)
export function pairKey(a, b) {
  return [a, b].sort().join('|')
}

// football-data.org 응답 → { key: { goals: { [ko]: n }, live } } 맵
// 팀별 득점을 저장해, 표시할 때 화면 표기 순서대로 스코어를 재조립한다.
function parseFootballData(json) {
  const out = {}
  const matches = (json && json.matches) || []
  for (const m of matches) {
    const homeKo = toKo(m.homeTeam && (m.homeTeam.name || m.homeTeam.shortName))
    const awayKo = toKo(m.awayTeam && (m.awayTeam.name || m.awayTeam.shortName))
    if (!homeKo || !awayKo) continue
    const st = m.status
    const live = st === 'IN_PLAY' || st === 'PAUSED'
    const finished = st === 'FINISHED'
    if (!live && !finished) continue // 예정 경기는 건너뜀
    const ft = (m.score && m.score.fullTime) || {}
    if (ft.home == null || ft.away == null) continue
    out[pairKey(homeKo, awayKo)] = { goals: { [homeKo]: ft.home, [awayKo]: ft.away }, live }
  }
  return out
}

const PARSERS = {
  'football-data': parseFootballData,
}

// 라이브 데이터 조회. 성공 시 { ok:true, byKey, count }, 실패 시 { ok:false, error }
export async function fetchLive(cfg) {
  if (!cfg || !cfg.enabled) return { ok: false, error: 'disabled' }
  const base = cfg.endpoint
  if (!base) return { ok: false, error: 'no-endpoint' }

  // corsProxy가 있으면 감싼다. (워커 모드면 endpoint 자체가 워커 URL → proxy 불필요)
  const target = cfg.corsProxy ? cfg.corsProxy + encodeURIComponent(base) : base

  const headers = {}
  if (cfg.apiKey) headers['X-Auth-Token'] = cfg.apiKey // 워커 모드면 비움(키 은닉)

  try {
    const res = await fetch(target, { headers, cache: 'no-store' })
    if (!res.ok) return { ok: false, error: `http ${res.status}` }
    const json = await res.json()
    const parse = PARSERS[cfg.provider] || parseFootballData
    const byKey = parse(json)
    return { ok: true, byKey, count: Object.keys(byKey).length }
  } catch (e) {
    return { ok: false, error: e.message || 'fetch-error' }
  }
}

// teams.js의 모든 한글 표기 (긴 이름 우선 — 부분일치 방지)
const KO_NAMES = Array.from(new Set(Object.values(EN_TO_KO)))
  .sort((a, b) => b.length - a.length)

// 경기 문자열(m[1])에서 한글 팀명 2개를 찾아,
// { key, ordered:[표기순서 첫팀, 둘째팀] } 반환 (없으면 null)
export function matchTeams(teamsText) {
  const found = []
  let t = teamsText
  for (const ko of KO_NAMES) {
    if (t.includes(ko)) {
      found.push(ko)
      t = t.replace(ko, '') // 중복 카운트 방지
      if (found.length === 2) break
    }
  }
  if (found.length !== 2) return null
  // 원문에서의 등장 위치로 표기 순서 정렬
  const ordered = [...found].sort((a, b) => teamsText.indexOf(a) - teamsText.indexOf(b))
  return { key: pairKey(found[0], found[1]), ordered }
}
