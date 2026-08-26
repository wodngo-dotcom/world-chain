// 실시간(API) 단어 후보를 캐릭터가 말하기 전에 걸러내기 위한 안전장치.
// 정적 사전 목록(dictionaryWords.ts)을 만들 때 쓴 것과 같은 기준.
const BLOCK_TERMS = [
  '씨발', '씨팔', '씹', '좆', '존나', '개새끼', '개년', '개자식', '병신', '지랄', '미친놈', '미친년',
  '창녀', '창남', '갈보', '걸레년', '보지', '자지', '붕가', '섹스', '성교', '자위', '발기', '정액',
  '강간', '성폭행', '성추행', '매춘', '윤간', '근친상간',
  '살인', '살해', '자살', '타살', '시체', '시신', '사체',
  '마약', '필로폰', '대마초', '히로뽕', '아편',
  '테러', '폭탄', '총기', '자폭',
  '변태', '포르노', '음란', '외설',
  '강도', '강탈', '폭행', '폭력배', '조폭', '깡패',
  '흉기', '칼부림',
  '씹할', '씹년', '씹놈',
];
const EXACT_ONLY = new Set(BLOCK_TERMS.filter((t) => t.length <= 2));
const SUBSTR_OK = BLOCK_TERMS.filter((t) => t.length > 2);

/** 아이 게임에 부적절한 단어(비속어/성적/폭력적 표현 등)인지 확인한다. */
export function isAppropriateWord(word: string): boolean {
  if (EXACT_ONLY.has(word)) return false;
  return !SUBSTR_OK.some((t) => word.includes(t));
}
