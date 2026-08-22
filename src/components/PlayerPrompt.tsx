import type { WordEntry } from '../data/words';
import type { AnswerFeedback, HintStage } from '../game/types';
import { initialConsonant } from '../game/engine';

interface PlayerPromptProps {
  requiredStart: string;
  hintStage: HintStage;
  hintEntry: WordEntry | null;
  feedback: AnswerFeedback;
  heard: string;
}

const FEEDBACK_TEXT: Record<Exclude<AnswerFeedback, null>, string> = {
  'not-a-word': '음... 그런 단어는 아직 못 찾았어요. 다시 한번 말해볼까요?',
  'wrong-start': `'{start}'로 시작하는 단어가 아니에요. 다시 한번 도전해볼까요?`,
  'already-used': '앗, 그 단어는 이미 나왔어요! 다른 단어를 생각해볼까요?',
};

export function PlayerPrompt({ requiredStart, hintStage, hintEntry, feedback, heard }: PlayerPromptProps) {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <div className="animate-pop flex items-center gap-2 rounded-full bg-white px-5 py-2.5 shadow-md">
        <span className="text-2xl font-black text-pink-500">{requiredStart}</span>
        <span className="text-sm font-bold text-slate-500 sm:text-base">로 시작하는 단어를 말해보세요!</span>
      </div>

      {heard && (
        <div className="rounded-2xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-500 shadow">
          👂 내가 들은 말: <span className="text-slate-700">{heard}</span>
        </div>
      )}

      {feedback && (
        <div className="animate-bounce-in rounded-2xl bg-orange-100 px-4 py-2.5 text-center text-sm font-bold text-orange-600 sm:text-base">
          {FEEDBACK_TEXT[feedback].replace('{start}', requiredStart)}
        </div>
      )}

      {hintStage >= 1 && hintEntry && (
        <div className="animate-bounce-in flex flex-col items-center gap-1 rounded-2xl bg-yellow-50 px-5 py-3 shadow-inner">
          <p className="text-xs font-bold text-yellow-600">💡 힌트 1: 이런 그림이에요</p>
          <span className="text-4xl">{hintEntry.emoji}</span>
        </div>
      )}
      {hintStage >= 2 && hintEntry && (
        <div className="animate-bounce-in flex flex-col items-center gap-1 rounded-2xl bg-yellow-50 px-5 py-3 shadow-inner">
          <p className="text-xs font-bold text-yellow-600">💡 힌트 2: 첫 글자는요</p>
          <span className="text-2xl font-black tracking-[0.3em] text-yellow-700">
            {initialConsonant(hintEntry.word)}
          </span>
        </div>
      )}
    </div>
  );
}
