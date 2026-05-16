'use client';

import React, { useMemo, useState, useEffect } from 'react';
import type { GameState, FlippingCardInfo, Card } from '@/types/game';
import { getCircleCardIndices } from '@/lib/gameLogic';
import CardBack from './CardBack';
import CardFace from './CardFace';

interface CircleBoardProps {
  state: GameState;
  onCardClick: (index: number) => void;
  isHumanTurn: boolean;
  isAnimating: boolean;
  flippingCard?: FlippingCardInfo | null;
}

/** 3-D card flip: shows CardBack, then flips to reveal CardFace */
function FlipCard({ card }: { card: Card }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), 20);
    return () => clearTimeout(t);
  }, []);
  return (
    // Outer wrapper: scale up + glow so the flipping card stands out
    <div
      className="relative z-20"
      style={{
        width: '2.5rem',
        height: '3.5rem',
        transform: 'scale(1.22) translateY(-4px)',
        filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.9))',
      }}
    >
      {/* Perspective parent */}
      <div style={{ perspective: '500px', width: '100%', height: '100%' }}>
        {/* Rotating container */}
        <div
          style={{
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d' as React.CSSProperties['transformStyle'],
            transition: 'transform 0.36s ease-in-out',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        >
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden' as React.CSSProperties['backfaceVisibility'],
              position: 'absolute',
              inset: 0,
            }}
          >
            <CardBack size="sm" />
          </div>
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden' as React.CSSProperties['backfaceVisibility'],
              transform: 'rotateY(180deg)',
              position: 'absolute',
              inset: 0,
            }}
          >
            <CardFace card={card} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
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
  flippingCard,
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
        const isFlipping =
          flippingCard?.source === 'circle' && flippingCard.circleIndex === idx;
        const canClick = isHumanTurn && hasCard && !isAnimating && !isFlipping;

        // Pulse animation runs whenever it's the human's turn with a card present,
        // independent of isAnimating — prevents animation restart on every state update.
        const showPulse = isHumanTurn && hasCard && !isFlipping;

        return (
          <div
            key={idx}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {isFlipping ? (
              <FlipCard card={flippingCard!.card} />
            ) : hasCard ? (
              /* Expanded touch target wrapper (p-3 = +12px each side) */
              <div
                className={[
                  'p-3 -m-3 rounded-xl',
                  canClick ? 'cursor-pointer' : 'cursor-default',
                ].join(' ')}
                onClick={canClick ? () => onCardClick(idx) : undefined}
              >
                <CardBack
                  size="sm"
                  disabled={!canClick}
                  className={[
                    'pointer-events-none',
                    showPulse ? 'animate-pulse-subtle' : '',
                  ].join(' ')}
                />
              </div>
            ) : (
              /* Empty slot – pointer-events-none so it never blocks card taps */
              <div
                className="w-10 h-14 rounded-lg border border-dashed border-white/20 bg-black/10 pointer-events-none"
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
