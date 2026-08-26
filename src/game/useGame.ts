import { useCallback, useEffect, useRef, useState } from 'react';
import { CHARACTERS, characterAt } from '../data/characters';
import type { WordEntry } from '../data/words';
import {
  acceptableStarts,
  checkAnswer,
  findClosestWord,
  lastChar,
  MIN_CHAIN_LENGTH_BEFORE_BLOCK,
  pickHintWord,
  pickOpeningWord,
  takeAiTurn,
} from './engine';
import type { AnswerCheck } from './engine';
import { lookupStdict, lookupStdictPrefix, stdictEnabled } from '../data/stdictApi';
import { isAppropriateWord } from '../data/profanityFilter';
import { extractOnomatopoeia } from './onomatopoeia';
import type { AnswerFeedback, ChainItem, HintStage, Phase } from './types';
import { useTTS } from '../hooks/useTTS';
import { useSoundEffects } from '../hooks/useSoundEffects';
import { useProgress } from '../hooks/useProgress';

const IDLE_HINT_MS = 10000;
const THINKING_DELAY_MS = 900;

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function say(template: string, word: string): string {
  return template.replace('{word}', word);
}

/**
 * 아동 목록과 로컬 확장 사전 어디에도 캐릭터가 이어갈 단어가 없을 때(진짜 데이터 공백)
 * 마지막으로 시도하는 수단: 표준국어대사전 API에서 그 글자로 시작하는 단어를 찾는다.
 * 두음법칙 변형 글자도 함께 시도한다. 찾지 못하면 null.
 */
async function findApiCandidate(
  requiredStart: string,
  usedWords: ReadonlySet<string>,
): Promise<WordEntry | null> {
  for (const start of acceptableStarts(requiredStart)) {
    const words = await lookupStdictPrefix(start);
    if (!words) continue;
    const candidates = words.filter(
      (w) => w.word.length >= 2 && w.word[0] === start && !usedWords.has(w.word) && isAppropriateWord(w.word),
    );
    if (candidates.length === 0) continue;
    const pick = randomOf(candidates);
    return {
      word: pick.word,
      meaning: pick.definition ?? '표준국어대사전에 있는 단어예요!',
      emoji: '📕',
      tier: 5,
    };
  }
  return null;
}

export function useGame() {
  const { progress, recordVictory, recordChainLength, resetProgress } = useProgress();
  const { speak, cancel: cancelSpeech, supported: ttsSupported } = useTTS();
  const playSfx = useSoundEffects();

  const [characterIndex, setCharacterIndex] = useState(progress.currentCharacterIndex);
  const [phase, setPhase] = useState<Phase>('intro');
  const [chain, setChain] = useState<ChainItem[]>([]);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [requiredStart, setRequiredStart] = useState<string | null>(null);
  const [hintStage, setHintStage] = useState<HintStage>(0);
  const [hintEntry, setHintEntry] = useState<WordEntry | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback>(null);
  const [speechLine, setSpeechLine] = useState<string>('');
  const [revealedEntry, setRevealedEntry] = useState<WordEntry | null>(null);
  const [dictionaryChecking, setDictionaryChecking] = useState(false);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const character = characterAt(Math.min(characterIndex, CHARACTERS.length - 1));
  const isFinalClear = characterIndex >= CHARACTERS.length;

  // 캐릭터 대사를 말할 때 쓰는 공통 헬퍼: 맨 앞의 의성어(크아앙, 야옹 등)는 TTS로 읽지
  // 않고 대신 효과음으로 재생하며, 나머지 실제 단어 부분만 그 캐릭터 목소리로 읽는다.
  // 화면 말풍선(speechLine)에는 의성어를 포함한 원래 문장을 그대로 보여준다.
  const speakCharacterLine = useCallback(
    (line: string, onEnd?: () => void) => {
      const { speech, sfx } = extractOnomatopoeia(line);
      if (sfx) playSfx(sfx);
      speak(speech, { ...character.voice, onEnd });
    },
    [character, speak, playSfx],
  );

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearIdleTimer, [clearIdleTimer]);

  // 아이 차례일 때 일정 시간 답이 없으면 힌트 단계를 자동으로 올려준다
  useEffect(() => {
    if (phase !== 'player-turn' || hintStage >= 2) return;
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      setHintStage((s) => (s < 2 ? ((s + 1) as HintStage) : s));
    }, IDLE_HINT_MS);
    return clearIdleTimer;
  }, [phase, hintStage, clearIdleTimer]);

  const ensureHintEntry = useCallback((): WordEntry | null => {
    if (hintEntry) return hintEntry;
    if (!requiredStart) return null;
    const entry = pickHintWord(requiredStart, usedWords, usedWords.size < MIN_CHAIN_LENGTH_BEFORE_BLOCK);
    setHintEntry(entry);
    return entry;
  }, [hintEntry, requiredStart, usedWords]);

  const startRound = useCallback(() => {
    const used = new Set<string>();
    const opening = pickOpeningWord(character, used);
    used.add(opening.word);
    setUsedWords(used);
    setChain([{ speaker: 'character', entry: opening }]);
    setRequiredStart(lastChar(opening.word));
    setHintStage(0);
    setHintEntry(null);
    setFeedback(null);
    setRevealedEntry(null);
    setPhase('character-turn');
    const line = say(randomOf(character.sayTemplates), opening.word);
    setSpeechLine(line);
    speakCharacterLine(line, () => setPhase('player-turn'));
  }, [character, speakCharacterLine]);

  const applyCharacterEntry = useCallback(
    (entry: WordEntry, usedSoFar: Set<string>) => {
      const nextUsed = new Set(usedSoFar);
      nextUsed.add(entry.word);
      setUsedWords(nextUsed);
      setChain((prev) => [...prev, { speaker: 'character', entry }]);
      setRequiredStart(lastChar(entry.word));
      setHintStage(0);
      setHintEntry(null);
      setRevealedEntry(null);
      setPhase('character-turn');
      const line = say(randomOf(character.sayTemplates), entry.word);
      setSpeechLine(line);
      speakCharacterLine(line, () => setPhase('player-turn'));
    },
    [character, speakCharacterLine],
  );

  const declareVictory = useCallback(() => {
    setPhase('victory');
    const line = randomOf(character.loseLines);
    setSpeechLine(line);
    speakCharacterLine(line);
    recordVictory(character.id, chain.length + 1);
  }, [character, chain.length, recordVictory, speakCharacterLine]);

  const resolveAiTurn = useCallback(
    async (nextRequiredStart: string, usedSoFar: Set<string>) => {
      // usedWords.size === chain.length (모든 단어가 중복 없이 하나씩만 쓰이므로), 클로저 지연 없이 정확한 진행 길이를 얻는다
      const result = takeAiTurn(character, nextRequiredStart, usedSoFar, usedSoFar.size);
      if (result.ok) {
        applyCharacterEntry(result.entry, usedSoFar);
        return;
      }
      // 아동 목록 + 로컬 확장 사전 어디에도 이어갈 단어가 없는 진짜 데이터 공백일 때만
      // (확률로 스스로 막힌 경우는 제외) 표준국어대사전 API로 마지막으로 한 번 더 찾아본다.
      if (result.reason === 'no-candidate' && stdictEnabled) {
        setDictionaryChecking(true);
        const apiEntry = await findApiCandidate(nextRequiredStart, usedSoFar);
        setDictionaryChecking(false);
        if (apiEntry) {
          applyCharacterEntry(apiEntry, usedSoFar);
          return;
        }
      }
      declareVictory();
    },
    [character, applyCharacterEntry, declareVictory],
  );

  const characterContinue = useCallback(
    (nextRequiredStart: string, usedSoFar: Set<string>) => {
      setPhase('character-thinking');
      window.setTimeout(() => resolveAiTurn(nextRequiredStart, usedSoFar), THINKING_DELAY_MS);
    },
    [resolveAiTurn],
  );

  const submitAnswer = useCallback(
    async (rawAlternatives: string[] | string) => {
      if (phase !== 'player-turn' || !requiredStart) return;
      const alternatives = (Array.isArray(rawAlternatives) ? rawAlternatives : [rawAlternatives])
        .map((a) => a.trim())
        .filter(Boolean);
      const topAlternative = alternatives[0];
      if (!topAlternative) return;

      // 음성인식이 준 여러 후보(대개 1순위가 가장 정확하지만, 드물게 2·3순위가 맞을 때가 있다)
      // 중 사전에 있는 유효한 답을 찾을 때까지 순서대로 확인한다.
      let check: AnswerCheck = checkAnswer(topAlternative, requiredStart, usedWords);
      if (!check.ok) {
        for (const alt of alternatives.slice(1)) {
          const altCheck = checkAnswer(alt, requiredStart, usedWords);
          if (altCheck.ok) {
            check = altCheck;
            break;
          }
        }
      }
      if (!check.ok && check.reason === 'not-a-word') {
        const closest = findClosestWord(topAlternative, requiredStart, usedWords);
        if (closest) {
          check = checkAnswer(closest.word, requiredStart, usedWords);
        }
      }

      // 로컬 목록(아동 목록 + 확장 사전)에서도 못 찾았을 때만, 표준국어대사전 API로
      // 한 번 더 확인한다 (프록시가 설정되어 있을 때만 동작하며, 실패해도 조용히 건너뜀).
      if (!check.ok && check.reason === 'not-a-word' && stdictEnabled) {
        setDictionaryChecking(true);
        const lookup = await lookupStdict(topAlternative);
        setDictionaryChecking(false);
        // 확인하는 동안 라운드가 이미 넘어갔다면(몰라요 등) 이 결과는 더 이상 쓰지 않는다.
        if (phase !== 'player-turn') return;
        if (lookup?.exists) {
          if (!acceptableStarts(requiredStart).includes(topAlternative[0])) {
            check = { ok: false, reason: 'wrong-start' };
          } else if (usedWords.has(topAlternative)) {
            check = { ok: false, reason: 'already-used' };
          } else {
            check = {
              ok: true,
              entry: {
                word: topAlternative,
                meaning: lookup.definition ?? '표준국어대사전에 있는 단어예요!',
                emoji: '📕',
                tier: 5,
              },
            };
          }
        }
      }

      if (!check.ok || !check.entry) {
        setFeedback(check.reason ?? 'not-a-word');
        return;
      }
      setFeedback(null);
      clearIdleTimer();
      const nextUsed = new Set(usedWords);
      nextUsed.add(check.entry.word);
      setUsedWords(nextUsed);
      setChain((prev) => [...prev, { speaker: 'player', entry: check.entry! }]);
      const nextStart = lastChar(check.entry.word);
      setRequiredStart(nextStart);
      characterContinue(nextStart, nextUsed);
    },
    [phase, requiredStart, usedWords, characterContinue, clearIdleTimer],
  );

  const requestHint = useCallback(() => {
    if (phase !== 'player-turn') return;
    ensureHintEntry();
    setHintStage((s) => (s < 2 ? ((s + 1) as HintStage) : s));
  }, [phase, ensureHintEntry]);

  const giveUp = useCallback(() => {
    if (phase !== 'player-turn' || !requiredStart) return;
    clearIdleTimer();
    const entry = ensureHintEntry();
    if (!entry) {
      // 이 글자로 이어갈 단어가 아무것도 없는 막다른 상황 -> 새 단어로 라운드 재시작
      setFeedback(null);
      startRound();
      return;
    }
    setRevealedEntry(entry);
    const nextUsed = new Set(usedWords);
    nextUsed.add(entry.word);
    setUsedWords(nextUsed);
    setChain((prev) => [...prev, { speaker: 'reveal', entry }]);
    const nextStart = lastChar(entry.word);
    setRequiredStart(nextStart);
    setFeedback(null);
    setPhase('character-thinking');
    speak(`괜찮아요! 정답은 ${entry.word}였어요. 같이 외워볼까요?`, {
      onEnd: () => window.setTimeout(() => resolveAiTurn(nextStart, nextUsed), THINKING_DELAY_MS),
    });
  }, [phase, requiredStart, ensureHintEntry, usedWords, resolveAiTurn, clearIdleTimer, startRound, speak]);

  const proceedAfterVictory = useCallback(() => {
    const next = characterIndex + 1;
    setCharacterIndex(next);
    recordChainLength(chain.length);
    if (next >= CHARACTERS.length) {
      setPhase('game-clear');
      return;
    }
    setPhase('intro');
  }, [characterIndex, chain.length, recordChainLength]);

  const restartGame = useCallback(() => {
    clearIdleTimer();
    cancelSpeech();
    resetProgress();
    setCharacterIndex(0);
    setPhase('intro');
    setChain([]);
    setUsedWords(new Set());
    setRequiredStart(null);
    setHintStage(0);
    setHintEntry(null);
    setFeedback(null);
    setRevealedEntry(null);
    setSpeechLine('');
    setDictionaryChecking(false);
  }, [resetProgress, clearIdleTimer, cancelSpeech]);

  const currentWord = chain[chain.length - 1]?.entry ?? null;

  return {
    character,
    characterIndex,
    isFinalClear,
    phase,
    chain,
    currentWord,
    requiredStart,
    hintStage,
    hintEntry,
    feedback,
    speechLine,
    revealedEntry,
    dictionaryChecking,
    progress,
    ttsSupported,
    startRound,
    submitAnswer,
    requestHint,
    giveUp,
    proceedAfterVictory,
    restartGame,
    speak,
    speakCharacterLine,
  };
}
