'use client';

interface DrawPileProps {
  drawCount: number;
  discardCount: number;
  isDrawing: boolean;
}

export default function DrawPile({ drawCount, discardCount, isDrawing }: DrawPileProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Draw pile */}
      <div className="flex flex-col items-center gap-1">
        <div
          className={`
            relative w-14 h-20 rounded-lg border-2 bg-blue-800
            flex items-center justify-center
            ${isDrawing ? 'border-yellow-400 animate-pulse shadow-lg shadow-yellow-400/40' : 'border-blue-600'}
          `}
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #1e3a8a 0px, #1e3a8a 6px, #1d4ed8 6px, #1d4ed8 12px)',
          }}
        >
          {/* Stack depth indicator */}
          {drawCount > 0 && (
            <>
              <div className="absolute -bottom-1 -right-1 w-14 h-20 rounded-lg border-2 border-blue-700 bg-blue-900 -z-10"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, #1e3a8a 0px, #1e3a8a 6px, #1d4ed8 6px, #1d4ed8 12px)',
                }}
              />
            </>
          )}
          <span className="text-white font-bold text-sm z-10">
            {drawCount > 0 ? drawCount : '空'}
          </span>
        </div>
        <span className="text-white/60 text-xs">山札</span>
      </div>

      {/* Discard pile indicator */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-14 h-20 rounded-lg border-2 border-white/20 bg-white/10 flex items-center justify-center">
          <span className="text-white/50 font-bold text-sm">
            {discardCount > 0 ? discardCount : '0'}
          </span>
        </div>
        <span className="text-white/60 text-xs">捨て札</span>
      </div>
    </div>
  );
}
