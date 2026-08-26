import type { WordEntry } from '../data/words';

export type Phase =
  | 'intro'
  | 'character-turn'
  | 'player-turn'
  | 'character-thinking'
  | 'victory'
  | 'game-clear';

export type Speaker = 'character' | 'player' | 'reveal';

export interface ChainItem {
  speaker: Speaker;
  entry: WordEntry;
}

export type HintStage = 0 | 1 | 2;

export type AnswerFeedback = 'not-a-word' | 'wrong-start' | 'already-used' | null;
