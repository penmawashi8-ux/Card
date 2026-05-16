'use client';

import { useUpdateCheck } from '@/hooks/useUpdateCheck';

export function UpdateBanner() {
  const updateAvailable = useUpdateCheck();

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 bg-stone-900 border border-green-500/60 text-white rounded-2xl px-4 py-3 shadow-2xl max-w-sm w-full animate-bounce-in">
        <span className="text-xl shrink-0">🔄</span>
        <span className="text-sm flex-1 leading-snug">
          新しいバージョンがあります
        </span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 bg-green-600 hover:bg-green-500 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
        >
          更新する
        </button>
      </div>
    </div>
  );
}
