import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionOptions {
  /** alternatives[0]이 가장 신뢰도 높은 인식 결과이고, 나머지는 차선책 후보들이다. */
  onResult?: (alternatives: string[]) => void;
}

export function useSpeechRecognition({ onResult }: UseSpeechRecognitionOptions = {}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const supported =
    typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!supported) return;
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition!;
    const recognition = new Ctor();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const alternatives: string[] = [];
      for (let i = 0; i < result.length; i++) {
        const alt = result[i].transcript.trim().replace(/\s+/g, '');
        if (alt && !alternatives.includes(alt)) alternatives.push(alt);
      }
      setTranscript(alternatives[0] ?? '');
      onResultRef.current?.(alternatives);
    };
    recognition.onerror = (event) => {
      setError(event.error);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognition.onstart = () => {
      setError(null);
      setListening(true);
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      recognition.abort();
    };
  }, [supported]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript('');
    setError(null);
    try {
      recognitionRef.current.start();
    } catch (err) {
      // 이미 시작된 경우(InvalidStateError)는 무시하고, 그 외에는 화면에 보여준다
      if (!(err instanceof DOMException && err.name === 'InvalidStateError')) {
        setError('start-failed');
      }
      return;
    }
    // 일부 기기/브라우저에서는 시작도 에러도 아무 신호 없이 조용히 실패한다.
    // 일정 시간 안에 실제로 듣기 시작했다는 신호(onstart)가 없으면 화면에 알려준다.
    window.setTimeout(() => {
      setListening((isListening) => {
        if (!isListening) setError((prev) => prev ?? 'start-failed');
        return isListening;
      });
    }, 2500);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { listening, transcript, error, start, stop, supported };
}
