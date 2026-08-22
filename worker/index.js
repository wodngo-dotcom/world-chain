// 표준국어대사전 오픈 API 프록시 (Cloudflare Workers)
//
// 클라이언트(브라우저)는 이 워커의 /search?q=단어 엔드포인트만 호출한다.
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

/** stdict 응답에서 우리 게임에 필요한 정보(존재 여부, 대표 뜻풀이)만 뽑아낸다. */
function extractResult(data) {
  const channel = data?.channel;
  const total = Number(channel?.total ?? 0);
  if (!total || total < 1) {
    return { ok: true, exists: false, total: 0, definition: null };
  }
  const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : [];
  const first = items[0];
  const sense = Array.isArray(first?.sense) ? first.sense[0] : first?.sense;
  const definition = sense?.definition ?? null;
  return { ok: true, exists: true, total, definition };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/search') {
      return json({ ok: false, error: 'not-found' }, 404);
    }

    const q = url.searchParams.get('q')?.trim();
    if (!q) {
      return json({ ok: false, error: 'missing-query' }, 400);
    }

    if (!env.STDICT_API_KEY) {
      return json({ ok: false, error: 'server-misconfigured' }, 500);
    }

    const apiUrl = new URL(STDICT_ENDPOINT);
    apiUrl.searchParams.set('key', env.STDICT_API_KEY);
    apiUrl.searchParams.set('q', q);
    apiUrl.searchParams.set('req_type', 'json');

    let upstream;
    try {
      upstream = await fetch(apiUrl.toString(), { cf: { cacheTtl: 3600, cacheEverything: true } });
    } catch {
      return json({ ok: false, error: 'upstream-unreachable' }, 502);
    }

    if (!upstream.ok) {
      return json({ ok: false, error: 'upstream-error' }, 502);
    }

    let data;
    try {
      data = await upstream.json();
    } catch {
      return json({ ok: false, error: 'upstream-bad-response' }, 502);
    }

    // 국립국어원 API는 오류 시에도 200을 주고 본문에 error 코드를 담는 경우가 있다.
    if (data?.error) {
      return json({ ok: false, error: `stdict-error-${data.error.error_code ?? 'unknown'}` }, 502);
    }

    return json(extractResult(data));
  },
};
