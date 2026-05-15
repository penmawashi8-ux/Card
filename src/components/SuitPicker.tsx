'use client';

import type { Suit } from '@/types/game';
import { SUIT_SYMBOLS, SUIT_NAMES_JP } from '@/types/game';

interface SuitPickerProps {
  onSelect: (suit: Suit) => void;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

const SUIT_BG: Record<Suit, string> = {
  hearts: 'bg-red-100 hover:bg-red-200 border-red-400 text-red-600',
  diamonds: 'bg-orange-100 hover:bg-orange-200 border-orange-400 text-orange-600',
  clubs: 'bg-stone-100 hover:bg-stone-200 border-stone-500 text-stone-800',
  spades: 'bg-slate-100 hover:bg-slate-200 border-slate-500 text-slate-800',
};

export default function SuitPicker({ onSelect }: SuitPickerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 animate-bounce-in">
        <h2 className="text-center text-white font-bold text-xl mb-2">
          スートを宣言
        </h2>
        <p className="text-center text-white/60 text-sm mb-6">
          ジョーカーのスートを選んでください
        </p>

        <div className="grid grid-cols-2 gap-3">
          {SUITS.map((suit) => (
            <button
              key={suit}
              className={`
                flex flex-col items-center justify-center gap-2
                px-4 py-6 rounded-xl border-2 font-bold
                transition-all duration-150 active:scale-95
                ${SUIT_BG[suit]}
              `}
              onClick={() => onSelect(suit)}
            >
              <span className="text-4xl">{SUIT_SYMBOLS[suit]}</span>
              <span className="text-sm">{SUIT_NAMES_JP[suit]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
