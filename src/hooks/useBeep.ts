import { useCallback, useRef } from 'react';

/** 외부 파일 없이 짧은 "삐" 소리를 내는 훅. 마이크가 실제로 듣기 시작했음을 알려주는 용도. */
export function useBeep() {
  const ctxRef = useRef<AudioContext | null>(null);

  const beep = useCallback((frequency = 880, durationMs = 140) => {
    // 소리는 부가 기능일 뿐이므로, 여기서 어떤 이유로 실패하더라도(오디오 미지원,
    // 정책 제한 등) 절대 호출부의 나머지 로직(마이크 시작)을 막아서는 안 된다.
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
      if (!Ctor) return;
      if (!ctxRef.current) ctxRef.current = new Ctor();
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + durationMs / 1000 + 0.02);
    } catch {
      // 무시: 소리가 안 나더라도 게임 진행에는 지장이 없어야 한다
    }
  }, []);

  return beep;
}
