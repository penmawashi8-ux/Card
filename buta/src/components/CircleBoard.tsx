'use client';

import React, { useMemo } from 'react';
import type { GameState } from '@/types/game';
import { getCircleCardIndices } from '@/lib/gameLogic';
import CardBack from './CardBack';

interface CircleBoardProps {
  state: GameState;
  onCardClick: (index: number) => void;
  isHumanTurn: boolean;
  isAnimating: boolean;
}

/**
 * Renders the 52-card circle (pig's tail) laid out around an ellipse.
 * Cards that have been played are shown as empty slots.
 */
export default function CircleBoard({
  state,
  onCardClick,
  isHumanTurn,
  isAnimating,
}: CircleBoardProps) {
  const total = state.circleCards.length; // should be 52
  const availableIndices = useMemo(
    () => new Set(getCircleCardIndices(state)),
    [state],
  );

  // Layout: place cards around an ellipse
  const RX = 42; // % of container width (semi-axis x)
  const RY = 38; // % of container height (semi-axis y)
  const CX = 50; // % center x
  const CY = 50; // % center y

  const positions = useMemo(() => {
    return Array.from({ length: total }, (_, i) => {
      const angle = (2 * Math.PI * i) / total - Math.PI / 2; // start at top
      const x = CX + RX * Math.cos(angle);
      const y = CY + RY * Math.sin(angle);
      return { x, y };
    });
  }, [total]);

  return (
    <div
      className="relative w-full"
      style={{ paddingBottom: '60%' }}
      aria-label="Card circle"
    >
      {positions.map(({ x, y }, idx) => {
        const hasCard = availableIndices.has(idx);
        const canClick = isHumanTurn && hasCard && !isAnimating;

        return (
          <div
            key={idx}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {hasCard ? (
              <CardBack
                size="sm"
                onClick={canClick ? () => onCardClick(idx) : undefined}
                disabled={!canClick}
                className={canClick ? 'animate-pulse-subtle' : ''}
              />
            ) : (
              /* Empty slot */
              <div
                className="w-10 h-14 rounded-lg border border-dashed border-white/20 bg-black/10"
                aria-label={`Empty slot ${idx}`}
              />
            )}
          </div>
        );
      })}

      {/* Remaining card count badge */}
      <div className="absolute bottom-1 right-2 text-white/50 text-xs">
        {availableIndices.size} / {total} cards
      </div>
    </div>
  );
}
