'use client';

import type { Trick, Player } from '@/types/game';
import { SUIT_SYMBOLS, SUIT_NAMES_JP } from '@/types/game';
import { CardComponent } from './CardComponent';

interface TrickAreaProps {
  trick: Trick;
  players: Player[];
  phase: string;
}

export default function TrickArea({ trick, players, phase }: TrickAreaProps) {
  const effectiveSuit = trick.declaredSuit ?? trick.leadSuit;
  const isResult = phase === 'trick_result';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Lead suit indicator */}
      {effectiveSuit && (
        <div className="flex items-center gap-2 glass px-3 py-1.5 rounded-full text-sm">
          <span className="text-white/60">リードスート:</span>
          <span
            className={`font-bold text-lg ${
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

      {/* Trick cards arranged in a small grid */}
      <div className="flex flex-wrap justify-center gap-2 min-h-[90px] items-center">
        {trick.cards.length === 0 ? (
          <div className="text-white/30 text-sm">カードがありません</div>
        ) : (
          trick.cards.map((trickCard) => {
            const player = players.find((p) => p.id === trickCard.playerId);
            const isWinner = isResult && trickCard.playerId === trick.winnerId;
            return (
              <div key={trickCard.card.id} className="flex flex-col items-center gap-1">
                <CardComponent
                  card={trickCard.card}
                  size="sm"
                  className={isWinner ? 'ring-2 ring-yellow-400 scale-110' : ''}
                />
                <span className="text-white/60 text-xs truncate max-w-[60px] text-center">
                  {player?.name ?? '?'}
                </span>
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
        <div className="glass px-4 py-2 rounded-xl text-center animate-bounce-in">
          <span className="text-yellow-300 font-bold">
            {players.find((p) => p.id === trick.winnerId)?.name ?? '?'} のトリック勝ち！
          </span>
        </div>
      )}
    </div>
  );
}
