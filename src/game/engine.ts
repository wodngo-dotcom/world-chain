import { WORDS, type WordEntry } from '../data/words';
import { DICTIONARY_WORDS } from '../data/dictionaryWords';
import type { Character } from '../data/characters';

// AI 캐릭터가 다음 단어를 고를 때 쓰는 풀. 아동 수준 단어만 포함하며 그대로 유지한다.
const WORDS_BY_START = new Map<string, WordEntry[]>();
for (const w of WORDS) {
  const key = w.word[0];
  const list = WORDS_BY_START.get(key) ?? [];
  list.push(w);
  WORDS_BY_START.set(key, list);
}

export const WORD_SET = new Map(WORDS.map((w) => [w.word, w]));

// 아이의 답변을 판정할 때만 쓰는, 훨씬 더 큰 사전 단어 목록 (한 글자 단어는 이미 제외되어 있음).
const DICTIONARY_SET = new Set(DICTIONARY_WORDS);
const DICTIONARY_BY_START = new Map<string, string[]>();
for (const w of DICTIONARY_WORDS) {
  const key = w[0];
  const list = DICTIONARY_BY_START.get(key) ?? [];
  list.push(w);
  DICTIONARY_BY_START.set(key, list);
}

/** 아동 수준 목록에 없는 사전 단어를 위한 대체 표시(그림/뜻풀이가 따로 없음을 알려줌). */
function syntheticEntry(word: string): WordEntry {
  return { word, meaning: '아직 그림과 뜻풀이가 준비되지 않은 단어예요. 그래도 정답으로 인정돼요!', emoji: '📘', tier: 5 };
}

/** 아이가 말한 단어인지(아동 목록 + 사전 전체) 찾아 표시용 항목을 돌려준다. 없으면 null. */
function findAnswerEntry(word: string): WordEntry | null {
  const kidEntry = WORD_SET.get(word);
  if (kidEntry) return kidEntry;
  if (DICTIONARY_SET.has(word)) return syntheticEntry(word);
  return null;
}

export function lastChar(word: string): string {
  return word[word.length - 1];
}

export type AnswerRejection = 'not-a-word' | 'wrong-start' | 'already-used';

export interface AnswerCheck {
  ok: boolean;
  reason?: AnswerRejection;
  entry?: WordEntry;
}

/**
 * 아이의 답변이 유효한지 검사한다 (사전 존재 여부, 시작 글자, 중복 여부).
 * 존재 여부는 아동 수준 단어 목록뿐 아니라 표준국어대사전 기반의 훨씬 넓은 사전
 * 단어 목록까지 함께 확인한다 (단, 한 글자 단어는 제외).
 */
export function checkAnswer(
  raw: string,
  requiredStart: string,
  usedWords: ReadonlySet<string>,
): AnswerCheck {
  const candidate = raw.trim();
  if (candidate.length < 2) return { ok: false, reason: 'not-a-word' };
  const entry = findAnswerEntry(candidate);
  if (!entry) return { ok: false, reason: 'not-a-word' };
  if (candidate[0] !== requiredStart) return { ok: false, reason: 'wrong-start' };
  if (usedWords.has(candidate)) return { ok: false, reason: 'already-used' };
  return { ok: true, entry };
}

function randomFrom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** AI 캐릭터가 이어갈 수 있는, 아직 쓰이지 않은 단어 후보를 자신의 난이도 풀 안에서 찾는다 (한 글자 단어는 AI가 쓰지 않는다). */
export function findAiCandidates(
  character: Character,
  requiredStart: string,
  usedWords: ReadonlySet<string>,
): WordEntry[] {
  const pool = WORDS_BY_START.get(requiredStart) ?? [];
  return pool.filter((w) => w.tier <= character.tier && w.word.length >= 2 && !usedWords.has(w.word));
}

/** 티어 제한 없이, 아직 쓰이지 않은 후보를 사전 전체에서 찾는다 (최소 게임 길이를 보장하기 위한 보조 탐색용). */
function findAnyCandidates(requiredStart: string, usedWords: ReadonlySet<string>): WordEntry[] {
  const pool = WORDS_BY_START.get(requiredStart) ?? [];
  return pool.filter((w) => w.word.length >= 2 && !usedWords.has(w.word));
}

export type AiTurnResult =
  | { ok: true; entry: WordEntry }
  | { ok: false; reason: 'no-candidate' | 'rolled-block' };

/** 이 라운드 안에서 최소 이만큼 단어가 오갈 때까지는 캐릭터가 확률로 막히지 않는다 (최소 게임 길이 보장). */
export const MIN_CHAIN_LENGTH_BEFORE_BLOCK = 10;

/**
 * AI 캐릭터의 턴: 이어갈 단어 후보가 아예 없으면 강제로 막히고,
 * 후보가 있어도 (최소 라운드 수를 넘긴 뒤부터) 캐릭터의 막힘 확률에 따라 막힐 수 있다.
 */
export function takeAiTurn(
  character: Character,
  requiredStart: string,
  usedWords: ReadonlySet<string>,
  chainLengthSoFar: number,
): AiTurnResult {
  const canRollBlock = chainLengthSoFar >= MIN_CHAIN_LENGTH_BEFORE_BLOCK;
  let candidates = findAiCandidates(character, requiredStart, usedWords);
  if (candidates.length === 0 && !canRollBlock) {
    // 최소 게임 길이에 도달하기 전이라면, 캐릭터의 난이도 풀을 넘어서라도 사전 전체에서 이어갈 단어를 찾아본다
    candidates = findAnyCandidates(requiredStart, usedWords);
  }
  if (candidates.length === 0) return { ok: false, reason: 'no-candidate' };
  if (canRollBlock && Math.random() < character.blockChance) return { ok: false, reason: 'rolled-block' };
  const entry = randomFrom(candidates)!;
  return { ok: true, entry };
}

/** 이 단어의 끝 글자로 시작하는 다른 단어가 사전 전체에 하나라도 있는지 (막다른 단어인지 아닌지). */
function hasContinuation(word: string): boolean {
  return WORDS_BY_START.has(lastChar(word));
}

/** 이어갈 수 있는 단어를 우선하고, 그런 단어가 없을 때만 막다른 단어도 허용한다. */
function preferContinuable(pool: WordEntry[]): WordEntry[] {
  const continuable = pool.filter((w) => hasContinuation(w.word));
  return continuable.length > 0 ? continuable : pool;
}

/** 캐릭터가 라운드를 여는 첫 단어를 자신의 난이도 풀에서 무작위로 고른다 (막다른 단어는 가능한 한 피한다). */
export function pickOpeningWord(character: Character, usedWords: ReadonlySet<string>): WordEntry {
  const pool = WORDS.filter((w) => w.tier <= character.tier && w.word.length >= 2 && !usedWords.has(w.word));
  const entry = randomFrom(preferContinuable(pool));
  if (entry) return entry;
  // 안전망: 모든 단어를 다 썼다면 티어 무시하고 아무 단어나 (사실상 발생하지 않음)
  return randomFrom(WORDS.filter((w) => !usedWords.has(w.word))) ?? WORDS[0];
}

/**
 * 힌트/정답 공개용: 요구 글자로 시작하는, 아직 쓰이지 않은 단어를 티어 제한 없이 하나 찾는다.
 * avoidDeadEnd가 true면(최소 게임 길이 보장 구간) 그 자체가 막다른 단어인 후보는 가능한 한 피한다.
 */
export function pickHintWord(
  requiredStart: string,
  usedWords: ReadonlySet<string>,
  avoidDeadEnd = false,
): WordEntry | null {
  const pool = WORDS_BY_START.get(requiredStart) ?? [];
  const available = pool.filter((w) => w.word.length >= 2 && !usedWords.has(w.word));
  return randomFrom(avoidDeadEnd ? preferContinuable(available) : available);
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
 * 이미 나온 단어는 후보에서 제외한다 — 그렇지 않으면 아이가 말한 적 없는 새 단어가
 * 발음이 비슷한 "이미 쓰인" 단어로 잘못 매칭되어 '이미 나온 단어예요' 오류가 뜨게 된다.
 */
export function findClosestWord(
  transcript: string,
  requiredStart: string,
  usedWords: ReadonlySet<string>,
): WordEntry | null {
  const kidCandidates = (WORDS_BY_START.get(requiredStart) ?? []).map((w) => w.word);
  const dictCandidates = DICTIONARY_BY_START.get(requiredStart) ?? [];
  const candidates = Array.from(new Set([...kidCandidates, ...dictCandidates])).filter(
    (w) => !usedWords.has(w),
  );
  if (candidates.length === 0) return null;
  const threshold = transcript.length <= 2 ? 1 : 2;
  let best: string | null = null;
  let bestDist = Infinity;
  for (const w of candidates) {
    const dist = levenshtein(transcript, w);
    if (dist < bestDist) {
      bestDist = dist;
      best = w;
    }
  }
  if (best && bestDist <= threshold) return findAnswerEntry(best);
  return null;
}
