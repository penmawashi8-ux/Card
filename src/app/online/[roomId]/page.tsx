'use client';

import { useEffect, useState, useCallback, useId } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { GameState, Room, GameSettings, PlayerSetupConfig } from '@/types/game';
import { initializeGame } from '@/lib/gameLogic';
import { useGame } from '@/hooks/useGame';
import {
  supabase,
  isSupabaseEnabled,
  subscribeToRoom,
  updateGameState,
} from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import GameBoard from '@/components/GameBoard';
import RoundEndScreen from '@/components/RoundEndScreen';
import GameEndScreen from '@/components/GameEndScreen';
import SoundToggle from '@/components/SoundToggle';

// ─── Page component ───────────────────────────────────────────────────────────

export default function OnlineRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.roomId as string | undefined;

  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const playerId = useId();

  // ── Fetch initial room data ─────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) {
      setError('ルームIDが無効です。');
      setLoading(false);
      return;
    }
    if (!isSupabaseEnabled || !supabase) {
      setError('オンライン機能が設定されていません。');
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel | null = null;

    async function fetchRoom() {
      try {
        const { data, error: fetchErr } = await supabase!
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (fetchErr || !data) {
          setError('ルームが見つかりません。');
          setLoading(false);
          return;
        }

        const mappedRoom: Room = {
          id: data.id,
          code: data.code,
          hostId: data.host_id,
          status: data.status,
          gameState: data.game_state ?? null,
          settings: data.settings,
          players: data.players ?? [],
        };
        setRoom(mappedRoom);
        setLoading(false);

        // Subscribe to realtime updates
        channel = subscribeToRoom(roomId!, (updatedRoom) => {
          setRoom(updatedRoom);
        });
      } catch (err) {
        console.error('[OnlineRoomPage] fetchRoom error:', err);
        setError('ルームの読み込みに失敗しました。');
        setLoading(false);
      }
    }

    fetchRoom();

    return () => {
      channel?.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen felt-table flex items-center justify-center">
        <div className="text-white/60 text-lg animate-pulse">読み込み中…</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen felt-table flex items-center justify-center p-4">
        <div className="glass p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-white/80 mb-6">{error ?? 'ルームが見つかりません。'}</p>
          <button
            onClick={() => router.push('/online')}
            className="btn-primary w-full"
          >
            ロビーへ戻る
          </button>
        </div>
      </div>
    );
  }

  // ── Waiting lobby (game not started yet) ───────────────────────────────
  if (!room.gameState || room.status === 'waiting') {
    return (
      <WaitingRoom
        room={room}
        playerId={playerId}
        onStartGame={async () => {
          if (!supabase) return;
          // Host starts the game: initialise state and persist it
          const playerConfigs: PlayerSetupConfig[] = room.players.map((rp) => ({
            name: rp.name,
            type: 'human',
            cpuDifficulty: 'normal',
          }));
          const state = initializeGame(room.settings, playerConfigs);
          await updateGameState(room.id, state);
        }}
        onLeave={() => router.push('/online')}
      />
    );
  }

  // ── Active game ────────────────────────────────────────────────────────
  const myRoomPlayer = room.players.find((rp) => rp.id === playerId);
  const playerIndex = myRoomPlayer
    ? room.players.indexOf(myRoomPlayer)
    : 0;

  return (
    <ActiveOnlineGame
      initialState={room.gameState}
      humanPlayerIndex={playerIndex}
      playerId={playerId}
      roomId={room.id}
      onReturnToLobby={() => router.push('/online')}
    />
  );
}

// ─── Waiting room lobby ───────────────────────────────────────────────────────

interface WaitingRoomProps {
  room: Room;
  playerId: string;
  onStartGame: () => void;
  onLeave: () => void;
}

function WaitingRoom({ room, playerId, onStartGame, onLeave }: WaitingRoomProps) {
  const isHost = room.players.find((p) => p.id === playerId)?.isHost ?? false;

  return (
    <div className="min-h-screen felt-table flex flex-col items-center justify-center p-4">
      <div className="glass p-6 max-w-sm w-full">
        {/* Room code */}
        <div className="text-center mb-6">
          <p className="text-white/50 text-xs mb-1">ルームコード</p>
          <div className="text-4xl font-mono font-bold text-yellow-400 tracking-widest">
            {room.code}
          </div>
          <p className="text-white/40 text-xs mt-1">友達にこのコードを共有してください</p>
        </div>

        {/* Players list */}
        <div className="mb-6">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-2">
            参加者 ({room.players.length}人)
          </p>
          <div className="space-y-2">
            {room.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"
              >
                <span className="text-sm">{p.isHost ? '👑' : '👤'}</span>
                <span className="text-white/80 text-sm flex-1">{p.name}</span>
                {p.id === playerId && (
                  <span className="text-xs text-green-400">あなた</span>
                )}
                <span
                  className={`w-2 h-2 rounded-full ${
                    p.isReady ? 'bg-green-400' : 'bg-gray-500'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Settings summary */}
        <div className="bg-black/20 rounded-xl px-4 py-3 mb-6 text-xs text-white/50 space-y-1">
          <p>ラウンド数: <span className="text-white/70">{room.settings.rounds}回</span></p>
          <p>
            同数字ペナルティ:{' '}
            <span className="text-white/70">
              {room.settings.penaltyOnSameNumber ? 'あり' : 'なし'}
            </span>
          </p>
        </div>

        <div className="space-y-2">
          {isHost && (
            <button
              onClick={onStartGame}
              disabled={room.players.length < 2}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-stone-900 font-bold rounded-xl transition-all"
            >
              ゲームを開始する ({room.players.length}人)
            </button>
          )}
          {!isHost && (
            <p className="text-center text-white/40 text-sm py-2 animate-pulse">
              ホストがゲームを開始するのを待っています…
            </p>
          )}
          <button
            onClick={onLeave}
            className="w-full py-2 text-white/40 hover:text-white/70 text-sm transition-colors"
          >
            退出する
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Active online game ───────────────────────────────────────────────────────

interface ActiveOnlineGameProps {
  initialState: GameState;
  humanPlayerIndex: number;
  playerId: string;
  roomId: string;
  onReturnToLobby: () => void;
}

function ActiveOnlineGame({
  initialState,
  humanPlayerIndex,
  playerId,
  roomId,
  onReturnToLobby,
}: ActiveOnlineGameProps) {
  const { state, isAnimating, performAction, startNextRound, resetGame } =
    useGame(initialState, { playerId, roomId });

  const handleFlipCircleCard = useCallback(
    (index: number) => performAction('circle', index),
    [performAction],
  );

  const handlePlayFromHand = useCallback(
    (cardId: string) => performAction('hand', undefined, cardId),
    [performAction],
  );

  return (
    <div className="min-h-screen felt-table relative">
      {/* Top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>🐷</span>
          <span className="text-white font-bold text-lg hidden sm:block">
            ぶたのしっぽ
          </span>
          <span className="text-green-400 text-xs bg-green-900/60 px-2 py-0.5 rounded-full">
            オンライン
          </span>
          <span className="text-white/50 text-sm">
            ラウンド{' '}
            <span className="text-yellow-300 font-bold">{state.currentRound}</span>
            {' '}/{' '}{state.settings.rounds}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <SoundToggle />
          <button
            type="button"
            onClick={onReturnToLobby}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            退出
          </button>
        </div>
      </div>

      <main>
        <GameBoard
          state={state}
          humanPlayerIndex={humanPlayerIndex}
          onFlipCircleCard={handleFlipCircleCard}
          onPlayFromHand={handlePlayFromHand}
          isAnimating={isAnimating}
        />
      </main>

      {state.phase === 'round_end' && (
        <RoundEndScreen state={state} onNextRound={startNextRound} />
      )}

      {state.phase === 'game_end' && (
        <GameEndScreen
          state={state}
          onPlayAgain={resetGame}
          onReturnToMenu={onReturnToLobby}
        />
      )}
    </div>
  );
}
