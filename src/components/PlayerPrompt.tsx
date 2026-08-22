import type { WordEntry } from '../data/words';
import type { AnswerFeedback, HintStage } from '../game/types';
import { initialConsonant } from '../game/engine';

interface PlayerPromptProps {
  requiredStart: string;
  hintStage: HintStage;
  hintEntry: WordEntry | null;
  feedback: AnswerFeedback;
  heard: string;
  micError: string | null;
  dictionaryChecking: boolean;
}

const FEEDBACK_TEXT: Record<Exclude<AnswerFeedback, null>, string> = {
  'not-a-word': '음... 그런 단어는 아직 못 찾았어요. 다시 한번 말해볼까요?',
  'wrong-start': `'{start}'로 시작하는 단어가 아니에요. 다시 한번 도전해볼까요?`,
  'already-used': '앗, 그 단어는 이미 나왔어요! 다른 단어를 생각해볼까요?',
};

const MIC_ERROR_TEXT: Record<string, string> = {
  'not-allowed': '🎤 마이크 권한이 꺼져 있어요. 주소창의 자물쇠 아이콘에서 마이크를 "허용"으로 바꿔주세요.',
  'service-not-allowed': '🎤 마이크 권한이 꺼져 있어요. 주소창의 자물쇠 아이콘에서 마이크를 "허용"으로 바꿔주세요.',
  'no-speech': '🎤 소리가 안 들렸어요. 마이크 가까이서 다시 말해볼까요?',
  'audio-capture': '🎤 마이크를 찾을 수 없어요. 마이크가 연결되어 있는지 확인해주세요.',
  'network': '🎤 음성 인식 연결이 원활하지 않아요. 잠시 후 다시 시도해주세요.',
  'start-failed': '🎤 마이크가 응답하지 않아요. 브라우저 마이크 권한을 확인하거나, 새로고침 후 다시 시도해주세요.',
  'aborted': '',
};

function micErrorMessage(code: string): string {
  return MIC_ERROR_TEXT[code] ?? '🎤 음성 인식에 문제가 생겼어요. 마이크 버튼을 다시 눌러볼까요?';
}

export function PlayerPrompt({
  requiredStart,
  hintStage,
  hintEntry,
  feedback,
  heard,
  micError,
  dictionaryChecking,
}: PlayerPromptProps) {
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

      {dictionaryChecking && (
        <div className="animate-bounce-in flex items-center gap-2 rounded-2xl bg-sky-100 px-4 py-2.5 text-center text-sm font-bold text-sky-600 sm:text-base">
          <span className="inline-flex gap-1">
            <span className="animate-bounce [animation-delay:0ms]">·</span>
            <span className="animate-bounce [animation-delay:150ms]">·</span>
            <span className="animate-bounce [animation-delay:300ms]">·</span>
          </span>
          📖 사전에서 찾아보는 중이에요
        </div>
      )}

      {feedback && (
        <div className="animate-bounce-in rounded-2xl bg-orange-100 px-4 py-2.5 text-center text-sm font-bold text-orange-600 sm:text-base">
          {FEEDBACK_TEXT[feedback].replace('{start}', requiredStart)}
        </div>
      )}

      {micError && micErrorMessage(micError) && (
        <div className="animate-bounce-in rounded-2xl bg-red-100 px-4 py-2.5 text-center text-sm font-bold text-red-600 sm:text-base">
          {micErrorMessage(micError)}
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
