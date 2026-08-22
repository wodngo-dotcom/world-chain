import { useState } from 'react';
import type { WordEntry } from '../data/words';
import type { Speaker } from '../game/types';

interface WordCardProps {
  entry: WordEntry;
  speaker: Speaker;
  onReplay: () => void;
}

const SPEAKER_LABEL: Record<Speaker, string> = {
  character: '상대가 말한 단어',
  player: '내가 말한 단어',
  reveal: '짠! 정답 단어',
};

export function WordCard({ entry, speaker, onReplay }: WordCardProps) {
  const [showMeaning, setShowMeaning] = useState(false);

  return (
    <div className="animate-bounce-in relative flex w-full max-w-sm flex-col items-center rounded-[2.5rem] bg-white px-6 py-8 text-center shadow-xl">
      <span className="absolute -top-3 rounded-full bg-yellow-300 px-4 py-1 text-xs font-black text-yellow-900 shadow sm:text-sm">
        {SPEAKER_LABEL[speaker]}
      </span>
      <div className="mt-3 text-7xl sm:text-8xl">{entry.emoji}</div>
      <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-700 sm:text-5xl">
        {entry.word}
      </h2>

      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={onReplay}
          className="flex items-center gap-1 rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-600 transition active:scale-95"
        >
          🔊 다시 듣기
        </button>
        <button
          type="button"
          onClick={() => setShowMeaning((v) => !v)}
          className="flex items-center gap-1 rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-600 transition active:scale-95"
        >
          📖 뜻풀이
        </button>
      </div>

      {showMeaning && (
        <p className="animate-bounce-in mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 sm:text-base">
          {entry.meaning}
        </p>
      )}
    </div>
  );
}
