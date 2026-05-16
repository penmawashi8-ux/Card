'use client';

import type { Card } from '@/types/buta';

interface CardCircleProps {
  circleCards: (Card | null)[];
  onCardClick: (index: number) => void;
  disabled: boolean;
}

export function CardCircle({ circleCards, onCardClick, disabled }: CardCircleProps) {
  const remaining = circleCards.filter((c) => c !== null).length;

  // Ellipse parameters – sized to fit inside a 320×280 container
  const cx = 160; // centre x
  const cy = 140; // centre y
  const rx = 145; // horizontal radius
  const ry = 115; // vertical radius

  // Card half-dimensions (sm size: 40×56)
  const halfW = 20;
  const halfH = 28;

  return (
    <div className="relative" style={{ width: 320, height: 280 }}>
      {circleCards.map((card, i) => {
        const angle = (i / 52) * 2 * Math.PI - Math.PI / 2;
        const x = cx + rx * Math.cos(angle) - halfW;
        const y = cy + ry * Math.sin(angle) - halfH;
        // Rotate each card so it "faces" outward from center
        const rotation = (i / 52) * 360;

        if (card === null) {
          // Empty slot – faded dashed outline
          return (
            <div
              key={i}
              className="absolute rounded border border-dashed border-gray-500/30"
              style={{
                width: 40,
                height: 56,
                left: x,
                top: y,
                transform: `rotate(${rotation}deg)`,
                transformOrigin: 'center',
              }}
            />
          );
        }

        return (
          <div
            key={i}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label={`場札 ${i + 1}枚目`}
            className={[
              'absolute rounded-md border-2 transition-all duration-150',
              'bg-blue-800 border-blue-500',
              disabled
                ? 'opacity-60 cursor-not-allowed'
                : 'cursor-pointer hover:brightness-125 hover:z-10 hover:scale-110 active:scale-95',
            ].join(' ')}
            style={{
              width: 40,
              height: 56,
              left: x,
              top: y,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center',
              boxShadow: '1px 1px 4px rgba(0,0,0,0.5)',
              backgroundImage:
                'repeating-linear-gradient(45deg, #1e3a8a 0px, #1e3a8a 5px, #1d4ed8 5px, #1d4ed8 10px)',
            }}
            onClick={() => !disabled && onCardClick(i)}
            onKeyDown={(e) => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) onCardClick(i);
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-blue-300/50 text-xs select-none">🐷</span>
            </div>
          </div>
        );
      })}

      {/* Centre info */}
      <div
        className="absolute flex flex-col items-center justify-center pointer-events-none"
        style={{ left: cx - 36, top: cy - 36, width: 72, height: 72 }}
      >
        <div className="text-3xl leading-none">🐷</div>
        <div className="text-xs font-bold text-green-300 mt-1">{remaining}枚</div>
      </div>
    </div>
  );
}
