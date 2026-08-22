import { WORDS, type WordEntry } from '../data/words';
import type { Character } from '../data/characters';

const WORDS_BY_START = new Map<string, WordEntry[]>();
for (const w of WORDS) {
  const key = w.word[0];
  const list = WORDS_BY_START.get(key) ?? [];
  list.push(w);
  WORDS_BY_START.set(key, list);
}

export const WORD_SET = new Map(WORDS.map((w) => [w.word, w]));

export function lastChar(word: string): string {
  return word[word.length - 1];
}

export type AnswerRejection = 'not-a-word' | 'wrong-start' | 'already-used';

export interface AnswerCheck {
  ok: boolean;
  reason?: AnswerRejection;
  entry?: WordEntry;
}

/** 아이의 답변이 유효한지 검사한다 (사전 존재 여부, 시작 글자, 중복 여부). */
export function checkAnswer(
  raw: string,
  requiredStart: string,
  usedWords: ReadonlySet<string>,
): AnswerCheck {
  const candidate = raw.trim();
  const entry = WORD_SET.get(candidate);
  if (!entry) return { ok: false, reason: 'not-a-word' };
  if (candidate[0] !== requiredStart) return { ok: false, reason: 'wrong-start' };
  if (usedWords.has(candidate)) return { ok: false, reason: 'already-used' };
  return { ok: true, entry };
}

function randomFrom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** AI 캐릭터가 이어갈 수 있는, 아직 쓰이지 않은 단어 후보를 자신의 난이도 풀 안에서 찾는다. */
export function findAiCandidates(
  character: Character,
  requiredStart: string,
  usedWords: ReadonlySet<string>,
): WordEntry[] {
  const pool = WORDS_BY_START.get(requiredStart) ?? [];
  return pool.filter((w) => w.tier <= character.tier && !usedWords.has(w.word));
}

export type AiTurnResult =
  | { ok: true; entry: WordEntry }
  | { ok: false; reason: 'no-candidate' | 'rolled-block' };

/** AI 캐릭터의 턴: 후보가 없으면 강제로 막히고, 있어도 캐릭터의 막힘 확률에 따라 막힐 수 있다. */
export function takeAiTurn(
  character: Character,
  requiredStart: string,
  usedWords: ReadonlySet<string>,
): AiTurnResult {
  const candidates = findAiCandidates(character, requiredStart, usedWords);
  if (candidates.length === 0) return { ok: false, reason: 'no-candidate' };
  if (Math.random() < character.blockChance) return { ok: false, reason: 'rolled-block' };
  const entry = randomFrom(candidates)!;
  return { ok: true, entry };
}

/** 캐릭터가 라운드를 여는 첫 단어를 자신의 난이도 풀에서 무작위로 고른다. */
export function pickOpeningWord(character: Character, usedWords: ReadonlySet<string>): WordEntry {
  const pool = WORDS.filter((w) => w.tier <= character.tier && w.word.length >= 2 && !usedWords.has(w.word));
  const entry = randomFrom(pool);
  if (entry) return entry;
  // 안전망: 모든 단어를 다 썼다면 티어 무시하고 아무 단어나 (사실상 발생하지 않음)
  return randomFrom(WORDS.filter((w) => !usedWords.has(w.word))) ?? WORDS[0];
}

/** 힌트/정답 공개용: 요구 글자로 시작하는, 아직 쓰이지 않은 단어를 티어 제한 없이 하나 찾는다. */
export function pickHintWord(requiredStart: string, usedWords: ReadonlySet<string>): WordEntry | null {
  const pool = WORDS_BY_START.get(requiredStart) ?? [];
  const available = pool.filter((w) => !usedWords.has(w.word));
  return randomFrom(available);
}

export function initialConsonant(word: string): string {
  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  let result = '';
  for (const ch of word) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) {
      result += ch;
      continue;
    }
    const choIndex = Math.floor(code / (21 * 28));
    result += CHO[choIndex];
  }
  return result;
}

/** 레벤슈타인 거리: 음성인식 결과의 발음 오차를 관대하게 허용하기 위해 사용 */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

/**
 * 음성인식 결과와 정확히 일치하는 단어가 없을 때, 발음이 비슷한 후보를 관대하게 찾는다.
 * 시작 글자가 같은 단어들 중 편집 거리가 짧은 순으로 가장 가까운 것을 반환한다.
 */
export function findClosestWord(transcript: string, requiredStart: string): WordEntry | null {
  const candidates = WORDS_BY_START.get(requiredStart) ?? [];
  if (candidates.length === 0) return null;
  const threshold = transcript.length <= 2 ? 1 : 2;
  let best: WordEntry | null = null;
  let bestDist = Infinity;
  for (const w of candidates) {
    const dist = levenshtein(transcript, w.word);
    if (dist < bestDist) {
      bestDist = dist;
      best = w;
    }
  }
  if (best && bestDist <= threshold) return best;
  return null;
}
