import { useCallback, useEffect, useRef, useState } from 'react';

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!supported) return;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.lang === 'ko-KR') ?? voices.find((v) => v.lang.startsWith('ko')) ?? null;
    };
    pickVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickVoice);
  }, [supported]);

  const speak = useCallback(
    (text: string, opts?: { rate?: number; pitch?: number; onEnd?: () => void }) => {
      if (!supported) {
        opts?.onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = opts?.rate ?? 0.95;
      utterance.pitch = opts?.pitch ?? 1.05;
      if (voiceRef.current) utterance.voice = voiceRef.current;

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        setSpeaking(false);
        opts?.onEnd?.();
      };
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = finish;
      utterance.onerror = finish;
      // 일부 기기/브라우저에서는 speechSynthesis가 onend/onerror를 전혀 호출하지 않고
      // 조용히 멈춰버리는 경우가 있다. 그러면 게임이 캐릭터 턴에서 영영 멈춰서 마이크
      // 버튼조차 눌리지 않게 되므로, 글자 수 기반으로 예상 시간이 지나면 강제로 넘어간다.
      const estimatedMs = Math.min(8000, Math.max(1500, text.length * 180));
      window.setTimeout(finish, estimatedMs);

      try {
        window.speechSynthesis.speak(utterance);
      } catch {
        finish();
      }
    },
    [supported],
  );

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return { speak, cancel, speaking, supported };
}
