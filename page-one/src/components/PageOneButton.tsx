'use client';

interface PageOneButtonProps {
  onDeclare: () => void;
  playerName: string;
}

export default function PageOneButton({ onDeclare, playerName }: PageOneButtonProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass p-8 rounded-2xl shadow-2xl max-w-xs w-full mx-4 animate-bounce-in text-center">
        <h2 className="text-white font-bold text-xl mb-1">
          {playerName}
        </h2>
        <p className="text-yellow-300 font-bold text-lg mb-6">
          手札が残り1枚です！
        </p>
        <button
          className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-stone-900 font-black text-2xl rounded-xl shadow-lg transition-all duration-150 active:scale-95 animate-pulse"
          onClick={onDeclare}
        >
          ページワン！
        </button>
        <p className="text-white/50 text-xs mt-3">
          忘れると5枚ペナルティ
        </p>
      </div>
    </div>
  );
}
