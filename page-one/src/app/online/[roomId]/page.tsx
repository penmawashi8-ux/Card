'use client';

import { useEffect, useState, useId } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { GameState, Room, PlayerSetupConfig } from '@/types/game';
import { initializeGame } from '@/lib/gameLogic';
import { useGame } from '@/hooks/useGame';
import {
  isFirebaseEnabled,
  getRoom,
  subscribeToRoom,
  updateGameState,
  finishRoom,
} from '@/lib/firebase';
import GameBoard from '@/components/GameBoard';
import RoundEndScreen from '@/components/RoundEndScreen';
import GameEndScreen from '@/components/GameEndScreen';
import type { Suit } from '@/types/game';

export default function OnlineRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.roomId as string | undefined;

  const [room, setRoom] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fallbackId = useId();
  const [playerId] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('pageone_my_player_id') || fallbackId;
    }
    return fallbackId;
  });

  useEffect(() => {
    if (!roomId) {
      setError('ルームIDが無効です。');
      setLoading(false);
      return;
    }
    if (!isFirebaseEnabled) {
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
    return () => { subscription?.unsubscribe(); };
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
          <button onClick={() => router.push('/online')} className="btn-primary w-full">
            ロビーへ戻る
          </button>
        </div>
      </div>
    );
  }

  if (!room.gameState || room.status === 'waiting') {
    return (
      <WaitingRoom
        room={room}
        playerId={playerId}
        onStartGame={async () => {
          // Pad with CPU players up to the setting's playerCount
          const humanPlayers: PlayerSetupConfig[] = room.players.map((rp) => ({
            name: rp.name,
            type: 'human' as const,
          }));
          const needed = room.settings.playerCount - humanPlayers.length;
          const cpuPlayers: PlayerSetupConfig[] = Array.from({ length: Math.max(0, needed) }, (_, i) => ({
            name: `CPU ${i + 1}`,
            type: 'cpu' as const,
          }));
          const allPlayers = [...humanPlayers, ...cpuPlayers];
          // Ensure at least 3 players
          while (allPlayers.length < 3) {
            allPlayers.push({ name: `CPU ${allPlayers.length}`, type: 'cpu' });
          }
          const state = initializeGame(room.settings, allPlayers.slice(0, room.settings.playerCount));
          await updateGameState(room.id, state);
        }}
        onLeave={() => router.push('/online')}
      />
    );
  }

  const myRoomPlayer = room.players.find((rp) => rp.id === playerId);
  const playerIndex = myRoomPlayer ? room.players.indexOf(myRoomPlayer) : 0;

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

// ─── Waiting room ─────────────────────────────────────────────────────────────

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
        <div className="text-center mb-6">
          <p className="text-white/50 text-xs mb-1">ルームコード</p>
          <div className="text-4xl font-mono font-bold text-yellow-400 tracking-widest">
            {room.code}
          </div>
          <p className="text-white/40 text-xs mt-1">友達にこのコードを共有してください</p>
        </div>

        <div className="mb-6">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-2">
            参加者 ({room.players.length}/{room.settings.playerCount}人)
          </p>
          <div className="space-y-2">
            {room.players.map((p) => (
              <div key={p.id} className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                <span className="text-sm">{p.isHost ? '👑' : '👤'}</span>
                <span className="text-white/80 text-sm flex-1">{p.name}</span>
                {p.id === playerId && <span className="text-xs text-green-400">あなた</span>}
              </div>
            ))}
            {room.players.length < room.settings.playerCount && (
              <div className="text-white/30 text-xs text-center py-2 animate-pulse">
                あと{room.settings.playerCount - room.players.length}人待っています… (CPUが補填されます)
              </div>
            )}
          </div>
        </div>

        <div className="bg-black/20 rounded-xl px-4 py-3 mb-6 text-xs text-white/50 space-y-1">
          <p>ラウンド数: <span className="text-white/70">{room.settings.rounds}回</span></p>
          <p>プレイヤー数: <span className="text-white/70">{room.settings.playerCount}人</span></p>
          <p>自動ページワン: <span className="text-white/70">{room.settings.autoPageOne ? 'あり' : 'なし'}</span></p>
          <p>ジョーカー上がり禁止: <span className="text-white/70">{room.settings.banJokerWin ? 'あり' : 'なし'}</span></p>
        </div>

        <div className="space-y-2">
          {isHost ? (
            <button
              onClick={onStartGame}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-stone-900 font-bold rounded-xl transition-all"
            >
              ゲームを開始する
            </button>
          ) : (
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
  const {
    state,
    onPlayCard,
    onDeclareJokerSuit,
    onDeclarePageOne,
    onContinueAfterRound,
    onResetGame,
  } = useGame(initialState, { playerId, roomId });

  // Mark room as finished when game ends so it disappears from the room list
  useEffect(() => {
    if (state.phase === 'game_end') {
      finishRoom(roomId).catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  return (
    <div className="min-h-screen felt-table relative">
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg hidden sm:block">ページワン</span>
          <span className="text-green-400 text-xs bg-green-900/60 px-2 py-0.5 rounded-full">
            オンライン
          </span>
        </div>
        <button
          type="button"
          onClick={onReturnToLobby}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          退出
        </button>
      </div>

      <main>
        <GameBoard
          state={state}
          humanPlayerIndex={humanPlayerIndex}
          onPlayCard={onPlayCard}
          onDeclareJokerSuit={onDeclareJokerSuit}
          onDeclarePageOne={onDeclarePageOne}
          isOnline={true}
          myPlayerId={playerId}
        />
      </main>

      {state.phase === 'round_end' && (
        <RoundEndScreen state={state} onContinue={onContinueAfterRound} />
      )}

      {state.phase === 'game_end' && (
        <GameEndScreen
          state={state}
          onPlayAgain={onResetGame}
          onReturnToMenu={onReturnToLobby}
        />
      )}
    </div>
  );
}
