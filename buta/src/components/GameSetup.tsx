'use client';

import { useState } from 'react';
import type {
  GameSettings,
  PlayerSetupConfig,
  PlayerType,
  CpuDifficulty,
} from '@/types/game';

interface GameSetupProps {
  onStart: (settings: GameSettings, players: PlayerSetupConfig[]) => void;
}

const DIFFICULTY_LABELS: Record<CpuDifficulty, string> = {
  easy: '弱い',
  normal: '普通',
  hard: '強い',
};

function buildDefaultPlayers(count: number): PlayerSetupConfig[] {
  const configs: PlayerSetupConfig[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      configs.push({ name: 'あなた', type: 'human', cpuDifficulty: 'normal' });
    } else {
      configs.push({ name: `CPU ${i}`, type: 'cpu', cpuDifficulty: 'normal' });
    }
  }
  return configs;
}

export function GameSetup({ onStart }: GameSetupProps) {
  const [totalPlayers, setTotalPlayers] = useState(3);
  const [playerConfigs, setPlayerConfigs] = useState<PlayerSetupConfig[]>(
    buildDefaultPlayers(3),
  );
  const [settings, setSettings] = useState<GameSettings>({
    rounds: 3,
    penaltyOnSameNumber: false,
  });

  function handleTotalPlayersChange(count: number) {
    setTotalPlayers(count);
    setPlayerConfigs((prev) => {
      if (count > prev.length) {
        const extras: PlayerSetupConfig[] = [];
        for (let i = prev.length; i < count; i++) {
          const cpuNum = prev.filter((p) => p.type === 'cpu').length + extras.filter((p) => p.type === 'cpu').length + 1;
          extras.push({ name: `CPU ${cpuNum}`, type: 'cpu', cpuDifficulty: 'normal' });
        }
        return [...prev, ...extras];
      }
      return prev.slice(0, count);
    });
  }

  function updatePlayer(
    index: number,
    updates: Partial<PlayerSetupConfig>,
  ) {
    setPlayerConfigs((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...updates } : p)),
    );
  }

  function togglePlayerType(index: number) {
    setPlayerConfigs((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const newType: PlayerType = p.type === 'human' ? 'cpu' : 'human';
        const cpuCount = prev.filter((pl, pi) => pi !== index && pl.type === 'cpu').length + 1;
        return {
          ...p,
          type: newType,
          name: newType === 'cpu' ? `CPU ${cpuCount}` : `プレイヤー ${index + 1}`,
        };
      }),
    );
  }

  function handleStart() {
    const valid = playerConfigs.every((p) => p.name.trim().length > 0);
    if (!valid) return;
    onStart(settings, playerConfigs);
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">ぶたのしっぽ 設定</h2>
        <p className="text-green-300 text-sm">3〜6人でプレイできます</p>
      </div>

      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 space-y-5">

        {/* ── Player count ──────────────────────────────────────────── */}
        <section>
          <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
            プレイヤー人数
          </h3>
          <div className="flex gap-2">
            {[3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleTotalPlayersChange(n)}
                className={[
                  'flex-1 py-2.5 rounded-xl font-bold text-sm transition-all',
                  totalPlayers === n
                    ? 'bg-yellow-500 text-stone-900 shadow-lg shadow-yellow-500/30'
                    : 'bg-white/10 text-white/70 hover:bg-white/20',
                ].join(' ')}
              >
                {n}人
              </button>
            ))}
          </div>
        </section>

        {/* ── Player configs ────────────────────────────────────────── */}
        <section>
          <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
            プレイヤー設定
          </h3>
          <div className="space-y-2">
            {playerConfigs.map((player, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2"
              >
                {/* Slot number */}
                <span className="text-white/40 text-xs w-5 shrink-0 text-center font-mono">
                  {idx + 1}
                </span>

                {/* Type toggle (players 2+ can be toggled; player 1 is always human) */}
                <button
                  type="button"
                  onClick={() => idx > 0 && togglePlayerType(idx)}
                  disabled={idx === 0}
                  title={idx === 0 ? 'あなたは人間です' : 'クリックして切り替え'}
                  className={[
                    'text-xs px-2 py-1 rounded-lg font-medium transition-all whitespace-nowrap shrink-0',
                    idx === 0
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30 cursor-default'
                      : player.type === 'human'
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30 hover:bg-blue-500/50'
                      : 'bg-orange-500/30 text-orange-300 border border-orange-500/30 hover:bg-orange-500/50',
                  ].join(' ')}
                >
                  {player.type === 'human' ? '👤 人間' : '🤖 CPU'}
                </button>

                {/* Name input */}
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updatePlayer(idx, { name: e.target.value })}
                  maxLength={16}
                  placeholder="名前"
                  className="flex-1 min-w-0 bg-white/10 text-white placeholder-white/30 rounded-lg px-2 py-1.5 text-sm border border-white/10 focus:border-yellow-400/60 focus:outline-none"
                />

                {/* CPU difficulty */}
                {player.type === 'cpu' && (
                  <select
                    value={player.cpuDifficulty}
                    onChange={(e) =>
                      updatePlayer(idx, {
                        cpuDifficulty: e.target.value as CpuDifficulty,
                      })
                    }
                    className="bg-white/10 text-white/80 rounded-lg px-2 py-1.5 text-xs border border-white/10 focus:outline-none shrink-0"
                  >
                    {(Object.entries(DIFFICULTY_LABELS) as [CpuDifficulty, string][]).map(
                      ([val, label]) => (
                        <option key={val} value={val} className="bg-stone-800">
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Game settings ─────────────────────────────────────────── */}
        <section>
          <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">
            ゲーム設定
          </h3>

          {/* Rounds */}
          <div className="mb-3">
            <label className="block text-white/60 text-xs mb-2">ラウンド数</label>
            <div className="flex gap-2">
              {([1, 3, 5, 10] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, rounds: r }))}
                  className={[
                    'flex-1 py-2 rounded-lg font-bold text-sm transition-all',
                    settings.rounds === r
                      ? 'bg-yellow-500 text-stone-900 shadow-lg shadow-yellow-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20',
                  ].join(' ')}
                >
                  {r}回
                </button>
              ))}
            </div>
          </div>

          {/* Penalty on same number */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
            <div>
              <p className="text-white/80 text-sm font-medium">同じ数字もペナルティ</p>
              <p className="text-white/40 text-xs mt-0.5">スートに加え、数字が同じでもペナルティ（難しい）</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings((s) => ({
                  ...s,
                  penaltyOnSameNumber: !s.penaltyOnSameNumber,
                }))
              }
              className={[
                'relative w-11 h-6 rounded-full transition-colors shrink-0',
                settings.penaltyOnSameNumber ? 'bg-yellow-500' : 'bg-white/20',
              ].join(' ')}
              aria-checked={settings.penaltyOnSameNumber}
              role="switch"
            >
              <span
                className={[
                  'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                  settings.penaltyOnSameNumber ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
          </div>
        </section>

        {/* ── Start button ──────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleStart}
          disabled={playerConfigs.some((p) => !p.name.trim())}
          className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-stone-900 font-bold text-lg rounded-xl transition-all shadow-lg shadow-yellow-500/30"
        >
          ゲーム開始
        </button>
      </div>
    </div>
  );
}
