'use client';

interface DrawPileProps {
  drawCount: number;
  discardCount: number;
  isDrawing: boolean;
}

const CARD_BG =
  'repeating-linear-gradient(45deg,#1e3a8a 0px,#1e3a8a 5px,#1d4ed8 5px,#1d4ed8 10px)';

export default function DrawPile({ drawCount, discardCount, isDrawing }: DrawPileProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Draw pile */}
      <div className="flex flex-col items-center gap-1">
        <div
          className={`relative w-12 h-16 rounded-lg border-2 flex items-center justify-center
            ${isDrawing ? 'border-yellow-400 animate-pulse shadow-lg shadow-yellow-400/40' : 'border-blue-600 bg-blue-800'}`}
          style={{ backgroundImage: CARD_BG }}
        >
          {drawCount > 0 && (
            <div
              className="absolute -bottom-0.5 -right-0.5 w-12 h-16 rounded-lg border border-blue-700 -z-10"
              style={{ backgroundImage: CARD_BG }}
            />
          )}
          <span className="text-white font-bold text-xs z-10">
            {drawCount > 0 ? drawCount : '空'}
          </span>
        </div>
        <span className="text-white/60 text-[10px]">山札</span>
      </div>

      {/* Discard pile */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-12 h-16 rounded-lg border border-white/20 bg-white/10 flex items-center justify-center">
          <span className="text-white/50 font-bold text-xs">{discardCount}</span>
        </div>
        <span className="text-white/60 text-[10px]">捨て札</span>
      </div>
    </div>
  );
}
