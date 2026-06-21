// Cloudflare Worker — football-data.org 라이브 스코어 프록시 (CORS 허용 + API 키 은닉)
//
// 왜 필요한가:
//  - football-data.org는 브라우저 직접 호출 시 CORS로 차단되고, API 키가 프런트에 노출됨.
//  - 이 워커가 서버 측에서 키를 붙여 호출하고, 응답에 CORS 헤더를 더해 돌려준다.
//
// 배포 방법:
//  1) https://dash.cloudflare.com → Workers & Pages → Create Worker
//  2) 이 파일 내용을 붙여넣고 Deploy
//  3) Settings → Variables → Secret 추가: FOOTBALL_DATA_KEY = <football-data.org 무료 키>
//  4) 배포된 워커 URL(예: https://wc-proxy.<계정>.workers.dev)을
//     public/live-config.json 의 endpoint 로 지정하고, apiKey 는 비워둠, enabled: true
//
// 무료 키 발급: https://www.football-data.org/client/register (1분, 이메일만)

const UPSTREAM = 'https://api.football-data.org/v4/competitions/WC/matches'

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    }
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })

    try {
      const upstream = await fetch(UPSTREAM, {
        headers: { 'X-Auth-Token': env.FOOTBALL_DATA_KEY || '' },
      })
      const body = await upstream.text()
      return new Response(body, {
        status: upstream.status,
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
  },
}
