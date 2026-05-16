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
    <div className="flex flex-col items-center gap-1">
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
          <div
            key={topCard.id}
            className={[
              'animate-card-land z-10 relative',
              isPenaltyAnimation ? 'animate-pile-glow rounded-xl' : '',
            ].join(' ')}
          >
            <CardFace card={topCard} size="xl" />
          </div>
        ) : (
          <div className="w-20 h-28 rounded-xl border-2 border-dashed border-white/30 flex items-center justify-center">
            <span className="text-white/40 text-xs text-center px-2">台札</span>
          </div>
        )}

        {/* Card count badge */}
        {stackSize > 0 && (
          <span className="absolute -top-1.5 -right-1.5 z-20 min-w-[1.25rem] h-5 px-1 rounded-full bg-yellow-500 text-stone-900 text-[10px] font-bold flex items-center justify-center shadow">
            {stackSize}
          </span>
        )}
      </div>

      {/* Suit + value hint – compact single line */}
      {topCard && (
        <div
          className={`text-base font-bold leading-none ${
            isRedSuit(topCard.suit) ? 'text-red-400' : 'text-white/80'
          }`}
        >
          {suitSymbol(topCard.suit)}
          <span className="text-xs font-normal text-white/50 ml-0.5">
            {cardValueLabel(topCard.value)}
          </span>
        </div>
      )}
    </div>
  );
}
