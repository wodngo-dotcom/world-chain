import { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import type { Progress } from '../hooks/useProgress';

interface GameHeaderProps {
  characterIndex: number;
  progress: Progress;
  onRestart: () => void;
}

export function GameHeader({ characterIndex, progress, onRestart }: GameHeaderProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <header className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        {CHARACTERS.map((c, i) => {
          const defeated = progress.defeatedCharacterIds.includes(c.id);
          const isCurrent = i === characterIndex;
          return (
            <div
              key={c.id}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-all sm:h-11 sm:w-11 sm:text-2xl ${
                isCurrent
                  ? 'scale-110 bg-white shadow-lg ring-4 ring-yellow-300'
                  : defeated
                    ? 'bg-white/80 opacity-90'
                    : 'bg-white/40 grayscale opacity-60'
              }`}
              title={c.name}
            >
              {defeated ? '⭐' : c.emoji}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {progress.bestChainLength > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-sm font-bold text-orange-500 shadow sm:text-base">
            🏆 최고 기록 {progress.bestChainLength}개
          </div>
        )}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-lg shadow transition active:scale-95 sm:h-11 sm:w-11 sm:text-xl"
          aria-label="처음부터 다시 시작"
          title="처음부터 다시 시작"
        >
          🔄
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="animate-bounce-in w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl">
            <p className="text-3xl">🐿️</p>
            <p className="mt-2 text-base font-bold text-slate-700">
              1단계 다람쥐부터 처음부터 다시 시작할까요?
            </p>
            <p className="mt-1 text-sm text-slate-500">지금까지의 기록이 모두 초기화돼요.</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-full bg-slate-200 py-2.5 text-sm font-black text-slate-600 transition active:scale-95"
              >
                아니요
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  onRestart();
                }}
                className="flex-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 py-2.5 text-sm font-black text-white transition active:scale-95"
              >
                네, 시작할래요
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
