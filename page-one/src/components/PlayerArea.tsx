'use client';

import type { Player, Trick } from '@/types/game';
import { canPlayCard } from '@/lib/gameLogic';
import { CardComponent } from './CardComponent';

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer: boolean;
  isHumanControlled: boolean;
  onPlayCard?: (cardId: string) => void;
  position: 'bottom' | 'top' | 'left' | 'right';
  currentTrick: Trick;
  phase: string;
  seatIndex: number;
}

export default function PlayerArea({
  player,
  isCurrentPlayer,
  isHumanControlled,
  onPlayCard,
  position,
  currentTrick,
  phase,
  seatIndex,
}: PlayerAreaProps) {
  const isPlayPhase = phase === 'leading' || phase === 'following';
  const canPlay = isCurrentPlayer && isHumanControlled && isPlayPhase;

  // Highlight playable cards
  const isLeading = phase === 'leading';
  const isFollowing = phase === 'following';

  const getCardHighlight = (card: typeof player.hand[0]): boolean => {
    if (!canPlay) return false;
    if (isLeading) return true; // any card can be played when leading
    if (isFollowing) return canPlayCard(card, currentTrick);
    return false;
  };

  const cardSize = position === 'bottom' ? 'md' : 'sm';
  const isHorizontal = position === 'bottom' || position === 'top';
  const isSideways = position === 'left' || position === 'right';

  return (
    <div
      className={`
        flex flex-col items-center gap-2 transition-all duration-200
        ${isCurrentPlayer ? 'scale-105' : ''}
      `}
    >
      {/* Player info badge */}
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold
          ${isCurrentPlayer
            ? 'bg-yellow-400 text-stone-900 shadow-lg shadow-yellow-400/40'
            : 'glass text-white/80'}
        `}
      >
        {isCurrentPlayer && (
          <span className="w-2 h-2 rounded-full bg-stone-900 animate-pulse" />
        )}
        <span className="truncate max-w-[100px]">{player.name}</span>
        <span
          className={`
            text-xs px-1.5 py-0.5 rounded-full
            ${isCurrentPlayer ? 'bg-stone-900/20' : 'bg-white/10'}
          `}
        >
          {player.hand.length}枚
        </span>
        {player.pageOneDeclared && (
          <span className="text-xs bg-orange-500 text-white px-1 py-0.5 rounded font-bold">
            P1
          </span>
        )}
        {player.type === 'cpu' && (
          <span className="text-xs opacity-50">(CPU)</span>
        )}
      </div>

      {/* Score */}
      <div className="text-xs text-white/50">
        スコア: <span className={`font-bold ${player.score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {player.score > 0 ? '+' : ''}{player.score}
        </span>
      </div>

      {/* Cards */}
      {isHumanControlled ? (
        // Human player: show cards face-up
        <div className={`flex flex-wrap justify-center gap-1 ${isHorizontal ? '' : 'flex-col'}`}>
          {player.hand.map((card) => {
            const highlight = getCardHighlight(card);
            const isPlayable = canPlay && (isLeading || canPlayCard(card, currentTrick));
            return (
              <CardComponent
                key={card.id}
                card={card}
                size={cardSize}
                onClick={isPlayable ? () => onPlayCard?.(card.id) : undefined}
                disabled={canPlay && !isPlayable}
                highlight={highlight && !canPlay ? false : highlight}
                selected={false}
              />
            );
          })}
          {player.hand.length === 0 && (
            <div className="text-white/30 text-sm py-2">手札なし</div>
          )}
        </div>
      ) : (
        // CPU / other player: show card backs with count
        <div className={`flex flex-wrap justify-center gap-0.5 ${isSideways ? 'flex-col' : ''}`}>
          {player.hand.slice(0, Math.min(player.hand.length, 8)).map((card, i) => (
            <CardComponent
              key={card.id}
              size="xs"
            />
          ))}
          {player.hand.length > 8 && (
            <div className="text-white/50 text-xs self-center">
              +{player.hand.length - 8}
            </div>
          )}
          {player.hand.length === 0 && (
            <div className="text-white/30 text-xs py-1">手札なし</div>
          )}
        </div>
      )}
    </div>
  );
}
