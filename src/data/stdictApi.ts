// 표준국어대사전 오픈 API 연동 (worker/ 프록시를 통해서만 호출한다).
// 인증키는 이 파일에도, 어떤 클라이언트 코드에도 절대 존재하지 않는다 — 프록시(Cloudflare
// Workers)의 서버 쪽 시크릿으로만 보관되고, 브라우저는 프록시 주소만 안다.

const PROXY_URL = (import.meta.env.VITE_STDICT_PROXY_URL as string | undefined)?.trim();

export interface StdictLookup {
  exists: boolean;
  definition: string | null;
}

/** 프록시가 설정되어 있지 않으면 항상 null을 반환해, 이 기능 없이도 게임이 정상 동작하게 한다. */
export const stdictEnabled = Boolean(PROXY_URL);

/**
 * 표준국어대사전에서 단어를 찾는다. 프록시 미설정, 네트워크 실패, 타임아웃 등
 * 어떤 이유로든 확인할 수 없으면 null을 반환한다 (오답 처리가 아니라 "모르겠음"으로 취급).
 */
export async function lookupStdict(word: string): Promise<StdictLookup | null> {
  if (!PROXY_URL) return null;
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${PROXY_URL}/search?q=${encodeURIComponent(word)}`, {
      signal: controller.signal,
    });
    window.clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; exists?: boolean; definition?: string | null };
    if (!data.ok) return null;
    return { exists: Boolean(data.exists), definition: data.definition ?? null };
  } catch {
    return null;
  }
}

export interface StdictPrefixWord {
  word: string;
  definition: string | null;
}

/**
 * 표준국어대사전에서 이 글자로 "시작하는" 단어 목록을 찾는다 (끝말잇기 AI가 아동 목록
 * 과 로컬 확장 사전 어디에도 이어갈 단어가 없을 때 마지막으로 시도하는 수단).
 * 프록시 미설정, 네트워크 실패 등 어떤 이유로든 찾을 수 없으면 null을 반환한다.
 */
export async function lookupStdictPrefix(prefix: string): Promise<StdictPrefixWord[] | null> {
  if (!PROXY_URL) return null;
  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${PROXY_URL}/prefix?q=${encodeURIComponent(prefix)}&num=30`, {
      signal: controller.signal,
    });
    window.clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as { ok?: boolean; words?: StdictPrefixWord[] };
    if (!data.ok || !Array.isArray(data.words)) return null;
    return data.words;
  } catch {
    return null;
  }
}
