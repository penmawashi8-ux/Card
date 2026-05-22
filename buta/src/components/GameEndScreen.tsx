'use client';

import React from 'react';
import type { GameState } from '@/types/game';
import { getStandings } from '@/lib/gameLogic';

interface GameEndScreenProps {
  state: GameState;
  humanPlayerIndex: number;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export default function GameEndScreen({
  state,
  humanPlayerIndex,
  onPlayAgain,
  onReturnToMenu,
}: GameEndScreenProps) {
  const standings = getStandings(state.players);
  const winner = standings[0];
  const viewingPlayer = state.players[humanPlayerIndex];
  const isViewerWinner = viewingPlayer?.id === winner.id;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass max-w-lg w-full p-8 text-center animate-bounce-in">
        <h2 className="text-3xl font-bold text-yellow-300 mb-2">
          {isViewerWinner ? 'You Win!' : `${winner.name} Wins!`}
        </h2>
        <p className="text-white/60 mb-2">
          {isViewerWinner
            ? 'Congratulations! You have the fewest penalty cards.'
            : `${winner.name} squealed to victory!`}
        </p>
        <p className="text-white/40 text-sm mb-8">
          Game complete after {state.settings.rounds} round
          {state.settings.rounds !== 1 ? 's' : ''}
        </p>

        {/* Final standings */}
        <div className="bg-black/40 rounded-xl p-4 mb-8">
          <h3 className="text-white/60 text-xs uppercase tracking-wide mb-4">
            Final Standings
          </h3>
          <div className="space-y-2">
            {standings.map((player, rank) => {
              const medal = `${rank + 1}.`;
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
                        {player.type === 'cpu'
                          ? `CPU · ${player.cpuDifficulty ?? 'normal'}`
                          : 'Human'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        rank === 0 ? 'text-yellow-300' : 'text-white/70'
                      }`}
                    >
                      {player.totalPenaltyCount}
                    </p>
                    <p className="text-white/40 text-xs">penalty cards</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button onClick={onPlayAgain} className="btn-primary w-full text-base">
            Play Again
          </button>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={onReturnToMenu} className="btn-secondary flex-1 text-base">
              ゲームトップへ
            </button>
            <a
              href="https://www.boardgamecat.com"
              className="btn-secondary flex-1 text-base text-center"
            >
              トップに戻る
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
