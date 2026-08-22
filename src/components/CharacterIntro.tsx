import { useEffect } from 'react';
import type { Character } from '../data/characters';

interface CharacterIntroProps {
  character: Character;
  onStart: () => void;
  speakCharacterLine: (text: string, onEnd?: () => void) => void;
}

export function CharacterIntro({ character, onStart, speakCharacterLine }: CharacterIntroProps) {
  useEffect(() => {
    const line = character.introLines[Math.floor(Math.random() * character.introLines.length)];
    speakCharacterLine(line);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div
        className={`animate-bounce-in flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br shadow-2xl sm:h-56 sm:w-56 ${character.color}`}
      >
        <span className="animate-float text-7xl sm:text-9xl">{character.emoji}</span>
      </div>
      <p className="mt-6 text-lg font-bold text-orange-400">두구두구두구...</p>
      <h1 className="mt-1 text-3xl font-black text-slate-700 sm:text-4xl">{character.name}</h1>
      <p className="mt-2 text-base text-slate-500 sm:text-lg">{character.tagline}</p>
      <button
        type="button"
        onClick={onStart}
        className="mt-10 rounded-full bg-gradient-to-r from-orange-400 to-pink-400 px-10 py-4 text-xl font-black text-white shadow-lg transition active:scale-95 sm:text-2xl"
      >
        대결 시작! 🎮
      </button>
    </div>
  );
}
