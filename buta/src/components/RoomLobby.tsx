'use client';

import { useState } from 'react';
import type { GameSettings } from '@/types/game';

const RANDOM_NAME_PREFIXES = ['ぶた', 'パンダ', 'ネコ', 'キツネ', 'タヌキ', 'クマ', 'ウサギ', 'ライオン'];

function generateRandomName(): string {
  const prefix = RANDOM_NAME_PREFIXES[Math.floor(Math.random() * RANDOM_NAME_PREFIXES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
}

interface RoomLobbyProps {
  onCreateRoom: (playerName: string, settings: GameSettings, maxPlayers: number) => void;
  onJoinRoom: (code: string, playerName: string) => void;
  isSupabaseEnabled: boolean;
}

type Tab = 'create' | 'join';

export function RoomLobby({
  onCreateRoom,
  onJoinRoom,
  isSupabaseEnabled,
}: RoomLobbyProps) {
  const [activeTab, setActiveTab] = useState<Tab>('create');

  // Create room form state
  const [createName, setCreateName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [createSettings, setCreateSettings] = useState<GameSettings>({
    rounds: 3,
    penaltyOnSameNumber: false,
  });

  // Join room form state
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');

  if (!isSupabaseEnabled) {
    return (
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-md mx-auto text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-white font-bold text-lg mb-2">
          オンラインプレイには設定が必要です
        </h3>
        <p className="text-white/60 text-sm mb-4">
          Vercel の環境変数に Firebase の設定を追加してください。
        </p>
        <div className="bg-black/30 rounded-xl p-4 text-left text-xs text-white/50 space-y-2">
          <p className="text-white/70 font-semibold text-sm mb-2">設定手順:</p>
          <p>1. <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">console.firebase.google.com</a> でプロジェクト作成</p>
          <p>2. <strong className="text-white/70">Database と Storage → Realtime Database</strong> を作成（テストモード）</p>
          <p>3. プロジェクト設定 → マイアプリ → Config を選択してキーをコピー</p>
          <p>4. Vercel の <strong className="text-white/70">Environment Variables</strong> に追加:</p>
          <div className="bg-black/40 rounded p-2 mt-1 text-green-400 font-mono text-xs break-all">
            <p>NEXT_PUBLIC_FIREBASE_API_KEY</p>
            <p>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</p>
            <p>NEXT_PUBLIC_FIREBASE_DATABASE_URL</p>
            <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID</p>
            <p>NEXT_PUBLIC_FIREBASE_APP_ID</p>
          </div>
          <p className="mt-2">5. Vercel で Redeploy</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 max-w-md mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 bg-black/30 rounded-xl p-1 mb-5">
        {(['create', 'join'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === tab
                ? 'bg-white/20 text-white shadow'
                : 'text-white/50 hover:text-white/70',
            ].join(' ')}
          >
            {tab === 'create' ? '🏠 ルームを作る' : '🚪 ルームに参加'}
          </button>
        ))}
      </div>

      {/* Create room tab */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-xs mb-1.5">あなたの名前</label>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              maxLength={16}
              placeholder="名前を入力..."
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-yellow-400/60 focus:outline-none"
            />
          </div>

          {/* Max players */}
          <div>
            <label className="block text-white/60 text-xs mb-1.5">
              プレイヤー数（{maxPlayers}人）
              <span className="text-white/40 ml-1">— 足りない枠はCPUが埋めます</span>
            </label>
            <div className="flex gap-2">
              {[3, 4, 5, 6].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMaxPlayers(n)}
                  className={[
                    'flex-1 py-2 rounded-lg font-bold text-sm transition-all',
                    maxPlayers === n
                      ? 'bg-yellow-500 text-stone-900 shadow-lg shadow-yellow-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20',
                  ].join(' ')}
                >
                  {n}人
                </button>
              ))}
            </div>
          </div>

          {/* Rounds */}
          <div>
            <label className="block text-white/60 text-xs mb-1.5">ラウンド数</label>
            <div className="flex gap-2">
              {([1, 3, 5, 10] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() =>
                    setCreateSettings((s) => ({ ...s, rounds: r }))
                  }
                  className={[
                    'flex-1 py-2 rounded-lg font-bold text-sm transition-all',
                    createSettings.rounds === r
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
          <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2.5">
            <div>
              <p className="text-white/80 text-sm">同じ数字もペナルティ</p>
              <p className="text-white/40 text-xs">難しいモード</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setCreateSettings((s) => ({
                  ...s,
                  penaltyOnSameNumber: !s.penaltyOnSameNumber,
                }))
              }
              role="switch"
              aria-checked={createSettings.penaltyOnSameNumber}
              className={[
                'relative w-11 h-6 rounded-full transition-colors shrink-0',
                createSettings.penaltyOnSameNumber ? 'bg-yellow-500' : 'bg-white/20',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                  createSettings.penaltyOnSameNumber ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onCreateRoom(createName.trim() || generateRandomName(), createSettings, maxPlayers)}
            className="w-full py-3 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold rounded-xl transition-all"
          >
            ルームを作成する
          </button>
        </div>
      )}

      {/* Join room tab */}
      {activeTab === 'join' && (
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-xs mb-1.5">ルームコード</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="例: ABC123"
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-yellow-400/60 focus:outline-none font-mono tracking-widest text-center text-lg"
            />
          </div>

          <div>
            <label className="block text-white/60 text-xs mb-1.5">あなたの名前</label>
            <input
              type="text"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              maxLength={16}
              placeholder="名前を入力..."
              className="w-full bg-white/10 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-yellow-400/60 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              joinCode.length >= 4 &&
              onJoinRoom(joinCode, joinName.trim() || generateRandomName())
            }
            disabled={joinCode.length < 4}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
          >
            ルームに参加する
          </button>
        </div>
      )}
    </div>
  );
}
