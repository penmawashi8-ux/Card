'use client';

import type { Card } from '@/types/game';

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<string, string> = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-stone-900',
  spades: 'text-stone-900',
};

function getValueLabel(value: number): string {
  if (value === 1) return 'A';
  if (value === 11) return 'J';
  if (value === 12) return 'Q';
  if (value === 13) return 'K';
  return String(value);
}

const SIZES = {
  sm: { w: 40, h: 56, text: 'text-xs', symbol: 'text-sm', pig: 10 },
  md: { w: 56, h: 80, text: 'text-sm', symbol: 'text-xl', pig: 14 },
  lg: { w: 80, h: 112, text: 'text-base', symbol: 'text-3xl', pig: 20 },
};

interface CardComponentProps {
  card?: Card;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CardComponent({
  card,
  size = 'md',
  onClick,
  selected = false,
  disabled = false,
  className = '',
}: CardComponentProps) {
  const s = SIZES[size];

  const baseClasses = [
    'relative rounded-lg border-2 inline-flex flex-col justify-between p-1 select-none transition-all duration-150',
    selected ? 'border-yellow-400 -translate-y-2 shadow-lg shadow-yellow-400/40' : 'border-gray-300',
    disabled
      ? 'opacity-50 cursor-not-allowed'
      : onClick
      ? 'cursor-pointer hover:brightness-110 active:scale-95'
      : 'cursor-default',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (!card) {
    // Card back – diagonal stripe pattern via inline style
    return (
      <div
        className={`${baseClasses} bg-blue-800 border-blue-600`}
        style={{
          width: s.w,
          height: s.h,
          backgroundImage:
            'repeating-linear-gradient(45deg, #1e3a8a 0px, #1e3a8a 6px, #1d4ed8 6px, #1d4ed8 12px)',
          boxShadow: '2px 2px 6px rgba(0,0,0,0.4)',
        }}
        onClick={disabled ? undefined : onClick}
        role={onClick && !disabled ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        onKeyDown={
          onClick && !disabled
            ? (e) => e.key === 'Enter' || e.key === ' ' ? onClick() : undefined
            : undefined
        }
      >
        <div className="absolute inset-1 rounded border border-blue-500/40 flex items-center justify-center">
          <span className="text-blue-300 opacity-60" style={{ fontSize: s.pig }}>
            🐷
          </span>
        </div>
      </div>
    );
  }

  const color = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];
  const label = getValueLabel(card.value);

  return (
    <div
      className={`${baseClasses} bg-amber-50`}
      style={{
        width: s.w,
        height: s.h,
        boxShadow: '2px 2px 6px rgba(0,0,0,0.4)',
      }}
      onClick={disabled ? undefined : onClick}
      role={onClick && !disabled ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={
        onClick && !disabled
          ? (e) => e.key === 'Enter' || e.key === ' ' ? onClick() : undefined
          : undefined
      }
    >
      {/* Top-left corner */}
      <div className={`${s.text} font-bold leading-none ${color}`}>
        <div>{label}</div>
        <div>{symbol}</div>
      </div>

      {/* Centre suit symbol */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${color} ${s.symbol} font-bold pointer-events-none`}
      >
        {symbol}
      </div>

      {/* Bottom-right corner (rotated 180°) */}
      <div className={`${s.text} font-bold leading-none ${color} self-end rotate-180`}>
        <div>{label}</div>
        <div>{symbol}</div>
      </div>
    </div>
  );
}
