'use client';

import type { GameState, Suit } from '@/types/game';
import PlayerArea from './PlayerArea';
import TrickArea from './TrickArea';
import DrawPile from './DrawPile';
import SuitPicker from './SuitPicker';
import PageOneButton from './PageOneButton';
import SoundToggle from './SoundToggle';

interface GameBoardProps {
  state: GameState;
  humanPlayerIndex: number;
  onPlayCard: (cardId: string) => void;
  onDeclareJokerSuit: (suit: Suit) => void;
  onDeclarePageOne: () => void;
  isOnline?: boolean;
  myPlayerId?: string;
}

/** Map player position (seat index relative to human) to UI position */
function getPosition(
  seatIndex: number,
  humanSeat: number,
  totalPlayers: number
): 'bottom' | 'top' | 'left' | 'right' {
  const relative = (seatIndex - humanSeat + totalPlayers) % totalPlayers;
  if (relative === 0) return 'bottom';
  if (totalPlayers === 3) {
    return relative === 1 ? 'left' : 'right';
  }
  // 4 players
  if (relative === 1) return 'left';
  if (relative === 2) return 'top';
  return 'right';
}

export default function GameBoard({
  state,
  humanPlayerIndex,
  onPlayCard,
  onDeclareJokerSuit,
  onDeclarePageOne,
  isOnline = false,
  myPlayerId,
}: GameBoardProps) {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isHumanTurn = currentPlayer.type === 'human' &&
    state.currentPlayerIndex === humanPlayerIndex;
  const showSuitPicker = state.phase === 'joker_suit_declare' && isHumanTurn;

  // For online: show page one button for the human player when it's page_one_pending
  const showPageOneButton =
    state.phase === 'page_one_pending' &&
    state.currentPlayerIndex === humanPlayerIndex;

  // Sort players: human at bottom, others around table
  const orderedSeats = state.players.map((_, i) => i);

  return (
    <div className="flex flex-col h-full min-h-screen felt-table">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/20">
        <div className="text-white/70 text-sm">
          ラウンド{' '}
          <span className="font-bold text-yellow-300">
            {state.round}
          </span>
          {' '}/{' '}{state.totalRounds}
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isHumanTurn ? 'bg-yellow-400 animate-pulse' : 'bg-white/30'
            }`}
          />
          <span className="text-white/70 text-sm font-medium">
            {currentPlayer.name} のターン
          </span>
          {currentPlayer.type === 'cpu' && (
            <span className="text-xs text-white/40 animate-pulse">考え中…</span>
          )}
          {state.phase === 'auto_drawing' && (
            <span className="text-xs text-orange-300 animate-pulse">引いています…</span>
          )}
        </div>

        <SoundToggle />
      </div>

      {/* ── Message banner ─────────────────────────────────────────── */}
      {state.message && (
        <div className="px-4 py-1.5 bg-black/10 text-center">
          <span className="text-white/70 text-sm">{state.message}</span>
        </div>
      )}

      {/* ── Main table area ────────────────────────────────────────── */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-4 gap-4">

        {/* Top player */}
        {state.players.length >= 3 && (() => {
          const topIdx = orderedSeats.find(i => getPosition(i, humanPlayerIndex, state.players.length) === 'top');
          if (topIdx === undefined) return null;
          const p = state.players[topIdx];
          return (
            <div className="w-full flex justify-center">
              <PlayerArea
                player={p}
                isCurrentPlayer={state.currentPlayerIndex === topIdx}
                isHumanControlled={false}
                position="top"
                currentTrick={state.currentTrick}
                phase={state.phase}
                seatIndex={topIdx}
              />
            </div>
          );
        })()}

        {/* Middle row: left, center trick, right */}
        <div className="w-full flex items-center justify-between gap-2 max-w-2xl">
          {/* Left player */}
          {(() => {
            const leftIdx = orderedSeats.find(i => getPosition(i, humanPlayerIndex, state.players.length) === 'left');
            if (leftIdx === undefined) return <div className="w-16" />;
            const p = state.players[leftIdx];
            return (
              <PlayerArea
                player={p}
                isCurrentPlayer={state.currentPlayerIndex === leftIdx}
                isHumanControlled={false}
                position="left"
                currentTrick={state.currentTrick}
                phase={state.phase}
                seatIndex={leftIdx}
              />
            );
          })()}

          {/* Center: trick area */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <TrickArea
              trick={state.currentTrick}
              players={state.players}
              phase={state.phase}
            />
          </div>

          {/* Right: draw pile + right player */}
          <div className="flex flex-col items-end gap-3">
            {(() => {
              const rightIdx = orderedSeats.find(i => getPosition(i, humanPlayerIndex, state.players.length) === 'right');
              if (rightIdx !== undefined) {
                const p = state.players[rightIdx];
                return (
                  <PlayerArea
                    player={p}
                    isCurrentPlayer={state.currentPlayerIndex === rightIdx}
                    isHumanControlled={false}
                    position="right"
                    currentTrick={state.currentTrick}
                    phase={state.phase}
                    seatIndex={rightIdx}
                  />
                );
              }
              return null;
            })()}
            <DrawPile
              drawCount={state.drawPile.length}
              discardCount={state.discardPile.length}
              isDrawing={state.phase === 'auto_drawing'}
            />
          </div>
        </div>

        {/* Human player at bottom */}
        <div className="w-full flex justify-center">
          <PlayerArea
            player={state.players[humanPlayerIndex]}
            isCurrentPlayer={state.currentPlayerIndex === humanPlayerIndex}
            isHumanControlled={true}
            onPlayCard={onPlayCard}
            position="bottom"
            currentTrick={state.currentTrick}
            phase={state.phase}
            seatIndex={humanPlayerIndex}
          />
        </div>
      </div>

      {/* ── Overlays ─────────────────────────────────────────────────── */}
      {showSuitPicker && (
        <SuitPicker onSelect={onDeclareJokerSuit} />
      )}
      {showPageOneButton && (
        <PageOneButton
          onDeclare={onDeclarePageOne}
          playerName={state.players[humanPlayerIndex].name}
        />
      )}
    </div>
  );
}
