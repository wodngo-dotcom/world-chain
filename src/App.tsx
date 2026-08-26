import { useCallback, useEffect, useState } from 'react';
import { useGame } from './game/useGame';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useBeep } from './hooks/useBeep';
import { GameHeader } from './components/GameHeader';
import { CharacterIntro } from './components/CharacterIntro';
import { CharacterStage } from './components/CharacterStage';
import { WordCard } from './components/WordCard';
import { PlayerPrompt } from './components/PlayerPrompt';
import { ControlBar } from './components/ControlBar';
import { VictoryScreen } from './components/VictoryScreen';
import { GameClearScreen } from './components/GameClearScreen';

function App() {
  const game = useGame();
  const [heard, setHeard] = useState('');

  const handleResult = useCallback(
    (alternatives: string[]) => {
      setHeard(alternatives[0] ?? '');
      game.submitAnswer(alternatives);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [game.submitAnswer],
  );

  const {
    listening,
    start,
    stop,
    error: micError,
    supported: micSupported,
  } = useSpeechRecognition({
    onResult: handleResult,
  });
  const beep = useBeep();

  useEffect(() => {
    if (game.phase !== 'player-turn') setHeard('');
  }, [game.phase]);

  const handleMicPress = useCallback(() => {
    if (listening) {
      stop();
      return;
    }
    setHeard('');
    beep(); // 마이크가 듣기 시작했다는 걸 소리로 바로 알려준다
    start();
  }, [listening, start, stop, beep]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-sky-100 via-orange-50 to-pink-50">
      <GameHeader characterIndex={game.characterIndex} progress={game.progress} onRestart={game.restartGame} />

      {game.phase === 'intro' && (
        <CharacterIntro
          character={game.character}
          onStart={game.startRound}
          speakCharacterLine={game.speakCharacterLine}
        />
      )}

      {game.phase === 'victory' && game.currentWord && (
        <VictoryScreen
          character={game.character}
          chainLength={game.chain.length}
          onContinue={game.proceedAfterVictory}
        />
      )}

      {game.phase === 'game-clear' && (
        <GameClearScreen bestChainLength={game.progress.bestChainLength} onRestart={game.restartGame} />
      )}

      {(game.phase === 'character-turn' ||
        game.phase === 'character-thinking' ||
        game.phase === 'player-turn') && (
        <main className="flex flex-1 flex-col items-center justify-between gap-6 px-4 pb-4 pt-2 sm:px-6">
          <CharacterStage character={game.character} phase={game.phase} speechLine={game.speechLine} />

          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            {game.currentWord && (
              <WordCard
                entry={game.currentWord}
                speaker={game.chain[game.chain.length - 1].speaker}
                onReplay={() => {
                  const isCharacterWord = game.chain[game.chain.length - 1].speaker === 'character';
                  if (isCharacterWord) {
                    game.speakCharacterLine(game.speechLine);
                  } else {
                    game.speak(game.currentWord!.word);
                  }
                }}
                onReadMeaning={() => game.speak(game.currentWord!.meaning)}
              />
            )}

            {game.phase === 'player-turn' && game.requiredStart && (
              <PlayerPrompt
                requiredStart={game.requiredStart}
                hintStage={game.hintStage}
                hintEntry={game.hintEntry}
                feedback={game.feedback}
                heard={heard}
                micError={micError}
                dictionaryChecking={game.dictionaryChecking}
              />
            )}
          </div>

          <ControlBar
            disabled={game.phase !== 'player-turn'}
            listening={listening}
            micSupported={micSupported}
            onMicPress={handleMicPress}
            onHint={game.requestHint}
            onGiveUp={game.giveUp}
          />
        </main>
      )}
    </div>
  );
}

export default App;
