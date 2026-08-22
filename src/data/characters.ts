export interface Character {
  id: string;
  name: string;
  emoji: string;
  tier: 1 | 2 | 3 | 4 | 5;
  tagline: string;
  introLines: string[];
  sayTemplates: string[];
  loseLines: string[]; // 캐릭터가 막혀서 아이가 이겼을 때
  cheerLines: string[]; // 캐릭터가 다음 단어로 이어갈 때 (가끔 표시)
  blockChance: number; // 단어가 있어도 스스로 막히는 확률 (난이도 조절용)
  color: string; // 테마 색상 (tailwind 기반 그라디언트 클래스)
}

export const CHARACTERS: Character[] = [
  {
    id: 'squirrel',
    name: '초보 다람쥐',
    emoji: '🐿️',
    tier: 1,
    tagline: '도토리를 좋아하는 귀여운 첫 상대예요',
    introLines: [
      '두구두구... 첫 번째 상대는 초보 다람쥐예요!',
      '다람쥐가 도토리를 들고 뽀르르 나타났어요!',
    ],
    sayTemplates: ['우물쭈물... {word}!', '음... {word} 어때?', '다람쥐가 힘겹게 말해요. {word}!', '어, 어... {word}!'],
    loseLines: ['으악, 모르겠다! 네가 이겼어!', '아이쿠, 다람쥐가 항복이에요!', '도토리도 다 떨어뜨렸어요! 네가 최고야!'],
    cheerLines: ['잘한다, 잘한다!', '우아, 대단해!'],
    blockChance: 0.1,
    color: 'from-amber-300 to-orange-400',
  },
  {
    id: 'cat',
    name: '성실한 고양이',
    emoji: '🐱',
    tier: 2,
    tagline: '차근차근 단어를 준비하는 노력파예요',
    introLines: [
      '두구두구... 두 번째 상대는 성실한 고양이예요!',
      '고양이가 야옹 하고 씩씩하게 등장했어요!',
    ],
    sayTemplates: ['야옹~ {word}!', '냐옹, 정답은 {word}야!', '고양이가 또박또박 말해요. {word}!'],
    loseLines: ['야옹... 더는 생각이 안 나! 네가 이겼어!', '앗, 고양이가 두 손 두 발 다 들었어요!'],
    cheerLines: ['냐옹, 좋아!', '제법인걸!'],
    blockChance: 0.07,
    color: 'from-sky-300 to-blue-400',
  },
  {
    id: 'owl',
    name: '똑똑한 부엉이',
    emoji: '🦉',
    tier: 3,
    tagline: '어려운 단어도 척척 아는 박식한 친구예요',
    introLines: [
      '두구두구... 세 번째 상대는 똑똑한 부엉이예요!',
      '부엉이가 안경을 고쳐 쓰며 나타났어요!',
    ],
    sayTemplates: ['흠, 정확히는 이렇지. {word}.', '부엉부엉, {word}가 어떨까?', '지혜롭게 말하지. {word}!'],
    loseLines: ['부엉... 이런, 모르는 단어네! 네가 이겼어!', '어허, 부엉이도 가끔은 막히는구나!'],
    cheerLines: ['부엉부엉, 훌륭해!', '제법 똑똑한걸!'],
    blockChance: 0.05,
    color: 'from-violet-300 to-purple-400',
  },
  {
    id: 'fox',
    name: '장난꾸러기 여우',
    emoji: '🦊',
    tier: 4,
    tagline: '엉뚱한 단어로 허를 찌르는 장난꾸러기예요',
    introLines: [
      '두구두구... 네 번째 상대는 장난꾸러기 여우예요!',
      '여우가 씨익 웃으며 살금살금 나타났어요!',
    ],
    sayTemplates: ['짜잔! {word}, 놀랐지?', '히히, {word}! 허를 찔렸지?', '요것도 몰랐지? {word}!'],
    loseLines: ['헉, 이번엔 내가 당했네! 네가 이겼어!', '히히... 아니 이게 아닌데! 졌다 졌어!'],
    cheerLines: ['오호, 제법인데?', '히히, 재밌다!'],
    blockChance: 0.03,
    color: 'from-rose-300 to-orange-400',
  },
  {
    id: 'tiger',
    name: '왕대장 호랑이',
    emoji: '🐯',
    tier: 5,
    tagline: '가장 어려운 단어를 아는 보스 캐릭터예요',
    introLines: [
      '두구두구두구... 드디어 왕대장 호랑이가 등장합니다!',
      '땅이 쿵쿵 울리며 왕대장 호랑이가 나타났어요!',
    ],
    sayTemplates: ['크아앙! {word}!', '왕이 명한다, {word}!', '으흠, 이 정도는 알아야지. {word}!'],
    loseLines: ['크아앙... 믿을 수 없다! 네가 왕을 이겼어!', '으으, 왕대장이 무릎을 꿇는다! 최고야!'],
    cheerLines: ['크아앙, 좋다!', '제법이구나!'],
    blockChance: 0.01,
    color: 'from-red-400 to-amber-500',
  },
];

export function characterAt(index: number): Character {
  return CHARACTERS[Math.min(index, CHARACTERS.length - 1)];
}
