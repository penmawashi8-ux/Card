'use client';

import type { GameState } from '@/types/game';
import { getStandings } from '@/lib/gameLogic';

interface GameEndScreenProps {
  state: GameState;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export default function GameEndScreen({
  state,
  onPlayAgain,
  onReturnToMenu,
}: GameEndScreenProps) {
  const standings = getStandings(state.players);
  const winner = standings[0];
  const isWinnerHuman = winner.type === 'human';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass max-w-lg w-full p-8 text-center animate-bounce-in">
        {/* Trophy emoji */}
        <div className="text-6xl mb-4">
          {isWinnerHuman ? '🏆' : '🎴'}
        </div>

        <h2 className="text-3xl font-bold text-yellow-300 mb-2">
          {isWinnerHuman ? 'あなたの勝ち！' : `${winner.name} の勝ち！`}
        </h2>
        <p className="text-white/60 mb-2">
          {isWinnerHuman
            ? 'おめでとうございます！'
            : `${winner.name} がゲームを制しました！`}
        </p>
        <p className="text-white/40 text-sm mb-8">
          {state.totalRounds} ラウンド終了
        </p>

        {/* Final standings */}
        <div className="bg-black/40 rounded-xl p-4 mb-8">
          <h3 className="text-white/60 text-xs uppercase tracking-wide mb-4">
            最終順位
          </h3>
          <div className="space-y-2">
            {standings.map((player, rank) => {
              const medals = ['🥇', '🥈', '🥉', '4️⃣'];
              const medal = medals[rank] ?? `${rank + 1}.`;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    rank === 0
                      ? 'bg-yellow-500/25 border border-yellow-400/40 scale-[1.02]'
                      : rank === 1
                      ? 'bg-white/10'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{medal}</span>
                    <div className="text-left">
                      <p
                        className={`font-semibold ${
                          rank === 0 ? 'text-yellow-300' : 'text-white/80'
                        }`}
                      >
                        {player.name}
                      </p>
                      <p className="text-white/40 text-xs">
                        {player.type === 'cpu' ? 'CPU' : '人間'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        rank === 0
                          ? 'text-yellow-300'
                          : player.score >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {player.score > 0 ? '+' : ''}{player.score}
                    </p>
                    <p className="text-white/40 text-xs">累計スコア</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={onPlayAgain} className="btn-primary flex-1 text-base">
            もう一度プレイ
          </button>
          <button onClick={onReturnToMenu} className="btn-secondary flex-1 text-base">
            メニューへ
          </button>
        </div>
      </div>
    </div>
  );
}
