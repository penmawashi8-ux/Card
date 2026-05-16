'use client';

import React from 'react';
import type { Card } from '@/types/game';
import { suitSymbol, cardValueLabel, isRedSuit } from '@/lib/gameLogic';
import CardFace from './CardFace';

interface CentralPileProps {
  pile: Card[];
  isPenaltyAnimation?: boolean;
}

/**
 * Displays the central pile (台札). Shows the top card prominently and a
 * stack indicator for how many cards are beneath it.
 */
export default function CentralPile({ pile, isPenaltyAnimation }: CentralPileProps) {
  const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
  const stackSize = pile.length;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-white/60 text-xs font-medium tracking-wide uppercase">
        台札 Central Pile
      </p>

      <div
        className={[
          'relative flex items-center justify-center w-20 h-28 rounded-xl',
          isPenaltyAnimation ? 'animate-penalty-shake' : '',
        ].join(' ')}
      >
        {/* Stack shadow cards */}
        {stackSize > 1 && (
          <>
            <div className="absolute top-2 left-2 w-16 h-24 rounded-lg bg-amber-100/40 border border-yellow-700/30 shadow" />
            {stackSize > 2 && (
              <div className="absolute top-1 left-1 w-16 h-24 rounded-lg bg-amber-100/30 border border-yellow-700/20 shadow" />
            )}
          </>
        )}

        {topCard ? (
          <div className={isPenaltyAnimation ? 'animate-pile-glow rounded-xl' : ''}>
            <CardFace card={topCard} size="xl" className="z-10 relative" />
          </div>
        ) : (
          <div className="w-20 h-28 rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center">
            <span className="text-white/40 text-xs text-center px-2">
              Empty
            </span>
          </div>
        )}
      </div>

      {/* Card count */}
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-yellow-400/70" />
        <span className="text-white/60 text-xs">
          {stackSize} card{stackSize !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Last played card suit hint */}
      {topCard && (
        <div
          className={`text-lg font-bold ${
            isRedSuit(topCard.suit) ? 'text-red-400' : 'text-white/80'
          }`}
        >
          {suitSymbol(topCard.suit)}{' '}
          <span className="text-sm font-normal text-white/60">
            {cardValueLabel(topCard.value)}
          </span>
        </div>
      )}
    </div>
  );
}
