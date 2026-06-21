import { useEffect, useMemo, useState, useCallback } from 'react'

const POLL_MS = 60000 // data.json 폴링 주기 (60초)
const DATA_URL = `${import.meta.env.BASE_URL}data.json`

function scoreClass(s) {
  if (s === null) return 'score upcoming'
  if (s === 'live') return 'score live'
  return 'score'
}
function scoreText(s) {
  if (s === null) return '예정'
  if (s === 'live') return 'LIVE'
  return s.replace('-', ' - ')
}

function Match({ m, today }) {
  return (
    <div className={'match' + (m[0] === today ? ' today' : '')}>
      <div className="date">{m[0]}</div>
      <div>
        <div className="teams">{m[1]}</div>
        <div className="venue">{m[2]}</div>
      </div>
      <div className={scoreClass(m[3])}>{scoreText(m[3])}</div>
    </div>
  )
}

function GroupCard({ g, today }) {
  return (
    <div className="group-card">
      <h3><span className="badge">{g.id}</span> Group {g.id}</h3>
      {g.matches.map((m, i) => <Match key={i} m={m} today={today} />)}
      <table className="standings">
        <thead><tr><th>순위</th><th>팀</th><th className="pts">승점</th></tr></thead>
        <tbody>
          {g.standings.map((s, i) => {
            const cls = i < 2 ? 'q' : (s[2] === 'elim' ? 'out' : '')
            return (
              <tr key={i} className={cls}>
                <td>{i + 1}</td>
                <td>
                  {s[0]}
                  {s[2] === 'adv' && <span className="tag adv">16강</span>}
                  {s[2] === 'elim' && <span className="tag elim">탈락</span>}
                </td>
                <td className="pts">{s[1]}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Schedule({ groups, today }) {
  const [filter, setFilter] = useState(null)
  const shown = filter ? groups.filter(g => g.id === filter) : groups
  return (
    <section className="section">
      <div className="filterbar">
        <button className={!filter ? 'active' : ''} onClick={() => setFilter(null)}>전체</button>
        {groups.map(g => (
          <button key={g.id} className={filter === g.id ? 'active' : ''} onClick={() => setFilter(g.id)}>{g.id}</button>
        ))}
      </div>
      <div>{shown.map(g => <GroupCard key={g.id} g={g} today={today} />)}</div>
    </section>
  )
}

function Bracket({ bracket }) {
  return (
    <section className="section">
      <p className="hint">32강 대진은 6/27 조별리그 종료 후 확정됩니다. 조 1·2위가 정해진 팀은 표기되어 있습니다.</p>
      {bracket.map((r, i) => (
        <div className="round-block" key={i}>
          <h3>{r.title}</h3>
          <div className="bracket-grid">
            {r.ties.map((t, j) => (
              <div className={'tie' + (r.final ? ' final' : '')} key={j}>
                <span className="mno">{t[0]}</span>
                {t[1] && <span className="when">{t[1]}</span>}
                <div className="pair">{t[2]}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function Venues({ venues }) {
  return (
    <section className="section">
      {venues.map((c, i) => (
        <div className="venue-country" key={i}>
          <h3>{c.country}</h3>
          <div className="venue-grid">
            {c.list.map((v, j) => (
              <div className="vcard" key={j}>
                <div className="city">{v[0]}</div>
                <div className="name">{v[1]}</div>
                <div className="cap">{v[2]}</div>
                {v[3] && <div className="note">{v[3]}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

const TABS = [
  { id: 'schedule', label: '📅 일정 & 결과' },
  { id: 'bracket', label: '🗺️ 대진표' },
  { id: 'venues', label: '🏟️ 경기장' },
]

export default function App() {
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('schedule')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('fetch failed')
      const json = await res.json()
      setData(json)
      setError(false)
      setUpdatedAt(new Date())
    } catch (e) {
      setError(true)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, POLL_MS)
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [load])

  const liveCount = useMemo(() => {
    if (!data) return 0
    return data.groups.reduce((n, g) => n + g.matches.filter(m => m[3] === 'live').length, 0)
  }, [data])

  if (!data) {
    return (
      <div className="loading">
        {error ? '데이터를 불러오지 못했습니다. data.json을 확인하세요.' : '불러오는 중…'}
      </div>
    )
  }

  const timeStr = updatedAt
    ? updatedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '-'

  return (
    <>
      <header>
        <h1>🏆 2026 FIFA 월드컵</h1>
        <div className="sub">2026.6.11 ~ 7.19 · 🇨🇦 캐나다 · 🇲🇽 멕시코 · 🇺🇸 미국 공동 개최<br />사상 첫 48개국 · 12개 조 · 총 104경기</div>
        <div className="meta">기준일 {data.meta.asOf} · {data.meta.status}</div>
        <div className="live-bar">
          {liveCount > 0 && <span className="live-dot">● LIVE {liveCount}경기 진행 중</span>}
          <span className="sync">⟳ 자동 갱신 {timeStr}{error ? ' (연결 끊김)' : ''}</span>
        </div>
      </header>

      <div className="wrap">
        <nav className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </nav>

        {tab === 'schedule' && <Schedule groups={data.groups} today={data.meta.today} />}
        {tab === 'bracket' && <Bracket bracket={data.bracket} />}
        {tab === 'venues' && <Venues venues={data.venues} />}
      </div>

      <footer>
        데이터 출처: {data.meta.sources.join(' · ')}<br />
        60초마다 data.json을 자동 폴링합니다. 스케줄 작업이 갱신하면 새로고침 없이 반영됩니다.
      </footer>
    </>
  )
}
