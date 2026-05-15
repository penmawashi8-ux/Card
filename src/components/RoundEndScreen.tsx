'use client';

import React from 'react';
import type { GameState } from '@/types/game';
import { getStandings } from '@/lib/gameLogic';

interface RoundEndScreenProps {
  state: GameState;
  onNextRound: () => void;
}

export default function RoundEndScreen({
  state,
  onNextRound,
}: RoundEndScreenProps) {
  const standings = getStandings(state.players);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass max-w-md w-full p-8 text-center animate-bounce-in">
        <div className="text-5xl mb-3">🐷</div>
        <h2 className="text-2xl font-bold text-yellow-300 mb-1">
          Round {state.currentRound} Complete!
        </h2>
        <p className="text-white/60 text-sm mb-6">
          {state.settings.rounds - state.currentRound} round
          {state.settings.rounds - state.currentRound !== 1 ? 's' : ''} remaining
        </p>

        {/* Standings */}
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <h3 className="text-white/60 text-xs uppercase tracking-wide mb-3">
            Round Standings
          </h3>
          <div className="space-y-2">
            {standings.map((player, rank) => (
              <div
                key={player.id}
                className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                  rank === 0
                    ? 'bg-yellow-500/20 border border-yellow-400/30'
                    : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-sm w-4">
                    {rank === 0 ? '👑' : `${rank + 1}.`}
                  </span>
                  <span
                    className={`font-medium text-sm ${
                      rank === 0 ? 'text-yellow-300' : 'text-white/80'
                    }`}
                  >
                    {player.name}
                  </span>
                  {player.type === 'cpu' && (
                    <span className="text-xs text-white/30">CPU</span>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`font-bold text-sm ${
                      rank === 0 ? 'text-yellow-300' : 'text-white/70'
                    }`}
                  >
                    {player.penaltyCountThisRound}
                  </span>
                  <span className="text-white/40 text-xs ml-1">
                    this round
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onNextRound}
          className="btn-primary w-full text-lg"
        >
          Next Round →
        </button>
      </div>
    </div>
  );
}
