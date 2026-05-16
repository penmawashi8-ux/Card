'use client';

import type { Trick, Player } from '@/types/game';
import { SUIT_SYMBOLS, SUIT_NAMES_JP } from '@/types/game';
import { CardComponent } from './CardComponent';

interface TrickAreaProps {
  trick: Trick;
  players: Player[];
  phase: string;
}

const PLAYER_COLORS = [
  'bg-sky-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
];

export default function TrickArea({ trick, players, phase }: TrickAreaProps) {
  const effectiveSuit = trick.declaredSuit ?? trick.leadSuit;
  const isResult = phase === 'trick_result';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Lead suit indicator */}
      {effectiveSuit && (
        <div className="flex items-center gap-1.5 glass px-3 py-1 rounded-full whitespace-nowrap">
          <span className="text-white/60 text-xs">リードスート</span>
          <span
            className={`font-bold text-base ${
              effectiveSuit === 'hearts' || effectiveSuit === 'diamonds'
                ? 'text-red-400'
                : 'text-white'
            }`}
          >
            {SUIT_SYMBOLS[effectiveSuit]}
          </span>
          <span className="text-white/80 text-xs">{SUIT_NAMES_JP[effectiveSuit]}</span>
        </div>
      )}

      {/* Trick cards */}
      <div className="flex gap-3 items-end justify-center">
        {trick.cards.length === 0 ? (
          <div className="text-white/30 text-sm py-4">カードなし</div>
        ) : (
          trick.cards.map((trickCard) => {
            const playerIdx = players.findIndex((p) => p.id === trickCard.playerId);
            const player = players[playerIdx];
            const isWinner = isResult && trickCard.playerId === trick.winnerId;
            const color = PLAYER_COLORS[playerIdx % PLAYER_COLORS.length];
            return (
              <div key={trickCard.card.id} className="flex flex-col items-center gap-1">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full text-white font-semibold whitespace-nowrap ${color}`}
                >
                  {player?.name ?? '?'}
                </span>
                <CardComponent
                  card={trickCard.card}
                  size="sm"
                  className={isWinner ? 'ring-2 ring-yellow-400 scale-105' : ''}
                />
                {isWinner && (
                  <span className="text-yellow-300 text-xs font-bold">勝ち!</span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Winner announcement */}
      {isResult && trick.winnerId && (
        <div className="glass px-3 py-1.5 rounded-lg text-center animate-bounce-in">
          <span className="text-yellow-300 font-bold text-sm">
            {players.find((p) => p.id === trick.winnerId)?.name} のトリック勝ち！
          </span>
        </div>
      )}
    </div>
  );
}
