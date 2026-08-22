import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'word-chain-progress-v1';

export interface Progress {
  currentCharacterIndex: number;
  defeatedCharacterIds: string[];
  bestChainLength: number;
}

const DEFAULT_PROGRESS: Progress = {
  currentCharacterIndex: 0,
  defeatedCharacterIds: [],
  bestChainLength: 0,
};

function loadProgress(): Progress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROGRESS, ...parsed };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(loadProgress);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // localStorage 사용 불가 환경은 조용히 무시
    }
  }, [progress]);

  const recordVictory = useCallback((characterId: string, chainLength: number) => {
    setProgress((prev) => ({
      currentCharacterIndex: prev.currentCharacterIndex + 1,
      defeatedCharacterIds: prev.defeatedCharacterIds.includes(characterId)
        ? prev.defeatedCharacterIds
        : [...prev.defeatedCharacterIds, characterId],
      bestChainLength: Math.max(prev.bestChainLength, chainLength),
    }));
  }, []);

  const recordChainLength = useCallback((chainLength: number) => {
    setProgress((prev) => ({ ...prev, bestChainLength: Math.max(prev.bestChainLength, chainLength) }));
  }, []);

  const resetProgress = useCallback(() => setProgress(DEFAULT_PROGRESS), []);

  return { progress, recordVictory, recordChainLength, resetProgress };
}
