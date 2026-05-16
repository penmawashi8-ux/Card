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

import type { GameSettings, GameState, Room, RoomPlayer, Player, Card, PlayerSetupConfig } from '@/types/game';

// ─── Firebase array normalization ─────────────────────────────────────────────
// Firebase Realtime Database strips null entries from arrays (treats them as
// deletions), so [card, null, card] becomes {"0":card,"2":card}.  We must
// reconstruct the original sparse array when reading back.

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== 'object') return [];
  const obj = value as Record<string, T>;
  const indices = Object.keys(obj).map(Number).filter((n) => !isNaN(n) && n >= 0);
  if (indices.length === 0) return [];
  const max = Math.max(...indices);
  const result = new Array<T>(max + 1);
  for (const i of indices) result[i] = obj[i];
  return result;
}

function normalizeCircleCards(value: unknown): (Card | null)[] {
  if (Array.isArray(value)) return value as (Card | null)[];
  if (!value || typeof value !== 'object') return new Array(52).fill(null);
  const obj = value as Record<string, Card>;
  const result: (Card | null)[] = new Array(52).fill(null);
  for (const [key, val] of Object.entries(obj)) {
    const i = Number(key);
    if (!isNaN(i) && i >= 0 && i < 52) result[i] = val;
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeGameState(gs: unknown): GameState | null {
  if (!gs || typeof gs !== 'object') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = gs as Record<string, any>;
  const players = toArray<Player>(state.players).map((p) => ({
    ...p,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hand: toArray<Card>((p as Record<string, any>).hand),
  }));
  return {
    ...(state as unknown as GameState),
    players,
    circleCards: normalizeCircleCards(state.circleCards),
    centralPile: toArray<Card>(state.centralPile),
  };
}

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
    code:       data.code,
    hostId:     data.hostId,
    status:     data.status,
    gameState:  normalizeGameState(data.gameState),
    settings:   data.settings,
    players:    toArray<RoomPlayer>(data.players),
    maxPlayers: data.maxPlayers ?? 4,
  };
}

// ─── createRoom ───────────────────────────────────────────────────────────────

export async function createRoom(
  hostId: string,
  settings: GameSettings,
  playerConfigs: PlayerSetupConfig[],
  maxPlayers: number = 4,
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
    maxPlayers,
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
): Promise<{ ok: boolean; errorCode?: string }> {
  const database = getDb();
  if (!database) return { ok: false, errorCode: 'DB_NOT_CONFIGURED' };
  try {
    // Firebase SDK cannot serialize `undefined` values — strip them first.
    const cleanState = JSON.parse(JSON.stringify(gameState)) as GameState;
    await set(ref(database, `rooms/${roomId}/gameState`), cleanState);
    await set(ref(database, `rooms/${roomId}/status`), 'playing');
    return { ok: true };
  } catch (err) {
    const code = (err as { code?: string })?.code;
    const message = (err as Error)?.message ?? String(err);
    console.error('[firebase] updateGameState error:', code, message, err);
    return { ok: false, errorCode: code ?? message.slice(0, 80) };
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
