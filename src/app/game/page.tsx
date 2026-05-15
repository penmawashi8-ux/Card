'use client';

import { useEffect, useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import type { GameState, GameSettings, PlayerSetupConfig } from '@/types/game';
import { initializeGame } from '@/lib/gameLogic';
import { useGame } from '@/hooks/useGame';
import GameBoard from '@/components/GameBoard';
import RoundEndScreen from '@/components/RoundEndScreen';
import GameEndScreen from '@/components/GameEndScreen';

interface StoredConfig {
  settings: GameSettings;
  players: PlayerSetupConfig[];
}

const STORAGE_KEY = 'pageone_game_config';

export default function GamePage() {
  const router = useRouter();
  const [initialState, setInitialState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const playerId = useId();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setError('ゲーム設定が見つかりません。ホームページから設定してください。');
        return;
      }
      const config: StoredConfig = JSON.parse(raw);
      const state = initializeGame(config.settings, config.players);
      setInitialState(state);
    } catch (err) {
      console.error('[GamePage] Failed to load config:', err);
      setError('ゲームの読み込みに失敗しました。もう一度お試しください。');
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen felt-table flex items-center justify-center p-4">
        <div className="glass p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-white/80 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="btn-primary w-full">
            ホームへ戻る
          </button>
        </div>
      </div>
    );
  }

  if (!initialState) {
    return (
      <div className="min-h-screen felt-table flex items-center justify-center">
        <div className="text-white/60 text-lg animate-pulse">読み込み中…</div>
      </div>
    );
  }

  return <ActiveGame initialState={initialState} onReturnToMenu={() => router.push('/')} />;
}

interface ActiveGameProps {
  initialState: GameState;
  onReturnToMenu: () => void;
}

function ActiveGame({ initialState, onReturnToMenu }: ActiveGameProps) {
  const humanPlayerIndex = 0;

  const {
    state,
    onPlayCard,
    onDeclareJokerSuit,
    onDeclarePageOne,
    onContinueAfterRound,
    onResetGame,
  } = useGame(initialState);

  return (
    <div className="min-h-screen felt-table relative">
      {/* Top navigation bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>🃏</span>
          <span className="text-white font-bold text-lg hidden sm:block">ページワン</span>
        </div>
        <button
          type="button"
          onClick={onReturnToMenu}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          メニュー
        </button>
      </div>

      <main>
        <GameBoard
          state={state}
          humanPlayerIndex={humanPlayerIndex}
          onPlayCard={onPlayCard}
          onDeclareJokerSuit={onDeclareJokerSuit}
          onDeclarePageOne={onDeclarePageOne}
        />
      </main>

      {state.phase === 'round_end' && (
        <RoundEndScreen state={state} onContinue={onContinueAfterRound} />
      )}

      {state.phase === 'game_end' && (
        <GameEndScreen
          state={state}
          onPlayAgain={onResetGame}
          onReturnToMenu={onReturnToMenu}
        />
      )}
    </div>
  );
}
