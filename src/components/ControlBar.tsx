interface ControlBarProps {
  disabled: boolean;
  listening: boolean;
  micSupported: boolean;
  onMicPress: () => void;
  onHint: () => void;
  onGiveUp: () => void;
}

export function ControlBar({
  disabled,
  listening,
  micSupported,
  onMicPress,
  onHint,
  onGiveUp,
}: ControlBarProps) {
  return (
    <div className="flex w-full flex-col items-center gap-4 pb-6 pt-2">
      <button
        type="button"
        disabled={disabled || !micSupported}
        onClick={onMicPress}
        className={`relative flex h-20 w-20 items-center justify-center rounded-full text-4xl text-white shadow-xl transition active:scale-95 disabled:opacity-40 sm:h-24 sm:w-24 ${
          listening ? 'bg-red-500 animate-pulse-ring' : 'bg-gradient-to-br from-pink-400 to-rose-500'
        }`}
        aria-label="마이크로 말하기"
      >
        {listening ? '🔴' : '🎤'}
      </button>
      {!micSupported && (
        <p className="max-w-xs text-center text-xs font-semibold text-red-500">
          이 브라우저는 음성 인식을 지원하지 않아요. 크롬 브라우저로 열어보세요!
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onHint}
          className="rounded-full bg-yellow-400 px-5 py-2.5 text-sm font-black text-white shadow transition active:scale-95 disabled:opacity-40 sm:text-base"
        >
          💡 힌트
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onGiveUp}
          className="rounded-full bg-slate-300 px-5 py-2.5 text-sm font-black text-slate-600 shadow transition active:scale-95 disabled:opacity-40 sm:text-base"
        >
          🤷 몰라요
        </button>
      </div>
    </div>
  );
}
