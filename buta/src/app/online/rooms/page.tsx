'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Room } from '@/types/game';
import { isSupabaseEnabled, subscribeToRoomList, joinRoomById } from '@/lib/supabase';

const RANDOM_PREFIXES = ['ぶた', 'パンダ', 'ネコ', 'キツネ', 'タヌキ', 'クマ', 'ウサギ', 'ライオン'];
function randomName() {
  return `${RANDOM_PREFIXES[Math.floor(Math.random() * RANDOM_PREFIXES.length)]}${Math.floor(1000 + Math.random() * 9000)}`;
}

function relativeTime(ms: number): string {
  const elapsed = Date.now() - ms;
  const mins = Math.floor(elapsed / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  return `${Math.floor(mins / 60)}時間前`;
}

export default function RoomsPage() {
  const router = useRouter();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // The room card currently open for joining
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null);
  const [joinName, setJoinName] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!isSupabaseEnabled) {
      setLoading(false);
      return;
    }
    const sub = subscribeToRoomList((updated) => {
      setRooms(updated);
      setLoading(false);
    });
    return () => { sub?.unsubscribe(); };
  }, []);

  function openRoom(roomId: string) {
    setExpandedRoomId(roomId);
    setJoinName('');
    setJoinPassword('');
    setJoinError(null);
  }

  async function handleJoin(room: Room) {
    setJoinError(null);
    setJoining(true);
    try {
      const name = joinName.trim() || randomName();
      const playerId = `player-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem('online_player_id', playerId);

      const result = await joinRoomById(room.id, playerId, name, joinPassword.trim() || undefined);
      if (!result) {
        setJoinError(room.password ? 'パスワードが違います。' : '参加できませんでした。ルームが満員か終了しています。');
        return;
      }
      router.push(`/online/${result.id}`);
    } catch {
      setJoinError('参加中にエラーが発生しました。');
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen felt-table p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <Link
          href="/online"
          className="inline-flex items-center gap-1 text-white/60 hover:text-white text-sm mb-6 transition-colors"
        >
          ← オンライン対戦へ戻る
        </Link>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-white">野良対戦</h1>
            <p className="text-green-300 text-xs mt-0.5">待機中のルームに参加しよう</p>
          </div>
          {!loading && (
            <div className="flex items-center gap-1.5 text-green-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              リアルタイム更新中
            </div>
          )}
        </div>

        {/* Not configured */}
        {!isSupabaseEnabled && (
          <div className="bg-yellow-900/40 border border-yellow-500/30 rounded-2xl p-6 text-center">
            <p className="text-yellow-300 text-sm">オンライン機能が設定されていません。</p>
          </div>
        )}

        {/* Loading */}
        {isSupabaseEnabled && loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {isSupabaseEnabled && !loading && rooms.length === 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">🎴</div>
            <p className="text-white/60 text-sm mb-1">現在募集中のルームはありません</p>
            <p className="text-white/40 text-xs mb-5">あなたがルームを作って友達を待ちましょう！</p>
            <Link
              href="/online"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-all"
            >
              ルームを作る →
            </Link>
          </div>
        )}

        {/* Room list */}
        {isSupabaseEnabled && !loading && rooms.length > 0 && (
          <div className="space-y-3">
            {rooms.map((room) => {
              const isExpanded = expandedRoomId === room.id;
              const humanCount = room.players.length;
              const maxCount = room.maxPlayers;

              return (
                <div
                  key={room.id}
                  className="bg-white/8 border border-white/15 rounded-2xl overflow-hidden transition-all"
                >
                  {/* Room summary row */}
                  <button
                    type="button"
                    onClick={() => isExpanded ? setExpandedRoomId(null) : openRoom(room.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/5 active:bg-white/10 transition-colors"
                  >
                    {/* Lock icon */}
                    <div className="text-lg shrink-0">
                      {room.isPublic ? '🟢' : '🔒'}
                    </div>

                    {/* Room info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-white font-semibold text-sm truncate">
                          👑 {room.hostName || '名前なし'}
                        </span>
                        {!room.isPublic && (
                          <span className="text-yellow-400/80 text-xs shrink-0">🔒</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-white/45 text-xs flex-wrap">
                        <span>{humanCount}/{maxCount}人</span>
                        <span>·</span>
                        <span>{room.settings.rounds}ラウンド</span>
                        {room.settings.penaltyOnSameNumber && (
                          <>
                            <span>·</span>
                            <span>数字ペナあり</span>
                          </>
                        )}
                        <span>·</span>
                        <span className="font-mono text-white/30">{room.code}</span>
                        <span>·</span>
                        <span>{relativeTime(room.createdAt)}</span>
                      </div>
                    </div>

                    {/* Chevron */}
                    <span
                      className={`text-white/30 text-sm transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      ▾
                    </span>
                  </button>

                  {/* Expanded join form */}
                  {isExpanded && (
                    <div className="border-t border-white/10 px-4 py-4 space-y-3 bg-black/20">
                      {joinError && (
                        <div className="bg-red-900/60 border border-red-500/40 rounded-xl px-3 py-2 text-red-300 text-xs text-center">
                          {joinError}
                        </div>
                      )}

                      <div>
                        <label className="block text-white/55 text-xs mb-1">あなたの名前</label>
                        <input
                          type="text"
                          value={joinName}
                          onChange={(e) => setJoinName(e.target.value)}
                          maxLength={16}
                          placeholder="空白でランダム名"
                          className="w-full bg-white/10 text-white placeholder-white/25 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-yellow-400/60 focus:outline-none"
                        />
                      </div>

                      {!room.isPublic && (
                        <div>
                          <label className="block text-white/55 text-xs mb-1">パスワード</label>
                          <input
                            type="text"
                            value={joinPassword}
                            onChange={(e) => setJoinPassword(e.target.value)}
                            maxLength={20}
                            placeholder="パスワードを入力"
                            className="w-full bg-white/10 text-white placeholder-white/25 rounded-lg px-3 py-2 text-sm border border-white/10 focus:border-yellow-400/60 focus:outline-none"
                          />
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setExpandedRoomId(null)}
                          className="flex-1 py-2 text-white/50 hover:text-white/80 text-sm transition-colors"
                        >
                          キャンセル
                        </button>
                        <button
                          type="button"
                          onClick={() => handleJoin(room)}
                          disabled={joining || (!room.isPublic && !joinPassword.trim())}
                          className="flex-[2] py-2.5 bg-yellow-500 hover:bg-yellow-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-stone-900 font-bold text-sm rounded-xl transition-all"
                        >
                          {joining ? '参加中…' : '参加する'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Code join fallback */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <p className="text-white/35 text-xs mb-3">コードを知っている場合</p>
          <Link
            href="/online"
            className="text-white/50 hover:text-white text-sm underline underline-offset-2 transition-colors"
          >
            ルームコードで参加する
          </Link>
        </div>
      </div>
    </div>
  );
}
