'use client';

import React, { useMemo } from 'react';
import type { GameState, FlippingCardInfo } from '@/types/game';
import { getTopCard, canPlayFromHand } from '@/lib/gameLogic';
import CircleBoard from './CircleBoard';
import CentralPile from './CentralPile';
import PlayerHand from './PlayerHand';

interface GameBoardProps {
  state: GameState;
  humanPlayerIndex: number;
  onFlipCircleCard: (index: number) => void;
  onPlayFromHand: (cardId: string) => void;
  isAnimating: boolean;
  flippingCard?: FlippingCardInfo | null;
}

export default function GameBoard({
  state,
  humanPlayerIndex,
  onFlipCircleCard,
  onPlayFromHand,
  isAnimating,
  flippingCard,
}: GameBoardProps) {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const isHumanTurn =
    currentPlayer.type === 'human' &&
    state.currentPlayerIndex === humanPlayerIndex;
  const topCard = useMemo(() => getTopCard(state), [state]);
  const hasHandCards = useMemo(() => canPlayFromHand(state), [state]);

  const isPenaltyAnim =
    state.lastPenaltyPlayerIndex !== undefined && isAnimating;

  return (
    <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto px-4 py-3 pb-[max(env(safe-area-inset-bottom,0px),16px)]">
      {/* ── Status bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between glass px-4 py-2">
        <div className="text-white/80 text-sm">
          Round{' '}
          <span className="font-bold text-yellow-300">
            {state.currentRound}
          </span>{' '}
          / {state.settings.rounds}
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isHumanTurn ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
            }`}
          />
          <span className="text-white/80 text-sm font-medium">
            {currentPlayer.name}&apos;s turn
          </span>
          {currentPlayer.type === 'cpu' && (
            <span className="text-xs text-white/50 animate-pulse">
              thinking…
            </span>
          )}
        </div>

        <div className="text-white/60 text-xs">
          {state.settings.penaltyOnSameNumber && (
            <span className="bg-red-600/30 text-red-300 px-2 py-0.5 rounded text-xs border border-red-500/30">
              Same # = Penalty
            </span>
          )}
        </div>
      </div>

      {/* ── Compact player hand-count strip ─────────────────────────── */}
      <div className="flex items-center justify-center flex-wrap gap-1.5 px-1">
        {state.players.map((player, idx) => {
          const isCurrent = idx === state.currentPlayerIndex;
          const handCount = player.hand.length;
          return (
            <div
              key={player.id}
              className={[
                'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors duration-200',
                isCurrent
                  ? 'bg-yellow-400/20 border border-yellow-400/40 text-yellow-300'
                  : 'bg-white/5 border border-white/10 text-white/50',
              ].join(' ')}
            >
              {isCurrent && (
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
              )}
              <span className="max-w-[5rem] truncate font-medium">{player.name}</span>
              {player.type === 'cpu' && (
                <span className="text-[10px] text-white/30 shrink-0">CPU</span>
              )}
              <span
                className={[
                  'ml-0.5 px-1.5 rounded text-[10px] font-bold shrink-0',
                  handCount > 0
                    ? isCurrent
                      ? 'bg-yellow-500/40 text-yellow-200'
                      : 'bg-white/15 text-white/70'
                    : 'bg-white/5 text-white/30',
                ].join(' ')}
              >
                {handCount}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Main play area ───────────────────────────────────────────── */}
      <div className="relative felt-table rounded-2xl p-4">
        {/* Circle of cards */}
        <CircleBoard
          state={state}
          onCardClick={onFlipCircleCard}
          isHumanTurn={isHumanTurn}
          isAnimating={isAnimating}
          flippingCard={flippingCard}
        />

        {/* Central pile overlay – centered within the circle area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <CentralPile pile={state.centralPile} isPenaltyAnimation={isPenaltyAnim} />
          </div>
        </div>
      </div>

      {/* ── Turn instruction banner ──────────────────────────────────── */}
      {isHumanTurn && (
        <div className="glass px-4 py-2 text-center animate-float-in">
          <p className="text-yellow-300 font-semibold text-sm">あなたのターン</p>
          {hasHandCards ? (
            <p className="text-white/60 text-xs mt-0.5">
              円のカードをめくるか、手札のカードを出してください。
            </p>
          ) : (
            <p className="text-white/60 text-xs mt-0.5">
              円の中の裏向きカードをタップしてください。
            </p>
          )}
        </div>
      )}

      {/* ── Penalty notice ───────────────────────────────────────────── */}
      {state.lastPenaltyPlayerIndex !== undefined && (
        <div className="glass px-4 py-2 text-center border-red-500/30 bg-red-900/20 animate-float-in">
          <p className="text-red-300 font-bold text-sm">
            {state.players[state.lastPenaltyPlayerIndex].name} がペナルティ!
          </p>
          <p className="text-white/50 text-xs mt-0.5">
            同じスートが一致 — 台札のカードがすべて手札に。
          </p>
        </div>
      )}

      {/* ── Player panels ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {state.players.map((player, idx) => (
          <PlayerHand
            key={player.id}
            player={player}
            isCurrentPlayer={idx === state.currentPlayerIndex}
            isHumanControlled={player.type === 'human' && idx === humanPlayerIndex}
            onPlayFromHand={(cardId) => {
              if (idx === state.currentPlayerIndex && isHumanTurn) {
                onPlayFromHand(cardId);
              }
            }}
            isAnimating={isAnimating}
            topPileCard={topCard}
            penaltyOnSameNumber={state.settings.penaltyOnSameNumber}
            showPenaltyHighlight={state.lastPenaltyPlayerIndex === idx}
            flippingCardId={
              flippingCard?.source === 'hand' ? flippingCard.handCardId : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
