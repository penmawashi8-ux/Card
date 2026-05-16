'use client';

import React, { useState } from 'react';
import type {
  GameSettings,
  PlayerSetupConfig,
  PlayerType,
  CpuDifficulty,
} from '@/types/buta';

interface SetupScreenProps {
  onStart: (settings: GameSettings, players: PlayerSetupConfig[]) => void;
}

const DEFAULT_PLAYERS: PlayerSetupConfig[] = [
  { name: 'You', type: 'human', cpuDifficulty: 'normal' },
  { name: 'CPU 1', type: 'cpu', cpuDifficulty: 'normal' },
  { name: 'CPU 2', type: 'cpu', cpuDifficulty: 'normal' },
];

const DIFFICULTY_LABELS: Record<CpuDifficulty, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
};

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [settings, setSettings] = useState<GameSettings>({
    rounds: 3,
    penaltyOnSameNumber: false,
  });
  const [players, setPlayers] = useState<PlayerSetupConfig[]>(DEFAULT_PLAYERS);

  function addPlayer() {
    if (players.length >= 6) return;
    setPlayers((prev) => [
      ...prev,
      {
        name: `CPU ${prev.filter((p) => p.type === 'cpu').length + 1}`,
        type: 'cpu',
        cpuDifficulty: 'normal',
      },
    ]);
  }

  function removePlayer(index: number) {
    if (players.length <= 3) return;
    setPlayers((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePlayer(
    index: number,
    key: keyof PlayerSetupConfig,
    value: string,
  ) {
    setPlayers((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, [key]: value } : p,
      ),
    );
  }

  function togglePlayerType(index: number) {
    setPlayers((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const newType: PlayerType = p.type === 'human' ? 'cpu' : 'human';
        return {
          ...p,
          type: newType,
          name:
            newType === 'cpu'
              ? `CPU ${prev.filter((pl) => pl.type === 'cpu').length + 1}`
              : 'You',
        };
      }),
    );
  }

  function handleStart() {
    onStart(settings, players);
  }

  const humanCount = players.filter((p) => p.type === 'human').length;

  return (
    <div className="min-h-screen felt-table flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🐷</div>
          <h1 className="text-4xl font-bold text-white mb-1">
            Buta no Shippo
          </h1>
          <p className="text-white/60">豚のしっぽ · Pig&apos;s Tail Card Game</p>
        </div>

        <div className="glass p-6 space-y-6">
          {/* ── Game Settings ──────────────────────────────────────── */}
          <section>
            <h2 className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-3">
              Game Settings
            </h2>

            {/* Rounds */}
            <div className="mb-4">
              <label className="block text-white/60 text-sm mb-2">
                Number of Rounds
              </label>
              <div className="flex gap-2">
                {([1, 3, 5, 10] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, rounds: r }))}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                      settings.rounds === r
                        ? 'bg-yellow-500 text-stone-900 shadow-lg shadow-yellow-500/30'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Same number penalty */}
            <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
              <div>
                <p className="text-white/80 text-sm font-medium">
                  Same Number Penalty
                </p>
                <p className="text-white/40 text-xs mt-0.5">
                  Same number also triggers penalty (harder)
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings((s) => ({
                    ...s,
                    penaltyOnSameNumber: !s.penaltyOnSameNumber,
                  }))
                }
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.penaltyOnSameNumber
                    ? 'bg-yellow-500'
                    : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.penaltyOnSameNumber
                      ? 'translate-x-7'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* ── Players ─────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white/80 font-semibold text-sm uppercase tracking-wider">
                Players ({players.length}/6)
              </h2>
              {players.length < 6 && (
                <button
                  type="button"
                  onClick={addPlayer}
                  className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                >
                  + Add Player
                </button>
              )}
            </div>

            <div className="space-y-2">
              {players.map((player, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2"
                >
                  {/* Type toggle */}
                  <button
                    type="button"
                    onClick={() => togglePlayerType(idx)}
                    className={`text-xs px-2 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                      player.type === 'human'
                        ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30'
                        : 'bg-orange-500/30 text-orange-300 border border-orange-500/30'
                    }`}
                    title="Click to toggle human/CPU"
                  >
                    {player.type === 'human' ? '👤 Human' : '🤖 CPU'}
                  </button>

                  {/* Name input */}
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(idx, 'name', e.target.value)}
                    className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-lg px-3 py-1.5 text-sm border border-white/10 focus:border-yellow-400/50 focus:outline-none"
                    maxLength={20}
                    placeholder="Player name"
                  />

                  {/* CPU difficulty */}
                  {player.type === 'cpu' && (
                    <select
                      value={player.cpuDifficulty}
                      onChange={(e) =>
                        updatePlayer(
                          idx,
                          'cpuDifficulty',
                          e.target.value as CpuDifficulty,
                        )
                      }
                      className="bg-white/10 text-white/80 rounded-lg px-2 py-1.5 text-xs border border-white/10 focus:outline-none"
                    >
                      {(
                        Object.entries(DIFFICULTY_LABELS) as [
                          CpuDifficulty,
                          string,
                        ][]
                      ).map(([val, label]) => (
                        <option key={val} value={val} className="bg-stone-800">
                          {label}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Remove button */}
                  {players.length > 3 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(idx)}
                      className="text-white/30 hover:text-red-400 text-lg leading-none transition-colors"
                      title="Remove player"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {humanCount === 0 && (
              <p className="text-yellow-400/80 text-xs mt-2 text-center">
                Add at least one human player to participate!
              </p>
            )}
          </section>

          {/* ── Start Button ────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleStart}
            disabled={players.length < 3}
            className="btn-primary w-full text-lg py-4"
          >
            Start Game
          </button>
        </div>

        {/* Rules summary */}
        <div className="mt-6 glass p-4 text-white/50 text-xs space-y-1">
          <p className="font-semibold text-white/70 mb-2">Quick Rules</p>
          <p>• 52 cards laid in a circle, face-down (the pig&apos;s tail)</p>
          <p>• On your turn, flip a card from the circle onto the central pile</p>
          <p>• If it matches the top card&apos;s <strong className="text-white/70">suit</strong> → penalty! Take all pile cards</p>
          <p>• Or play a known card from your hand instead (strategic!)</p>
          <p>• Fewest hand cards at the end wins</p>
        </div>
      </div>
    </div>
  );
}
