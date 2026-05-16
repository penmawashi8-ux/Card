'use client';

import { useEffect, useState, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { GameState, Room, GameSettings, PlayerSetupConfig } from '@/types/game';
import { initializeGame } from '@/lib/gameLogic';
import { useGame } from '@/hooks/useGame';
import {
  isSupabaseEnabled,
  getRoom,
  subscribeToRoom,
  updateGameState,
} from '@/lib/supabase';
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
  const playerIdRef = useRef<string>('');
  if (!playerIdRef.current) {
    playerIdRef.current =
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('online_player_id')) ||
      `player-${Math.random().toString(36).slice(2, 9)}`;
  }
  const playerId = playerIdRef.current;

  // ── Fetch initial room data ─────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) {
      setError('ルームIDが無効です。');
      setLoading(false);
      return;
    }
    if (!isSupabaseEnabled) {
      setError('オンライン機能が設定されていません。');
      setLoading(false);
      return;
    }

    let subscription: { unsubscribe: () => void } | null = null;

    async function fetchRoom() {
      try {
        const fetchedRoom = await getRoom(roomId!);
        if (!fetchedRoom) {
          setError('ルームが見つかりません。');
          setLoading(false);
          return;
        }
        setRoom(fetchedRoom);
        setLoading(false);

        subscription = subscribeToRoom(roomId!, (updatedRoom) => {
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
      subscription?.unsubscribe();
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
        onStartGame={async (setStartError, setStarting) => {
          setStartError(null);
          setStarting(true);
          try {
            const humanConfigs: PlayerSetupConfig[] = room.players.map((rp) => ({
              name: rp.name,
              type: 'human',
              cpuDifficulty: 'normal',
            }));
            const cpuCount = Math.max(0, room.maxPlayers - room.players.length);
            const cpuConfigs: PlayerSetupConfig[] = Array.from({ length: cpuCount }, (_, i) => ({
              name: `CPU ${i + 1}`,
              type: 'cpu',
              cpuDifficulty: 'normal',
            }));
            const state = initializeGame(room.settings, [...humanConfigs, ...cpuConfigs]);
            const result = await updateGameState(room.id, state);
            if (!result.ok) {
              if (result.errorCode === 'PERMISSION_DENIED') {
                setStartError('Firebaseの書き込み権限がありません。セキュリティルールを確認してください。');
              } else {
                setStartError(`ゲームの開始に失敗しました (${result.errorCode ?? 'unknown'})。`);
              }
            }
          } catch (err) {
            console.error('[WaitingRoom] onStartGame error:', err);
            setStartError('ゲームの開始中にエラーが発生しました。');
          } finally {
            setStarting(false);
          }
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
  onStartGame: (
    setError: Dispatch<SetStateAction<string | null>>,
    setStarting: Dispatch<SetStateAction<boolean>>,
  ) => void;
  onLeave: () => void;
}

function WaitingRoom({ room, playerId, onStartGame, onLeave }: WaitingRoomProps) {
  const isHost = room.players.find((p) => p.id === playerId)?.isHost ?? false;
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

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
        <div className="mb-4">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-2">
            参加者 {room.players.length} / {room.maxPlayers}人
          </p>
          <div className="space-y-1.5">
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
              </div>
            ))}
            {/* CPU placeholder slots */}
            {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
              <div
                key={`cpu-${i}`}
                className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 opacity-50 border border-dashed border-white/20"
              >
                <span className="text-sm">🤖</span>
                <span className="text-white/40 text-sm flex-1">CPU {i + 1}（自動補完）</span>
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

        {startError && (
          <div className="mb-3 bg-red-900/60 border border-red-500/40 rounded-xl px-4 py-2 text-red-300 text-sm text-center">
            {startError}
          </div>
        )}

        <div className="space-y-2">
          {isHost && (
            <button
              onClick={() => onStartGame(setStartError, setIsStarting)}
              disabled={isStarting}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-stone-900 font-bold rounded-xl transition-all"
            >
              {isStarting
                ? '開始中…'
                : `ゲームを開始する (${room.players.length + Math.max(0, room.maxPlayers - room.players.length)}人)`}
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
  const { state, isAnimating, flippingCard, performAction, startNextRound, resetGame } =
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
          flippingCard={flippingCard}
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
