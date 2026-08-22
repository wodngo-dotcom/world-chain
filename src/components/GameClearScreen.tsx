interface GameClearScreenProps {
  bestChainLength: number;
  onRestart: () => void;
}

export function GameClearScreen({ bestChainLength, onRestart }: GameClearScreenProps) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      {['🎉', '👑', '🎊', '⭐', '✨'].map((e, i) => (
        <span
          key={i}
          className="pointer-events-none absolute top-0 text-3xl"
          style={{
            left: `${(i * 23) % 100}%`,
            animation: `confetti-fall ${2.4 + (i % 3) * 0.5}s linear ${i * 0.2}s infinite`,
          }}
        >
          {e}
        </span>
      ))}
      <div className="animate-bounce-in text-8xl">👑</div>
      <h1 className="mt-4 text-3xl font-black text-slate-700 sm:text-4xl">
        모든 상대를 이겼어요!
      </h1>
      <p className="mt-2 text-lg text-slate-500">왕대장 호랑이까지 물리친 끝말잇기 챔피언이에요!</p>
      <p className="mt-4 rounded-full bg-white/80 px-5 py-2 text-sm font-bold text-orange-500 shadow">
        🏆 최고 기록: 단어 {bestChainLength}개 연속!
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="mt-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 px-10 py-4 text-xl font-black text-white shadow-lg transition active:scale-95 sm:text-2xl"
      >
        처음부터 다시 하기 🔄
      </button>
    </div>
  );
}
