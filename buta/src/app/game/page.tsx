'use client';

import { useEffect, useState, useCallback, useId } from 'react';
import { useRouter } from 'next/navigation';
import type { GameState, GameSettings, PlayerSetupConfig } from '@/types/game';
import { initializeGame } from '@/lib/gameLogic';
import { useGame } from '@/hooks/useGame';
import GameBoard from '@/components/GameBoard';
import RoundEndScreen from '@/components/RoundEndScreen';
import GameEndScreen from '@/components/GameEndScreen';
import SoundToggle from '@/components/SoundToggle';

// ─── Config shape stored in localStorage ─────────────────────────────────────

interface StoredConfig {
  settings: GameSettings;
  players: PlayerSetupConfig[];
}

const STORAGE_KEY = 'buta_game_config';

// ─── Page component ───────────────────────────────────────────────────────────

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
          <button
            onClick={() => router.push('/')}
            className="btn-primary w-full"
          >
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

  return (
    <ActiveGame
      initialState={initialState}
      playerId={playerId}
      onReturnToMenu={() => router.push('/')}
    />
  );
}

// ─── Active game (owns the useGame hook) ─────────────────────────────────────

interface ActiveGameProps {
  initialState: GameState;
  playerId: string;
  onReturnToMenu: () => void;
}

function ActiveGame({ initialState, playerId, onReturnToMenu }: ActiveGameProps) {
  // First human player is always index 0 for local games
  const humanPlayerIndex = 0;

  const { state, isAnimating, flippingCard, performAction, startNextRound, resetGame } =
    useGame(initialState, { playerId });

  const handleFlipCircleCard = useCallback(
    (index: number) => performAction('circle', index),
    [performAction],
  );

  const handlePlayFromHand = useCallback(
    (cardId: string) => performAction('hand', undefined, cardId),
    [performAction],
  );

  return (
    <div className="min-h-screen felt-table relative">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>🐷</span>
          <span className="text-white font-bold text-lg hidden sm:block">
            ぶたのしっぽ
          </span>
          <span className="text-white/50 text-sm">
            ラウンド{' '}
            <span className="text-yellow-300 font-bold">{state.currentRound}</span>
            {' '}/{' '}{state.settings.rounds}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <SoundToggle />
          <button
            type="button"
            onClick={onReturnToMenu}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            メニュー
          </button>
        </div>
      </div>

      {/* ── Game board ───────────────────────────────────────────────── */}
      <main>
        <GameBoard
          state={state}
          humanPlayerIndex={humanPlayerIndex}
          onFlipCircleCard={handleFlipCircleCard}
          onPlayFromHand={handlePlayFromHand}
          isAnimating={isAnimating}
          flippingCard={flippingCard}
        />
      </main>

      {/* ── Round end overlay ────────────────────────────────────────── */}
      {state.phase === 'round_end' && (
        <RoundEndScreen state={state} onNextRound={startNextRound} />
      )}

      {/* ── Game end overlay ─────────────────────────────────────────── */}
      {state.phase === 'game_end' && (
        <GameEndScreen
          state={state}
          humanPlayerIndex={humanPlayerIndex}
          onPlayAgain={resetGame}
          onReturnToMenu={onReturnToMenu}
        />
      )}
    </div>
  );
}
