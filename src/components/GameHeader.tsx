import { CHARACTERS } from '../data/characters';
import type { Progress } from '../hooks/useProgress';

interface GameHeaderProps {
  characterIndex: number;
  progress: Progress;
}

export function GameHeader({ characterIndex, progress }: GameHeaderProps) {
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
      {progress.bestChainLength > 0 && (
        <div className="flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-sm font-bold text-orange-500 shadow sm:text-base">
          🏆 최고 기록 {progress.bestChainLength}개
        </div>
      )}
    </header>
  );
}
