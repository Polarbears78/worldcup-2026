// 외부 축구 API(영문 팀명) → 앱 표기(한글) 매핑.
// football-data.org / API-Football 등에서 쓰는 다양한 표기 변형을 모두 키로 둔다.
export const EN_TO_KO = {
  // Group A
  'mexico': '멕시코',
  'south africa': '남아공',
  'korea republic': '대한민국', 'south korea': '대한민국', 'korea, republic of': '대한민국',
  'czechia': '체코', 'czech republic': '체코',
  // Group B
  'canada': '캐나다',
  'bosnia and herzegovina': '보스니아', 'bosnia-herzegovina': '보스니아', 'bosnia & herzegovina': '보스니아',
  'switzerland': '스위스',
  'qatar': '카타르',
  // Group C
  'brazil': '브라질',
  'morocco': '모로코',
  'haiti': '아이티',
  'scotland': '스코틀랜드',
  // Group D
  'united states': '미국', 'usa': '미국', 'united states of america': '미국',
  'paraguay': '파라과이',
  'australia': '호주',
  'türkiye': '튀르키예', 'turkey': '튀르키예', 'turkiye': '튀르키예',
  // Group E
  'germany': '독일',
  'curaçao': '쿠라소', 'curacao': '쿠라소',
  "côte d'ivoire": '코트디부아르', 'cote d\'ivoire': '코트디부아르', 'ivory coast': '코트디부아르',
  'ecuador': '에콰도르',
  // Group F
  'netherlands': '네덜란드',
  'japan': '일본',
  'sweden': '스웨덴',
  'tunisia': '튀니지',
  // Group G
  'belgium': '벨기에',
  'egypt': '이집트',
  'iran': '이란', 'iran, islamic republic of': '이란', 'ir iran': '이란',
  'new zealand': '뉴질랜드',
  // Group H
  'spain': '스페인',
  'cape verde': '카보베르데', 'cabo verde': '카보베르데', 'cape verde islands': '카보베르데',
  'saudi arabia': '사우디',
  'uruguay': '우루과이',
  // Group I
  'france': '프랑스',
  'senegal': '세네갈',
  'iraq': '이라크',
  'norway': '노르웨이',
  // Group J
  'argentina': '아르헨티나',
  'algeria': '알제리',
  'austria': '오스트리아',
  'jordan': '요르단',
  // Group K
  'portugal': '포르투갈',
  'congo dr': '콩고DR', 'dr congo': '콩고DR', 'congo, dr': '콩고DR',
  'democratic republic of congo': '콩고DR', 'congo democratic republic': '콩고DR',
  'uzbekistan': '우즈베키스탄',
  'colombia': '콜롬비아',
  // Group L
  'england': '잉글랜드',
  'croatia': '크로아티아',
  'ghana': '가나',
  'panama': '파나마',
}

// API의 영문 팀명을 한글 표기로 변환 (없으면 null)
export function toKo(name) {
  if (!name) return null
  const n = String(name).trim().toLowerCase()
  if (EN_TO_KO[n]) return EN_TO_KO[n]
  // 부분 일치 보정 (예: "Korea Republic" 변형 등)
  for (const [en, ko] of Object.entries(EN_TO_KO)) {
    if (n === en) return ko
  }
  return null
}
