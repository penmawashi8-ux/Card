'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { GameSettings, PlayerSetupConfig } from '@/types/game';
import SetupScreen from '@/components/SetupScreen';

const STORAGE_KEY = 'pageone_game_config';

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
        <SetupScreen onStart={handleStartGame} />
      </div>
    );
  }

  return (
    <div className="min-h-screen felt-table flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-1 tracking-tight">
            ページワン
          </h1>
          <p className="text-green-300 text-sm">
            Page One · トリックテイキングカードゲーム
          </p>
        </div>

        {/* Mode buttons */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => setShowSetup(true)}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 hover:border-white/40 transition-all group"
          >
            <div className="text-left">
              <div className="text-white font-bold text-base group-hover:text-yellow-300 transition-colors">
                CPU対戦
              </div>
              <div className="text-white/50 text-xs">1人でCPUと対戦（3〜4人）</div>
            </div>
            <span className="ml-auto text-white/30 group-hover:text-white/60">›</span>
          </button>

          <Link
            href="/online"
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 hover:border-white/40 transition-all group"
          >
            <div className="text-left">
              <div className="text-white font-bold text-base group-hover:text-yellow-300 transition-colors">
                オンライン対戦
              </div>
              <div className="text-white/50 text-xs">ルームコードで友達と対戦</div>
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
            <span>ルールを見る</span>
            <span className={`transition-transform duration-200 ${rulesOpen ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>

          {rulesOpen && (
            <div className="px-5 pb-4 text-white/55 text-xs space-y-2 border-t border-white/10 pt-3">
              <p className="text-white/75 font-semibold text-sm mb-1">ページワンとは？</p>
              <p>53枚のカード（52枚+ジョーカー）を使うトリックテイキングゲームです。</p>
              <p>各プレイヤーに4枚配り、残りは山札になります。</p>
              <p><strong className="text-white/80">トリック：</strong>親がリードカードを出してスートを決定。他プレイヤーは同スートを出すか、ジョーカーを使います。</p>
              <p>出せない場合は山札から出せるカードを引くまで引き続けます。</p>
              <p><strong className="text-white/80">強さ：</strong>ジョーカー &gt; A &gt; K &gt; Q &gt; J &gt; 10 &gt; … &gt; 2</p>
              <p><strong className="text-white/80">ページワン：</strong>手札が1枚になったら宣言が必要！忘れると5枚ペナルティ。</p>
              <p><strong className="text-white/80">勝利：</strong>最初に手札を0枚にしたプレイヤーがラウンド勝ち。</p>
            </div>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          3〜4人対応 · CPU対戦 · オンライン対応
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
