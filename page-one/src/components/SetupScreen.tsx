'use client';

import { useState } from 'react';
import type { GameSettings, PlayerSetupConfig, PlayerType } from '@/types/game';

interface SetupScreenProps {
  onStart: (settings: GameSettings, players: PlayerSetupConfig[]) => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  rounds: 3,
  playerCount: 3,
  autoPageOne: true,
  banJokerWin: false,
};

const DEFAULT_PLAYERS_3: PlayerSetupConfig[] = [
  { name: 'あなた', type: 'human' },
  { name: 'CPU 1', type: 'cpu' },
  { name: 'CPU 2', type: 'cpu' },
];

const DEFAULT_PLAYERS_4: PlayerSetupConfig[] = [
  { name: 'あなた', type: 'human' },
  { name: 'CPU 1', type: 'cpu' },
  { name: 'CPU 2', type: 'cpu' },
  { name: 'CPU 3', type: 'cpu' },
];

function Toggle({ value, onChange, label, description }: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
      <div>
        <p className="text-white/80 text-sm font-medium">{label}</p>
        {description && <p className="text-white/40 text-xs mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-yellow-500' : 'bg-white/20'}`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [players, setPlayers] = useState<PlayerSetupConfig[]>(DEFAULT_PLAYERS_3);

  function handlePlayerCountChange(count: 3 | 4) {
    setSettings((s) => ({ ...s, playerCount: count }));
    setPlayers(count === 3 ? DEFAULT_PLAYERS_3 : DEFAULT_PLAYERS_4);
  }

  function updatePlayer(index: number, key: keyof PlayerSetupConfig, value: string) {
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [key]: value } : p))
    );
  }

  function handleStart() {
    const validPlayers = players.map((p) => ({
      ...p,
      name: p.name.trim() || `Player ${players.indexOf(p) + 1}`,
    }));
    onStart(settings, validPlayers);
  }

  return (
    <div className="min-h-screen felt-table flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🃏</div>
          <h1 className="text-4xl font-bold text-white mb-1">ページワン</h1>
          <p className="text-white/60">Page One · トリックテイキングゲーム</p>
        </div>

        <div className="glass p-6 space-y-6">
          {/* ── Game Settings ──────────────────────────────────────── */}
          <section>
            <h2 className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-3">
              ゲーム設定
            </h2>

            {/* Rounds */}
            <div className="mb-4">
              <label className="block text-white/60 text-sm mb-2">ラウンド数</label>
              <div className="flex gap-2">
                {([3, 5, 7, 10] as const).map((r) => (
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

            {/* Player count */}
            <div className="mb-4">
              <label className="block text-white/60 text-sm mb-2">プレイヤー数</label>
              <div className="flex gap-2">
                {([3, 4] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handlePlayerCountChange(n)}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${
                      settings.playerCount === n
                        ? 'bg-yellow-500 text-stone-900 shadow-lg shadow-yellow-500/30'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {n}人
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle settings */}
            <div className="space-y-2">
              <Toggle
                value={settings.autoPageOne}
                onChange={(v) => setSettings((s) => ({ ...s, autoPageOne: v }))}
                label="自動ページワン宣言"
                description="ONにすると手札1枚で自動宣言。OFFにすると手動ボタンが必要（忘れると5枚ペナルティ）"
              />
              <Toggle
                value={settings.banJokerWin}
                onChange={(v) => setSettings((s) => ({ ...s, banJokerWin: v }))}
                label="ジョーカー上がり禁止"
                description="最後のカードがジョーカーの場合、上がれない"
              />
            </div>
          </section>

          {/* ── Players ─────────────────────────────────────────────── */}
          <section>
            <h2 className="text-white/80 font-semibold text-sm uppercase tracking-wider mb-3">
              プレイヤー設定
            </h2>
            <div className="space-y-2">
              {players.map((player, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2"
                >
                  <span
                    className={`text-xs px-2 py-1 rounded-lg font-medium whitespace-nowrap ${
                      player.type === 'human'
                        ? 'bg-blue-500/30 text-blue-300 border border-blue-500/30'
                        : 'bg-orange-500/30 text-orange-300 border border-orange-500/30'
                    }`}
                  >
                    {player.type === 'human' ? '👤 人間' : '🤖 CPU'}
                  </span>

                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updatePlayer(idx, 'name', e.target.value)}
                    className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-lg px-3 py-1.5 text-sm border border-white/10 focus:border-yellow-400/50 focus:outline-none"
                    maxLength={20}
                    placeholder="名前"
                    disabled={player.type === 'cpu'}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ── Start Button ────────────────────────────────────────── */}
          <button
            type="button"
            onClick={handleStart}
            className="btn-primary w-full text-lg py-4"
          >
            ゲームスタート
          </button>
        </div>

        {/* Rules summary */}
        <div className="mt-6 glass p-4 text-white/50 text-xs space-y-1">
          <p className="font-semibold text-white/70 mb-2">ルール概要</p>
          <p>• 53枚（52枚 + ジョーカー）を使用</p>
          <p>• 各プレイヤーに4枚配布、残りは山札</p>
          <p>• 親がリードカードを出しスートを決定</p>
          <p>• 他プレイヤーは同スートのカードを出すか、ジョーカーを使用</p>
          <p>• 出せない場合は出せるカードが来るまで山札から引く</p>
          <p>• 最高強度のカードを出したプレイヤーがトリック勝ち</p>
          <p>• 手札1枚になったら「ページワン！」を宣言</p>
          <p>• 最初に手札を0枚にしたプレイヤーがラウンド勝ち</p>
        </div>
      </div>
    </div>
  );
}
