import type { Character } from '../data/characters';
import type { Phase } from '../game/types';

interface CharacterStageProps {
  character: Character;
  phase: Phase;
  speechLine: string;
}

export function CharacterStage({ character, phase, speechLine }: CharacterStageProps) {
  const thinking = phase === 'character-thinking';
  const talking = phase === 'character-turn';

  return (
    <div className="flex flex-col items-center">
      {(talking || thinking) && (
        <div className="animate-bounce-in mb-2 max-w-[16rem] rounded-2xl bg-white px-4 py-2 text-center text-sm font-bold text-slate-600 shadow-md sm:text-base">
          {thinking ? (
            <span className="inline-flex gap-1">
              <span className="animate-bounce [animation-delay:0ms]">·</span>
              <span className="animate-bounce [animation-delay:150ms]">·</span>
              <span className="animate-bounce [animation-delay:300ms]">·</span>
              <span className="ml-1">생각하는 중</span>
            </span>
          ) : (
            speechLine
          )}
        </div>
      )}
      <div
        className={`flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br shadow-lg sm:h-28 sm:w-28 ${character.color} ${
          thinking ? 'animate-pulse' : ''
        }`}
      >
        <span className="text-5xl sm:text-6xl">{character.emoji}</span>
      </div>
      <p className="mt-1 text-sm font-bold text-slate-500">{character.name}</p>
    </div>
  );
}
