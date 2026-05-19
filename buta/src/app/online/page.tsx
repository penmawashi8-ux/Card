'use client';

import { useState, useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { GameSettings } from '@/types/game';
import { RoomLobby } from '@/components/RoomLobby';
import { isSupabaseEnabled, createRoom, joinRoom } from '@/lib/supabase';

export default function OnlinePage() {
  const router = useRouter();
  const generatedId = useId();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleCreateRoom(playerName: string, settings: GameSettings, maxPlayers: number) {
    setErrorMsg(null);
    setLoading(true);
    try {
      const hostId = generatedId;
      sessionStorage.setItem('online_player_id', hostId);
      const playerConfig = [{ name: playerName, type: 'human' as const, cpuDifficulty: 'normal' as const }];
      const room = await createRoom(hostId, settings, playerConfig, maxPlayers);
      if (!room) {
        setErrorMsg('ルームの作成に失敗しました。もう一度お試しください。');
        return;
      }
      router.push(`/online/${room.id}`);
    } catch (err) {
      console.error('[OnlinePage] createRoom error:', err);
      setErrorMsg('ルームの作成中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinRoom(code: string, playerName: string) {
    setErrorMsg(null);
    setLoading(true);
    try {
      const playerId = `player-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem('online_player_id', playerId);
      const room = await joinRoom(code, playerId, playerName);
      if (!room) {
        setErrorMsg('ルームが見つかりません。コードを確認してください。');
        return;
      }
      router.push(`/online/${room.id}`);
    } catch (err) {
      console.error('[OnlinePage] joinRoom error:', err);
      setErrorMsg('ルームへの参加中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen felt-table flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-white/60 hover:text-white text-sm mb-6 transition-colors"
        >
          ← ホームへ戻る
        </Link>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-1">オンライン対戦</h1>
          <p className="text-green-300 text-sm">
            ルームコードを共有して友達と遊ぼう
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 bg-red-900/60 border border-red-500/40 rounded-xl px-4 py-3 text-red-300 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="mb-4 bg-black/40 rounded-xl px-4 py-3 text-white/60 text-sm text-center animate-pulse">
            処理中…
          </div>
        )}

        <RoomLobby
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          isSupabaseEnabled={isSupabaseEnabled}
        />
      </div>
    </div>
  );
}
