import { useCallback, useEffect, useRef, useState } from 'react';

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  // 기기에 한국어 목소리가 여러 개 있으면(데스크톱 브라우저, 일부 최신 기기 등) 캐릭터마다
  // 서로 다른 목소리 자체를 배정할 수 있다. 하나뿐이면(대부분의 안드로이드 등) rate/pitch
  // 차이만으로 구분한다 — 그래서 캐릭터별 rate/pitch 차이를 최대한 크게 둔다.
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!supported) return;
    const pickVoices = () => {
      const all = window.speechSynthesis.getVoices();
      voicesRef.current = all.filter((v) => v.lang === 'ko-KR' || v.lang.startsWith('ko'));
    };
    pickVoices();
    window.speechSynthesis.addEventListener('voiceschanged', pickVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickVoices);
  }, [supported]);

  const speak = useCallback(
    (text: string, opts?: { rate?: number; pitch?: number; voiceIndex?: number; onEnd?: () => void }) => {
      if (!supported) {
        opts?.onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = opts?.rate ?? 0.95;
      utterance.pitch = opts?.pitch ?? 1.05;
      const voices = voicesRef.current;
      if (voices.length > 0) {
        const i = ((opts?.voiceIndex ?? 0) % voices.length + voices.length) % voices.length;
        utterance.voice = voices[i];
      }

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
