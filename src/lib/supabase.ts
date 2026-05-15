/**
 * Online multiplayer backend — Firebase Realtime Database
 * Drop-in replacement for the original Supabase implementation.
 * Same exported function names so no other files need changing.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  push,
  type Database,
} from 'firebase/database';

import type { GameSettings, GameState, Room, PlayerSetupConfig } from '@/types/game';

// ─── Firebase init ────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

let db: Database | null = null;

function getDb(): Database | null {
  if (!isConfigured) return null;
  if (db) return db;
  if (typeof window === 'undefined') return null;
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getDatabase(app);
  return db;
}

/** True when Firebase env vars are present. Used by UI to show/hide online features. */
export const isSupabaseEnabled = isConfigured;

// ─── Room code ────────────────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── Data mapper ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToRoom(id: string, data: Record<string, any>): Room {
  return {
    id,
    code:      data.code,
    hostId:    data.hostId,
    status:    data.status,
    gameState: data.gameState ?? null,
    settings:  data.settings,
    players:   data.players ?? [],
  };
}

// ─── createRoom ───────────────────────────────────────────────────────────────

export async function createRoom(
  hostId: string,
  settings: GameSettings,
  playerConfigs: PlayerSetupConfig[],
): Promise<Room | null> {
  const database = getDb();
  if (!database) return null;

  const code = generateRoomCode();
  const newRoomRef = push(ref(database, 'rooms'));

  const roomData = {
    code,
    hostId,
    status: 'waiting',
    gameState: null,
    settings,
    players: playerConfigs.map((cfg, i) => ({
      id:      i === 0 ? hostId : `player-${i}`,
      name:    cfg.name,
      isHost:  i === 0,
      isReady: i === 0,
    })),
  };

  try {
    await set(newRoomRef, roomData);
    await set(ref(database, `roomCodes/${code}`), newRoomRef.key);
    return mapToRoom(newRoomRef.key!, roomData);
  } catch (err) {
    console.error('[firebase] createRoom error:', err);
    return null;
  }
}

// ─── joinRoom ─────────────────────────────────────────────────────────────────

export async function joinRoom(
  code: string,
  playerId: string,
  playerName: string,
): Promise<Room | null> {
  const database = getDb();
  if (!database) return null;

  try {
    const codeSnap = await get(ref(database, `roomCodes/${code.toUpperCase()}`));
    if (!codeSnap.exists()) return null;
    const roomId = codeSnap.val() as string;

    const roomSnap = await get(ref(database, `rooms/${roomId}`));
    if (!roomSnap.exists()) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = roomSnap.val() as Record<string, any>;
    if (data.status !== 'waiting') return null;

    const players = [
      ...(data.players ?? []),
      { id: playerId, name: playerName, isHost: false, isReady: false },
    ];

    await update(ref(database, `rooms/${roomId}`), { players });
    return mapToRoom(roomId, { ...data, players });
  } catch (err) {
    console.error('[firebase] joinRoom error:', err);
    return null;
  }
}

// ─── getRoom ──────────────────────────────────────────────────────────────────

export async function getRoom(roomId: string): Promise<Room | null> {
  const database = getDb();
  if (!database) return null;
  try {
    const snap = await get(ref(database, `rooms/${roomId}`));
    if (!snap.exists()) return null;
    return mapToRoom(roomId, snap.val());
  } catch (err) {
    console.error('[firebase] getRoom error:', err);
    return null;
  }
}

// ─── updateGameState ──────────────────────────────────────────────────────────

export async function updateGameState(
  roomId: string,
  gameState: GameState,
): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await update(ref(database, `rooms/${roomId}`), { gameState, status: 'playing' });
  } catch (err) {
    console.error('[firebase] updateGameState error:', err);
  }
}

// ─── subscribeToRoom ──────────────────────────────────────────────────────────

export function subscribeToRoom(
  roomId: string,
  callback: (room: Room) => void,
): { unsubscribe: () => void } | null {
  const database = getDb();
  if (!database) return null;

  const unsubscribe = onValue(ref(database, `rooms/${roomId}`), (snapshot) => {
    if (snapshot.exists()) {
      callback(mapToRoom(roomId, snapshot.val()));
    }
  });

  return { unsubscribe };
}
