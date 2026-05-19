'use client';

import type { GameState } from '@/types/game';

interface RoundEndScreenProps {
  state: GameState;
  onContinue: () => void;
}

export default function RoundEndScreen({ state, onContinue }: RoundEndScreenProps) {
  const currentRoundScore = state.roundScores[state.roundScores.length - 1];
  const winnerPlayer = state.players.find((p) => p.id === currentRoundScore?.winnerId);
  const isLastRound = state.round >= state.totalRounds;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-bounce-in">
        <h2 className="text-center text-yellow-300 font-black text-2xl mb-1">
          ラウンド {state.round} 終了！
        </h2>
        {winnerPlayer && (
          <p className="text-center text-white font-bold text-lg mb-4">
            {winnerPlayer.name} の勝ち！
          </p>
        )}

        {/* Round scores */}
        <div className="space-y-2 mb-4">
          <h3 className="text-white/60 text-xs uppercase tracking-wide">今ラウンドのスコア</h3>
          {state.players.map((player) => {
            const delta = currentRoundScore?.scores[player.id] ?? 0;
            return (
              <div
                key={player.id}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-lg
                  ${player.id === currentRoundScore?.winnerId
                    ? 'bg-yellow-400/20 border border-yellow-400/40'
                    : 'bg-white/5'}
                `}
              >
                <span className="text-white font-medium">
                  {player.name}
                  {player.type === 'cpu' && (
                    <span className="text-white/40 text-xs ml-1">(CPU)</span>
                  )}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-white/50 text-sm">
                    残り {player.hand.length}枚
                  </span>
                  <span
                    className={`font-bold text-sm min-w-[40px] text-right ${
                      delta > 0
                        ? 'text-green-400'
                        : delta < 0
                        ? 'text-red-400'
                        : 'text-white/50'
                    }`}
                  >
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cumulative scores */}
        <div className="space-y-2 mb-6">
          <h3 className="text-white/60 text-xs uppercase tracking-wide">累計スコア</h3>
          {[...state.players]
            .sort((a, b) => b.score - a.score)
            .map((player, rank) => (
              <div
                key={player.id}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/5"
              >
                <span className="text-white/70 text-sm">
                  <span className="mr-2 text-white/40">{rank + 1}.</span>
                  {player.name}
                </span>
                <span
                  className={`font-bold ${
                    player.score > 0
                      ? 'text-green-400'
                      : player.score < 0
                      ? 'text-red-400'
                      : 'text-white/50'
                  }`}
                >
                  {player.score > 0 ? '+' : ''}{player.score}
                </span>
              </div>
            ))}
        </div>

        <button
          className="w-full btn-primary text-lg py-4 rounded-xl"
          onClick={onContinue}
        >
          {isLastRound ? '最終結果を見る' : `ラウンド ${state.round + 1} へ →`}
        </button>
      </div>
    </div>
  );
}
