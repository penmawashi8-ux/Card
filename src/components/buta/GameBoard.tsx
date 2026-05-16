'use client';

import React, { useMemo } from 'react';
import type { GameState } from '@/types/buta';
import { getTopCard, canPlayFromHand } from '@/lib/buta/gameLogic';
import CircleBoard from './CircleBoard';
import CentralPile from './CentralPile';
import PlayerHand from './PlayerHand';

interface GameBoardProps {
  state: GameState;
  humanPlayerIndex: number;
  onFlipCircleCard: (index: number) => void;
  onPlayFromHand: (cardId: string) => void;
  isAnimating: boolean;
}

export default function GameBoard({
  state,
  humanPlayerIndex,
  onFlipCircleCard,
  onPlayFromHand,
  isAnimating,
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
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto px-4 py-4">
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

      {/* ── Main play area ───────────────────────────────────────────── */}
      <div className="relative felt-table rounded-2xl p-4 min-h-[420px]">
        {/* Circle of cards */}
        <CircleBoard
          state={state}
          onCardClick={onFlipCircleCard}
          isHumanTurn={isHumanTurn}
          isAnimating={isAnimating}
        />

        {/* Central pile overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <CentralPile pile={state.centralPile} isPenaltyAnimation={isPenaltyAnim} />
          </div>
        </div>
      </div>

      {/* ── Turn instruction banner ──────────────────────────────────── */}
      {isHumanTurn && (
        <div className="glass px-4 py-3 text-center animate-float-in">
          <p className="text-yellow-300 font-semibold">Your turn!</p>
          {hasHandCards ? (
            <p className="text-white/70 text-sm mt-1">
              Flip a card from the circle, or play a card from your hand below.
            </p>
          ) : (
            <p className="text-white/70 text-sm mt-1">
              Click any face-down card in the circle to flip it.
            </p>
          )}
        </div>
      )}

      {/* ── Penalty notice ───────────────────────────────────────────── */}
      {state.lastPenaltyPlayerIndex !== undefined && (
        <div className="glass px-4 py-3 text-center border-red-500/30 bg-red-900/20 animate-float-in">
          <p className="text-red-300 font-bold">
            {state.players[state.lastPenaltyPlayerIndex].name} got a penalty!
          </p>
          <p className="text-white/60 text-sm mt-1">
            Same suit matched – all pile cards go to hand.
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
          />
        ))}
      </div>
    </div>
  );
}
