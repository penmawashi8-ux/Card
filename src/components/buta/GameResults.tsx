'use client';

import type { GameState } from '@/types/buta';

interface GameResultsProps {
  state: GameState;
  onNextRound: () => void;
  onNewGame: () => void;
}

export function GameResults({ state, onNextRound, onNewGame }: GameResultsProps) {
  const isGameEnd = state.phase === 'game_end';

  const sorted = [...state.players].sort((a, b) =>
    isGameEnd
      ? a.totalPenaltyCount - b.totalPenaltyCount
      : a.penaltyCountThisRound - b.penaltyCountThisRound,
  );
  const winner = sorted[0];

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-green-900 border-2 border-green-600 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-5">
          {isGameEnd ? (
            <>
              <div className="text-5xl mb-2 animate-bounce">🏆</div>
              <h2 className="text-2xl font-bold text-yellow-400">ゲーム終了！</h2>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">🔔</div>
              <h2 className="text-xl font-bold text-white">
                ラウンド {state.currentRound} 終了
              </h2>
            </>
          )}
          <p className="text-green-300 mt-2 text-sm">
            🎉 優勝:{' '}
            <span className="text-yellow-400 font-bold">{winner.name}</span>
          </p>
        </div>

        {/* Rankings table */}
        <div className="space-y-2 mb-5">
          {/* Header row */}
          <div className="grid grid-cols-4 text-xs text-gray-400 px-3 pb-1 border-b border-green-700">
            <span>順位</span>
            <span>名前</span>
            <span className="text-center">今回</span>
            <span className="text-center">合計</span>
          </div>

          {sorted.map((player, i) => (
            <div
              key={player.id}
              className={[
                'grid grid-cols-4 items-center rounded-lg px-3 py-2 text-sm',
                i === 0
                  ? 'bg-yellow-800/60 border border-yellow-600/40 text-yellow-300'
                  : 'bg-black/30 text-white',
              ].join(' ')}
            >
              <span className="font-bold text-base">
                {medals[i] ?? `${i + 1}位`}
              </span>
              <span className="truncate text-xs">
                {player.type === 'cpu' ? '🤖 ' : '👤 '}
                {player.name}
              </span>
              <span className="text-center font-medium">
                {player.penaltyCountThisRound}枚
              </span>
              <span className="text-center font-bold">
                {player.totalPenaltyCount}枚
              </span>
            </div>
          ))}
        </div>

        {/* Rounds remaining notice */}
        {!isGameEnd && (
          <p className="text-center text-xs text-gray-400 mb-4">
            残り {state.settings.rounds - state.currentRound} ラウンド
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {!isGameEnd && (
            <button
              onClick={onNextRound}
              className="flex-1 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold py-3 rounded-xl transition-all"
            >
              次のラウンドへ →
            </button>
          )}
          <button
            onClick={onNewGame}
            className={[
              isGameEnd ? 'flex-1' : '',
              'bg-gray-600 hover:bg-gray-500 active:scale-95 text-white font-bold py-3 px-4 rounded-xl transition-all',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {isGameEnd ? '🔄 もう一度' : 'やめる'}
          </button>
        </div>
      </div>
    </div>
  );
}
