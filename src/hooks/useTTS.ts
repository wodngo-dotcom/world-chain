import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceGender = 'male' | 'female';

// 기기/브라우저의 SpeechSynthesisVoice에는 성별 필드가 따로 없어서, 이름에 흔히 들어가는
// 실제 한국어 음성 이름(예: Microsoft/Azure의 InJoon=남성, SunHi=여성 등)이나 "남성"/"여성"
// 같은 단어로 추정한다. 알 수 없으면 성별 미상으로 둔다.
const MALE_HINTS = ['injoon', 'bongjin', 'gookmin', 'hyunsu', 'minsu', 'jinho', 'junho', 'male', '남성', 'man'];
const FEMALE_HINTS = ['sunhi', 'jimin', 'seohyeon', 'soonbok', 'yujin', 'heami', 'yuna', 'female', '여성', 'woman'];

function classifyGender(name: string): VoiceGender | null {
  const n = name.toLowerCase();
  if (MALE_HINTS.some((h) => n.includes(h))) return 'male';
  if (FEMALE_HINTS.some((h) => n.includes(h))) return 'female';
  return null;
}

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [supported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window);
  // 기기에 한국어 목소리가 여러 개 있으면(데스크톱 브라우저, 일부 최신 기기 등) 성별 추정이
  // 되는 음성을 캐릭터 성향에 맞게 배정한다. 원하는 성별의 음성이 아예 없는 기기에서는
  // (대부분의 안드로이드/iOS가 그렇다) rate/pitch 차이만으로 구분한다 — 그래서 남성 톤을
  // 원하는 캐릭터는 pitch를 최대한 낮게 잡아둔다.
  const maleVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const femaleVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const otherVoicesRef = useRef<SpeechSynthesisVoice[]>([]); // 한국어이지만 성별 추정이 안 되는 음성

  useEffect(() => {
    if (!supported) return;
    const pickVoices = () => {
      const all = window.speechSynthesis.getVoices();
      const ko = all.filter((v) => v.lang === 'ko-KR' || v.lang.startsWith('ko'));
      maleVoicesRef.current = ko.filter((v) => classifyGender(v.name) === 'male');
      femaleVoicesRef.current = ko.filter((v) => classifyGender(v.name) === 'female');
      otherVoicesRef.current = ko.filter((v) => classifyGender(v.name) === null);
    };
    pickVoices();
    window.speechSynthesis.addEventListener('voiceschanged', pickVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickVoices);
  }, [supported]);

  const pickVoice = useCallback((genderPref: VoiceGender | undefined, slot: number) => {
    const preferred = genderPref === 'male' ? maleVoicesRef.current : genderPref === 'female' ? femaleVoicesRef.current : [];
    const pool = preferred.length > 0 ? preferred : otherVoicesRef.current;
    if (pool.length === 0) return null;
    const i = ((slot % pool.length) + pool.length) % pool.length;
    return pool[i];
  }, []);

  const speak = useCallback(
    (
      text: string,
      opts?: { rate?: number; pitch?: number; genderPref?: VoiceGender; voiceSlot?: number; onEnd?: () => void },
    ) => {
      if (!supported) {
        opts?.onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = opts?.rate ?? 0.95;
      utterance.pitch = opts?.pitch ?? 1.05;
      utterance.volume = 1; // 일부 기기/음성에서 기본 볼륨이 낮게 잡히는 경우가 있어 항상 최대로 고정
      const voice = pickVoice(opts?.genderPref, opts?.voiceSlot ?? 0);
      if (voice) utterance.voice = voice;

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
    [supported, pickVoice],
  );

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return { speak, cancel, speaking, supported };
}
