import type { SfxKind } from '../hooks/useSoundEffects';

// 캐릭터 대사 맨 앞에 오는 의성어(동물 울음소리, 효과음 등)를 찾아서 TTS로 읽을 부분과
// 분리한다. 의성어는 화면 말풍선에는 그대로 보이지만, 소리 내어 읽지는 않고 대신
// 짧은 효과음(useSoundEffects)으로 대체한다.
const RULES: { pattern: RegExp; sfx: SfxKind }[] = [
  { pattern: /^두구두구(?:두구)?[.…]*\s*/, sfx: 'drumroll' },
  { pattern: /^크아앙[!.…]*\s*/, sfx: 'roar' },
  { pattern: /^야옹~?[,!.…]*\s*/, sfx: 'meow' },
  { pattern: /^냐옹[,!.…]*\s*/, sfx: 'meow' },
  { pattern: /^부엉부엉[,!.…]*\s*/, sfx: 'hoot' },
  { pattern: /^부엉+[.…]*\s*/, sfx: 'hoot' }, // '부엉...' 단독으로 쓰인 경우
];

export interface OnomatopoeiaSplit {
  speech: string; // TTS로 읽을 부분 (의성어 제외)
  sfx: SfxKind | null; // 의성어 대신 재생할 효과음
}

/** 문장 맨 앞의 의성어를 찾아 분리한다. 없으면 원문을 그대로 speech로 돌려준다. */
export function extractOnomatopoeia(text: string): OnomatopoeiaSplit {
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      const rest = text.replace(rule.pattern, '').trim();
      return { speech: rest.length > 0 ? rest : text, sfx: rule.sfx };
    }
  }
  return { speech: text, sfx: null };
}
