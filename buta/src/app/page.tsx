'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { GameSettings, PlayerSetupConfig } from '@/types/game';
import { GameSetup } from '@/components/GameSetup';

const STORAGE_KEY = 'buta_game_config';

export default function Home() {
  const router = useRouter();
  const [showSetup, setShowSetup] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  function handleStartGame(settings: GameSettings, players: PlayerSetupConfig[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, players }));
    router.push('/game');
  }

  if (showSetup) {
    return (
      <div className="min-h-screen felt-table flex flex-col items-center justify-center p-4">
        <button
          type="button"
          onClick={() => setShowSetup(false)}
          className="self-start mb-4 text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors"
        >
          ← 戻る
        </button>
        <GameSetup onStart={handleStartGame} />
      </div>
    );
  }

  return (
    <div className="min-h-screen felt-table flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-1 tracking-tight">
            ぶたのしっぽ
          </h1>
          <p className="text-green-300 text-sm">
            Buta no Shippo · Pig&apos;s Tail Card Game
          </p>
        </div>

        {/* Mode buttons */}
        <div className="space-y-3 mb-6">
          {/* CPU battle */}
          <button
            type="button"
            onClick={() => setShowSetup(true)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 hover:border-white/40 transition-all group"
          >
            <div className="text-left">
              <div className="text-white font-bold text-base group-hover:text-yellow-300 transition-colors">
                CPU対戦
              </div>
              <div className="text-white/50 text-xs">
                1人でCPUと対戦（3〜6人）
              </div>
            </div>
            <span className="ml-auto text-white/30 group-hover:text-white/60">›</span>
          </button>

          {/* Online */}
          <Link
            href="/online"
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 hover:border-white/40 transition-all group"
          >
            <div className="text-left">
              <div className="text-white font-bold text-base group-hover:text-yellow-300 transition-colors">
                オンライン対戦
              </div>
              <div className="text-white/50 text-xs">
                友達と対戦・空き枠はCPU自動補完
              </div>
            </div>
            <span className="ml-auto text-white/30 group-hover:text-white/60">›</span>
          </Link>
        </div>

        {/* Rules accordion */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setRulesOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            <span>どんなゲーム？</span>
            <span className={`transition-transform duration-200 ${rulesOpen ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>

          {rulesOpen && (
            <div className="px-5 pb-4 text-white/55 text-xs space-y-2 border-t border-white/10 pt-3">
              <p className="text-white/75 font-semibold text-sm mb-1">ぶたのしっぽとは？</p>
              <p>52枚のカードを輪になるように伏せて並べます（ぶたのしっぽ）。</p>
              <p>自分の番になったら、輪の中の1枚を表向きにして中央の山（台札）に積みます。</p>
              <p>
                <strong className="text-white/80">⚠️ ペナルティ：</strong>
                めくったカードが台札の一番上と<strong className="text-white/80">スートが同じ</strong>なら、台札の全カードをもらって手札に加えます。
              </p>
              <p>手札からカードを出すことも可能です（戦略的に！）。</p>
              <p>
                <strong className="text-white/80">勝利条件：</strong>
                全カードが使われたとき、手札が最も少ないプレイヤーの勝ち！
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          3〜6人対応 · CPU 3難易度 · オンライン対応
        </p>

        <div className="mt-4 text-center">
          <a
            href="https://www.boardgamecat.com"
            className="text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            ← ゲームカタログへ戻る
          </a>
        </div>
      </div>
    </div>
  );
}
