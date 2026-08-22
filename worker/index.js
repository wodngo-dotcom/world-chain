// 표준국어대사전 오픈 API 프록시 (Cloudflare Workers)
//
// 클라이언트(브라우저)는 이 워커의 두 엔드포인트만 호출한다.
//   GET /search?q=단어        — 그 단어가 사전에 있는지 + 뜻풀이
//   GET /prefix?q=글자&num=30 — 그 글자로 "시작하는" 단어 목록 (끝말잇기 AI가 이어갈 단어를 찾을 때 씀)
// 국립국어원 API 인증키는 여기(서버 쪽 시크릿)에만 존재하며, 브라우저로
// 전달되는 응답에는 절대 포함되지 않는다.
//
// 배포 방법은 worker/README.md 참고.

const STDICT_ENDPOINT = 'https://stdict.korean.go.kr/api/search.do';

// 이 프록시를 호출할 수 있는 출처. 필요에 따라 좁혀도 된다.
const ALLOWED_ORIGIN = '*';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() },
  });
}

function itemsOf(channel) {
  return Array.isArray(channel?.item) ? channel.item : channel?.item ? [channel.item] : [];
}

function definitionOf(item) {
  const sense = Array.isArray(item?.sense) ? item.sense[0] : item?.sense;
  return sense?.definition ?? null;
}

/** stdict 응답에서 우리 게임에 필요한 정보(존재 여부, 대표 뜻풀이)만 뽑아낸다. */
function extractSearchResult(data) {
  const channel = data?.channel;
  const total = Number(channel?.total ?? 0);
  if (!total || total < 1) {
    return { ok: true, exists: false, total: 0, definition: null };
  }
  const items = itemsOf(channel);
  return { ok: true, exists: true, total, definition: definitionOf(items[0]) };
}

/** stdict 응답에서 "글자로 시작하는 단어" 목록(중복 제거)을 뽑아낸다. */
function extractPrefixResult(data) {
  const channel = data?.channel;
  const total = Number(channel?.total ?? 0);
  if (!total || total < 1) {
    return { ok: true, words: [] };
  }
  const seen = new Map();
  for (const item of itemsOf(channel)) {
    const word = item?.word?.trim();
    if (!word || seen.has(word)) continue;
    seen.set(word, definitionOf(item));
  }
  return { ok: true, words: Array.from(seen, ([word, definition]) => ({ word, definition })) };
}

async function callStdict(env, params) {
  if (!env.STDICT_API_KEY) return { error: 'server-misconfigured' };
  const apiUrl = new URL(STDICT_ENDPOINT);
  apiUrl.searchParams.set('key', env.STDICT_API_KEY);
  apiUrl.searchParams.set('req_type', 'json');
  for (const [k, v] of Object.entries(params)) apiUrl.searchParams.set(k, v);

  let upstream;
  try {
    upstream = await fetch(apiUrl.toString(), { cf: { cacheTtl: 3600, cacheEverything: true } });
  } catch {
    return { error: 'upstream-unreachable' };
  }
  if (!upstream.ok) return { error: 'upstream-error' };

  let data;
  try {
    data = await upstream.json();
  } catch {
    return { error: 'upstream-bad-response' };
  }
  if (data?.error) return { error: `stdict-error-${data.error.error_code ?? 'unknown'}` };
  return { data };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.trim();
    if (!q) {
      return json({ ok: false, error: 'missing-query' }, 400);
    }

    if (url.pathname === '/search') {
      const { error, data } = await callStdict(env, { q });
      if (error) return json({ ok: false, error }, 502);
      return json(extractSearchResult(data));
    }

    if (url.pathname === '/prefix') {
      const num = Math.min(Number(url.searchParams.get('num')) || 30, 100);
      const { error, data } = await callStdict(env, { q, method: 'start', num: String(num) });
      if (error) return json({ ok: false, error }, 502);
      return json(extractPrefixResult(data));
    }

    return json({ ok: false, error: 'not-found' }, 404);
  },
};
