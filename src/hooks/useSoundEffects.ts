import { useCallback, useRef } from 'react';

// 캐릭터 대사에서 의성어(크아앙, 야옹, 부엉부엉, 두구두구 등)를 TTS로 읽는 대신
// 재생하는 짧은 효과음. 외부 오디오 파일 없이 Web Audio API로 그때그때 합성한다.
export type SfxKind = 'roar' | 'meow' | 'hoot' | 'drumroll';

interface ToneOptions {
  type: OscillatorType;
  startFreq: number;
  endFreq?: number;
  startTime: number;
  duration: number;
  peakGain?: number;
}

function playTone(ctx: AudioContext, opts: ToneOptions) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const t0 = ctx.currentTime + opts.startTime;
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.startFreq, t0);
  if (opts.endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(opts.endFreq, 1), t0 + opts.duration);
  }
  const peak = opts.peakGain ?? 0.18;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.03, opts.duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + opts.duration + 0.02);
}

/** 외부 파일 없이 짧은 캐릭터 효과음을 내는 훅. 실패해도 게임 진행에는 지장이 없어야 한다. */
export function useSoundEffects() {
  const ctxRef = useRef<AudioContext | null>(null);

  const playSfx = useCallback((kind: SfxKind) => {
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
      if (!Ctor) return;
      if (!ctxRef.current) ctxRef.current = new Ctor();
      const ctx = ctxRef.current;
      if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

      switch (kind) {
        case 'roar': // 호랑이 크아앙: 낮은 으르렁에서 포효로
          playTone(ctx, { type: 'sawtooth', startFreq: 110, endFreq: 55, startTime: 0, duration: 0.35, peakGain: 0.22 });
          playTone(ctx, { type: 'sawtooth', startFreq: 220, endFreq: 90, startTime: 0.05, duration: 0.3, peakGain: 0.14 });
          break;
        case 'meow': // 고양이 야옹: 올라갔다 내려가는 소리
          playTone(ctx, { type: 'sine', startFreq: 500, endFreq: 800, startTime: 0, duration: 0.12, peakGain: 0.16 });
          playTone(ctx, { type: 'sine', startFreq: 800, endFreq: 400, startTime: 0.12, duration: 0.18, peakGain: 0.16 });
          break;
        case 'hoot': // 부엉이 부엉부엉: 짧은 저음 두 번
          playTone(ctx, { type: 'sine', startFreq: 300, endFreq: 220, startTime: 0, duration: 0.22, peakGain: 0.2 });
          playTone(ctx, { type: 'sine', startFreq: 300, endFreq: 220, startTime: 0.32, duration: 0.22, peakGain: 0.2 });
          break;
        case 'drumroll': // 두구두구: 빠른 저음 타격 여러 번
          for (let i = 0; i < 6; i++) {
            playTone(ctx, { type: 'triangle', startFreq: 140, startTime: i * 0.09, duration: 0.07, peakGain: 0.15 });
          }
          break;
      }
    } catch {
      // 무시: 효과음이 안 나더라도 게임 진행에는 지장이 없어야 한다
    }
  }, []);

  return playSfx;
}
