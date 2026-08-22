import { useCallback, useEffect, useRef, useState } from 'react';

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
}

export function useSpeechRecognition({ onResult }: UseSpeechRecognitionOptions = {}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // 마이크 권한을 한 번만 받아 계속 쥐고 있으면(스트림을 끊지 않으면), 이후 인식을 시작할 때마다
  // 브라우저가 권한을 다시 물어보지 않는다. 버튼을 누를 때마다 새로 요청하는 대신 이 스트림을 재사용한다.
  const micStreamRef = useRef<MediaStream | null>(null);
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
      const text = result[0].transcript.trim().replace(/\s+/g, '');
      setTranscript(text);
      onResultRef.current?.(text);
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
      micStreamRef.current?.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    };
  }, [supported]);

  const start = useCallback(async () => {
    if (!recognitionRef.current) return;
    setTranscript('');
    try {
      if (!micStreamRef.current && navigator.mediaDevices?.getUserMedia) {
        micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      recognitionRef.current.start();
    } catch (err) {
      if (!micStreamRef.current) {
        setError(err instanceof Error && err.name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture');
        return;
      }
      // 인식이 이미 시작된 경우(InvalidStateError) 등은 무시
    }
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  return { listening, transcript, error, start, stop, supported };
}
