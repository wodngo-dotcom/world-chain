import type { Character } from '../data/characters';

interface VictoryScreenProps {
  character: Character;
  chainLength: number;
  onContinue: () => void;
}

const CONFETTI = ['🎉', '⭐', '🎊', '✨', '🏆'];

export function VictoryScreen({ character, chainLength, onContinue }: VictoryScreenProps) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="pointer-events-none absolute top-0 text-2xl"
          style={{
            left: `${(i * 37) % 100}%`,
            animation: `confetti-fall ${2 + (i % 4) * 0.4}s linear ${i * 0.15}s infinite`,
          }}
        >
          {CONFETTI[i % CONFETTI.length]}
        </span>
      ))}

      <div className="animate-bounce-in text-8xl">🏆</div>
      <h1 className="mt-4 text-3xl font-black text-slate-700 sm:text-4xl">
        {character.name}를 이겼어요!
      </h1>
      <p className="mt-2 text-lg text-slate-500">
        <span className="text-4xl">{character.emoji}</span> {character.loseLines[0]}
      </p>
      <p className="mt-4 rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-orange-500 shadow">
        이번 판 이어간 단어 {chainLength}개!
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 px-10 py-4 text-xl font-black text-white shadow-lg transition active:scale-95 sm:text-2xl"
      >
        다음 상대 만나기 ➡️
      </button>
    </div>
  );
}
