'use client';

import type { Player } from '@/types/game';

interface PlayerInfoProps {
  player: Player;
  isCurrentTurn: boolean;
  position?: 'top' | 'left' | 'right' | 'bottom';
}

export function PlayerInfo({ player, isCurrentTurn }: PlayerInfoProps) {
  return (
    <div
      className={[
        'rounded-lg p-2 text-center transition-all duration-300 min-w-[80px]',
        isCurrentTurn
          ? 'bg-yellow-600/80 ring-2 ring-yellow-400 scale-105 shadow-lg shadow-yellow-500/30'
          : 'bg-black/40',
      ].join(' ')}
    >
      {/* Name row */}
      <div className="flex items-center justify-center gap-1 mb-1">
        <span className="text-sm" aria-hidden>
          {player.type === 'cpu' ? '🤖' : '👤'}
        </span>
        <span className="text-xs font-bold text-white truncate max-w-[80px]">
          {player.name}
        </span>
      </div>

      {/* Hand count */}
      <div className="text-xs text-gray-300">
        手札:{' '}
        <span
          className={`font-bold ${
            player.hand.length > 5 ? 'text-red-400' : 'text-white'
          }`}
        >
          {player.hand.length}枚
        </span>
      </div>

      {/* Total penalty */}
      <div className="text-xs text-gray-400">合計: {player.totalPenaltyCount}枚</div>

      {/* Turn indicator */}
      {isCurrentTurn && (
        <div className="text-xs text-yellow-300 font-bold mt-1 animate-pulse">
          ← 番
        </div>
      )}
    </div>
  );
}
