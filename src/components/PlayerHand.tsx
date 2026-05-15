'use client';

import React from 'react';
import type { Player, Card } from '@/types/game';
import CardFace from './CardFace';
import CardBack from './CardBack';

interface PlayerHandProps {
  player: Player;
  isCurrentPlayer: boolean;
  isHumanControlled: boolean;
  onPlayFromHand: (cardId: string) => void;
  isAnimating: boolean;
  topPileCard: Card | null;
  penaltyOnSameNumber: boolean;
  showPenaltyHighlight?: boolean;
}

/**
 * Shows a player's penalty hand. Human hands are face-up (interactive),
 * CPU hands are shown as face-down card backs with count.
 */
export default function PlayerHand({
  player,
  isCurrentPlayer,
  isHumanControlled,
  onPlayFromHand,
  isAnimating,
  topPileCard,
  penaltyOnSameNumber,
  showPenaltyHighlight = false,
}: PlayerHandProps) {
  const hasCards = player.hand.length > 0;

  function isSafeToPlay(card: Card): boolean {
    if (!topPileCard) return true;
    if (card.suit === topPileCard.suit) return false;
    if (penaltyOnSameNumber && card.value === topPileCard.value) return false;
    return true;
  }

  return (
    <div
      className={[
        'rounded-xl p-3 transition-all duration-300',
        isCurrentPlayer
          ? 'bg-yellow-400/20 border-2 border-yellow-400/60 shadow-yellow-400/20 shadow-lg'
          : 'bg-white/5 border border-white/10',
        showPenaltyHighlight ? 'animate-penalty-shake' : '',
      ].join(' ')}
    >
      {/* Player header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCurrentPlayer && (
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          )}
          <span
            className={`font-semibold text-sm ${
              isCurrentPlayer ? 'text-yellow-300' : 'text-white/70'
            }`}
          >
            {player.name}
          </span>
          {player.type === 'cpu' && (
            <span className="text-xs text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
              CPU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>Round: {player.penaltyCountThisRound}</span>
          <span className="text-white/30">|</span>
          <span>Total: {player.totalPenaltyCount}</span>
        </div>
      </div>

      {/* Hand cards */}
      {!hasCards ? (
        <div className="text-white/30 text-xs italic py-1">No penalty cards</div>
      ) : isHumanControlled ? (
        /* Human player – show cards face-up */
        <div className="flex flex-wrap gap-1.5">
          {player.hand.map((card) => {
            const safe = isSafeToPlay(card);
            const canPlay = isCurrentPlayer && !isAnimating;
            return (
              <div key={card.id} className="relative">
                <CardFace
                  card={card}
                  size="sm"
                  onClick={canPlay ? () => onPlayFromHand(card.id) : undefined}
                  disabled={!canPlay}
                  highlighted={canPlay && safe}
                />
                {canPlay && !safe && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full
                               flex items-center justify-center text-white text-[8px] font-bold"
                    title="Playing this card will cause a penalty"
                  >
                    !
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* CPU player – show face-down with count */
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-3">
            {Array.from({ length: Math.min(player.hand.length, 5) }).map(
              (_, i) => (
                <CardBack key={i} size="sm" className="relative" />
              ),
            )}
          </div>
          {player.hand.length > 5 && (
            <span className="text-white/60 text-sm font-bold">
              +{player.hand.length - 5}
            </span>
          )}
          <span className="ml-1 text-white/40 text-xs">
            ({player.hand.length} cards)
          </span>
        </div>
      )}
    </div>
  );
}
