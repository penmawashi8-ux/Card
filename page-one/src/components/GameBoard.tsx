'use client';

import type { GameState, Suit } from '@/types/game';
import { canPlayCard } from '@/lib/gameLogic';
import { CardComponent } from './CardComponent';
import TrickArea from './TrickArea';
import DrawPile from './DrawPile';
import SuitPicker from './SuitPicker';
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

export default function GameBoard({
  state,
  humanPlayerIndex,
  onPlayCard,
  onDeclareJokerSuit,
  onDeclarePageOne,
}: GameBoardProps) {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const human = state.players[humanPlayerIndex];
  const isHumanTurn =
    currentPlayer.type === 'human' &&
    state.currentPlayerIndex === humanPlayerIndex;

  const canPlay =
    isHumanTurn &&
    (state.phase === 'leading' || state.phase === 'following');
  const isLeading = state.phase === 'leading';

  const showPageOneButton =
    state.phase === 'page_one_pending' &&
    state.currentPlayerIndex === humanPlayerIndex;

  const showSuitPicker =
    state.phase === 'joker_suit_declare' && isHumanTurn;

  const opponents = state.players
    .map((p, i) => ({ player: p, idx: i }))
    .filter(({ idx }) => idx !== humanPlayerIndex);

  return (
    <div className="h-dvh flex flex-col felt-table overflow-hidden select-none">

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-3 py-1.5 bg-black/30 gap-2">
        <span className="text-white/60 text-xs font-mono shrink-0">
          R<span className="text-yellow-300 font-bold">{state.round}</span>/{state.totalRounds}
        </span>
        <span className={`text-xs font-medium text-center truncate flex-1 ${isHumanTurn ? 'text-yellow-300' : 'text-white/70'}`}>
          {state.message}
        </span>
        <SoundToggle />
      </div>

      {/* ── Opponents ───────────────────────────────────────────── */}
      <div className="shrink-0 flex justify-around items-center px-2 py-1.5 gap-1 bg-black/15">
        {opponents.map(({ player: p, idx }) => {
          const isCurrent = state.currentPlayerIndex === idx;
          return (
            <div
              key={idx}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                isCurrent
                  ? 'bg-yellow-400 text-stone-900 shadow-md shadow-yellow-400/40'
                  : 'glass text-white/80'
              }`}
            >
              {isCurrent && (
                <span className="w-1.5 h-1.5 rounded-full bg-stone-900 animate-pulse shrink-0" />
              )}
              <span className="truncate max-w-[5rem]">{p.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] shrink-0 ${
                  isCurrent ? 'bg-stone-900/20' : 'bg-white/15'
                }`}
              >
                {p.hand.length}枚
              </span>
              {p.pageOneDeclared && (
                <span className="bg-orange-500 text-white px-1 rounded text-[10px] font-bold shrink-0">
                  P1
                </span>
              )}
              <span className="text-[10px] opacity-60 shrink-0">
                {p.score > 0 ? '+' : ''}{p.score}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Center: trick + draw pile ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center gap-4 px-3 py-2 min-h-0">
        <TrickArea
          trick={state.currentTrick}
          players={state.players}
          phase={state.phase}
        />
        <DrawPile
          drawCount={state.drawPile.length}
          discardCount={state.discardPile.length}
          isDrawing={state.phase === 'auto_drawing'}
        />
      </div>

      {/* ── Human player ─────────────────────────────────────────── */}
      <div className="shrink-0 bg-black/25 px-3 pt-2 pb-3">
        {/* Info row */}
        <div className="flex items-center justify-between mb-1.5">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold transition-all ${
              isHumanTurn
                ? 'bg-yellow-400 text-stone-900 shadow-md shadow-yellow-400/30'
                : 'glass text-white/80'
            }`}
          >
            {isHumanTurn && (
              <span className="w-1.5 h-1.5 rounded-full bg-stone-900 animate-pulse" />
            )}
            <span>{human.name}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                isHumanTurn ? 'bg-stone-900/20' : 'bg-white/10'
              }`}
            >
              {human.hand.length}枚
            </span>
            {human.pageOneDeclared && (
              <span className="bg-orange-500 text-white px-1 py-0.5 rounded text-xs font-bold">
                P1
              </span>
            )}
          </div>
          <span className="text-xs text-white/50">
            スコア:{' '}
            <span
              className={`font-bold ${
                human.score >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {human.score > 0 ? '+' : ''}
              {human.score}
            </span>
          </span>
        </div>

        {/* Page One button */}
        {showPageOneButton && (
          <button
            type="button"
            onClick={onDeclarePageOne}
            className="w-full mb-2 py-2 bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-orange-500/30"
          >
            🎴 ページワン！宣言
          </button>
        )}

        {/* Hand */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {human.hand.length === 0 ? (
            <div className="text-white/30 text-sm py-3 w-full text-center">
              手札なし
            </div>
          ) : (
            human.hand.map((card) => {
              const isPlayable =
                canPlay &&
                (isLeading || canPlayCard(card, state.currentTrick));
              return (
                <CardComponent
                  key={card.id}
                  card={card}
                  size="sm"
                  onClick={isPlayable ? () => onPlayCard(card.id) : undefined}
                  disabled={canPlay && !isPlayable}
                  highlight={isPlayable}
                  className="shrink-0"
                />
              );
            })
          )}
        </div>
      </div>

      {/* ── Overlays ────────────────────────────────────────────── */}
      {showSuitPicker && <SuitPicker onSelect={onDeclareJokerSuit} />}
    </div>
  );
}
