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
  xs: { w: 32, h: 44, text: 'text-[9px]', symbol: 'text-xs', jokerText: 'text-[7px]' },
  sm: { w: 44, h: 62, text: 'text-xs', symbol: 'text-sm', jokerText: 'text-[9px]' },
  md: { w: 60, h: 84, text: 'text-sm', symbol: 'text-xl', jokerText: 'text-xs' },
  lg: { w: 80, h: 112, text: 'text-base', symbol: 'text-3xl', jokerText: 'text-sm' },
};

interface CardComponentProps {
  card?: Card;         // undefined = card back (face-down)
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  highlight?: boolean; // glow highlight for playable cards
}

export function CardComponent({
  card,
  size = 'md',
  onClick,
  selected = false,
  disabled = false,
  className = '',
  highlight = false,
}: CardComponentProps) {
  const s = SIZES[size];

  const baseClasses = [
    'relative rounded-lg border-2 inline-flex flex-col justify-between p-1 select-none transition-all duration-150',
    selected ? 'border-yellow-400 -translate-y-3 shadow-lg shadow-yellow-400/60 ring-2 ring-yellow-400' : '',
    highlight && !selected ? 'border-green-400 shadow-md shadow-green-400/40' : '',
    !selected && !highlight ? 'border-gray-300' : '',
    disabled
      ? 'opacity-40 cursor-not-allowed'
      : onClick
      ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg active:scale-95'
      : 'cursor-default',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') onClick?.();
  };

  if (!card) {
    // Card back
    return (
      <div
        className={`${baseClasses} bg-blue-800 border-blue-600`}
        style={{
          width: s.w,
          height: s.h,
          backgroundImage:
            'repeating-linear-gradient(45deg, #1e3a8a 0px, #1e3a8a 6px, #1d4ed8 6px, #1d4ed8 12px)',
          boxShadow: '2px 2px 6px rgba(0,0,0,0.5)',
        }}
        onClick={disabled ? undefined : onClick}
        role={onClick && !disabled ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        onKeyDown={onClick && !disabled ? handleKey : undefined}
        aria-label="Card (face-down)"
      >
        <div className="absolute inset-1 rounded border border-blue-400/30 flex items-center justify-center">
          <span className="text-blue-300 opacity-50 font-bold text-xs">P1</span>
        </div>
      </div>
    );
  }

  // Joker
  if (card.isJoker) {
    return (
      <div
        className={`${baseClasses} bg-gradient-to-br from-purple-100 to-yellow-100 border-purple-400`}
        style={{
          width: s.w,
          height: s.h,
          boxShadow: '2px 2px 8px rgba(128,0,128,0.4)',
        }}
        onClick={disabled ? undefined : onClick}
        role={onClick && !disabled ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        onKeyDown={onClick && !disabled ? handleKey : undefined}
        aria-label="Joker"
      >
        <div className={`${s.text} font-bold leading-none text-purple-700`}>J</div>
        <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
          <span className="text-purple-600 font-black" style={{ fontSize: s.w * 0.32 }}>★</span>
        </div>
        <div className={`${s.jokerText} font-bold leading-none text-purple-700 self-end rotate-180`}>
          JOKER
        </div>
      </div>
    );
  }

  const color = card.suit ? SUIT_COLORS[card.suit] : 'text-stone-900';
  const symbol = card.suit ? SUIT_SYMBOLS[card.suit] : '';
  const label = card.value ? getValueLabel(card.value) : '';

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
      onKeyDown={onClick && !disabled ? handleKey : undefined}
      aria-label={`${label} of ${card.suit}`}
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
