// 한글 자모 분해/조합과 두음법칙 관련 유틸리티.

const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

interface Jamo {
  cho: number;
  jung: number;
  jong: number;
}

function decompose(ch: string): Jamo | null {
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  return {
    cho: Math.floor(code / (21 * 28)),
    jung: Math.floor((code % (21 * 28)) / 28),
    jong: code % 28,
  };
}

function compose(j: Jamo): string {
  return String.fromCharCode(0xac00 + (j.cho * 21 + j.jung) * 28 + j.jong);
}

export function initialConsonant(word: string): string {
  let result = '';
  for (const ch of word) {
    const j = decompose(ch);
    result += j ? CHO[j.cho] : ch;
  }
  return result;
}

// 중성(모음) 중 "이야어여요유예얘" 계열 — 두음법칙에서 ㄹ/ㄴ이 ㅇ으로 바뀌는 조건.
// 중성 순서: ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ (인덱스 0~20)
const I_RELATED_JUNG = new Set([2, 3, 6, 7, 12, 17, 20]); // ㅑㅒㅕㅖㅛㅠㅣ
const CHO_R = 5; // ㄹ
const CHO_N = 2; // ㄴ
const CHO_NG = 11; // ㅇ

/**
 * 두음법칙: 한자어 첫머리의 ㄹ이 'ㅣ,ㅑ,ㅕ,ㅛ,ㅠ,ㅖ,ㅒ' 앞에서는 ㅇ으로, 그 외 모음
 * 앞에서는 ㄴ으로 바뀌고, 첫머리의 ㄴ은 같은 모음들 앞에서 ㅇ으로 바뀐다
 * (예: 력→역, 름→늠, 녀→여). 이 규칙 때문에 현대 국어사전에는 원래 글자
 * ('름' 등)로 시작하는 표제어가 아예 없고 바뀐 글자('늠' 등)로만 존재하는
 * 경우가 많다. 끝말잇기에서 그런 글자가 요구되면 게임이 부당하게 막히므로,
 * 바뀐 형태를 함께 허용해야 한다. 규칙 적용 대상이 아니면 null.
 */
export function dueumVariant(ch: string): string | null {
  const j = decompose(ch);
  if (!j) return null;
  if (j.cho === CHO_R) {
    const newCho = I_RELATED_JUNG.has(j.jung) ? CHO_NG : CHO_N;
    return compose({ ...j, cho: newCho });
  }
  if (j.cho === CHO_N && I_RELATED_JUNG.has(j.jung)) {
    return compose({ ...j, cho: CHO_NG });
  }
  return null;
}

/** 이 요구 글자로 "시작한다"고 인정할 수 있는 모든 글자(원래 글자 + 두음법칙 변형, 있다면). */
export function acceptableStarts(requiredStart: string): string[] {
  const variant = dueumVariant(requiredStart);
  return variant ? [requiredStart, variant] : [requiredStart];
}
