'use client';

import React from 'react';
import type { Card, Suit } from '@/types/game';
import { cardValueLabel, suitSymbol, isRedSuit } from '@/lib/gameLogic';

interface CardFaceProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  disabled?: boolean;
  highlighted?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-10 h-14 text-xs',
  md: 'w-14 h-20 text-sm',
  lg: 'w-16 h-24 text-base',
  xl: 'w-20 h-28 text-lg',
} as const;

const SUIT_BIG_SIZE = {
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
} as const;

function getSuitColor(suit: Suit): string {
  return isRedSuit(suit) ? 'text-red-600' : 'text-stone-900';
}

export default function CardFace({
  card,
  size = 'md',
  onClick,
  disabled = false,
  highlighted = false,
  className = '',
}: CardFaceProps) {
  const label = cardValueLabel(card.value);
  const symbol = suitSymbol(card.suit);
  const colorClass = getSuitColor(card.suit);
  const sizeClass = SIZE_CLASSES[size];
  const bigSymbolClass = SUIT_BIG_SIZE[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={[
        'relative rounded-lg select-none transition-all duration-150',
        'bg-amber-50 border-2 shadow-md',
        highlighted
          ? 'border-yellow-400 shadow-yellow-400/50 shadow-lg ring-2 ring-yellow-400'
          : 'border-yellow-700/60',
        onClick && !disabled
          ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg active:scale-95'
          : 'cursor-default',
        disabled ? 'opacity-50' : '',
        colorClass,
        sizeClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Top-left label */}
      <span className="absolute top-0.5 left-1 leading-none font-bold">
        {label}
        <br />
        <span className="leading-none">{symbol}</span>
      </span>

      {/* Centre suit symbol */}
      <span className={`${bigSymbolClass} font-normal leading-none`}>
        {symbol}
      </span>

      {/* Bottom-right label (rotated) */}
      <span className="absolute bottom-0.5 right-1 leading-none font-bold rotate-180">
        {label}
        <br />
        <span className="leading-none">{symbol}</span>
      </span>
    </button>
  );
}
