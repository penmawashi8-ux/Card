/**
 * Online multiplayer backend — Firebase Realtime Database
 * Page One game backend.
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
  query,
  orderByChild,
  equalTo,
  type Database,
} from 'firebase/database';

import type { GameSettings, GameState, Room, OnlinePlayer, PlayerSetupConfig } from '@/types/game';

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

const _dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '';
const isConfigured = _dbUrl.startsWith('https://') && _dbUrl.includes('firebaseio');

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
export const isFirebaseEnabled = isConfigured;

// Keep legacy export for compatibility
export const isSupabaseEnabled = isConfigured;

// ─── Room code ────────────────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── Array normalization ──────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return Object.values(v);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeGameState(gs: any): any {
  if (!gs) return gs;
  return {
    ...gs,
    drawPile:    toArray(gs.drawPile),
    discardPile: toArray(gs.discardPile),
    roundScores: toArray(gs.roundScores),
    players: toArray(gs.players).map((p: any) => ({
      ...p,
      hand: toArray(p.hand),
    })),
    currentTrick: gs.currentTrick ? {
      ...gs.currentTrick,
      cards: toArray(gs.currentTrick.cards),
    } : { leadSuit: null, declaredSuit: null, cards: [], winnerId: null },
  };
}

// ─── Data mapper ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToRoom(id: string, data: Record<string, any>): Room {
  const players: OnlinePlayer[] = Array.isArray(data.players)
    ? data.players
    : Object.values(data.players ?? {});
  return {
    id,
    code:      data.code,
    hostId:    data.hostId,
    status:    data.status,
    gameState: data.gameState ? normalizeGameState(data.gameState) : null,
    settings:  data.settings,
    players,
    password:  data.password ?? null,
    isPublic:  data.isPublic ?? true,
    // Fall back to first player's name for rooms created before hostName was added
    hostName:  data.hostName || players[0]?.name || '',
    createdAt: data.createdAt ?? 0,
  };
}

// ─── createRoom ───────────────────────────────────────────────────────────────

export async function createRoom(
  hostId: string,
  settings: GameSettings,
  playerConfigs: PlayerSetupConfig[],
  password?: string,
): Promise<Room | null> {
  const database = getDb();
  if (!database) return null;

  const code = generateRoomCode();
  const newRoomRef = push(ref(database, 'pageone/rooms'));
  const hostName = playerConfigs[0]?.name ?? '';

  const roomData = {
    code,
    hostId,
    status: 'waiting',
    gameState: null,
    settings,
    password:  password || null,
    isPublic:  !password,
    hostName,
    createdAt: Date.now(),
    players: playerConfigs.map((cfg, i) => ({
      id:      i === 0 ? hostId : `player-${i}`,
      name:    cfg.name,
      isHost:  i === 0,
      isReady: i === 0,
    })),
  };

  await set(newRoomRef, roomData);
  await set(ref(database, `pageone/roomCodes/${code}`), newRoomRef.key);
  return mapToRoom(newRoomRef.key!, roomData);
}

// ─── joinRoom (by room code) ──────────────────────────────────────────────────

export async function joinRoom(
  code: string,
  playerId: string,
  playerName: string,
  password?: string,
): Promise<Room | null> {
  const database = getDb();
  if (!database) return null;

  const codeSnap = await get(ref(database, `pageone/roomCodes/${code.toUpperCase()}`));
  if (!codeSnap.exists()) return null;
  const roomId = codeSnap.val() as string;

  const roomSnap = await get(ref(database, `pageone/rooms/${roomId}`));
  if (!roomSnap.exists()) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = roomSnap.val() as Record<string, any>;
  if (data.status !== 'waiting') return null;
  if (data.password && data.password !== password) return null;

  const players = [
    ...(Array.isArray(data.players) ? data.players : Object.values(data.players ?? {})),
    { id: playerId, name: playerName, isHost: false, isReady: false },
  ];

  await update(ref(database, `pageone/rooms/${roomId}`), { players });
  return mapToRoom(roomId, { ...data, players });
}

// ─── joinRoomById (from room list) ────────────────────────────────────────────

export async function joinRoomById(
  roomId: string,
  playerId: string,
  playerName: string,
  password?: string,
): Promise<Room | null> {
  const database = getDb();
  if (!database) return null;

  try {
    const roomSnap = await get(ref(database, `pageone/rooms/${roomId}`));
    if (!roomSnap.exists()) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = roomSnap.val() as Record<string, any>;
    if (data.status !== 'waiting') return null;
    if (data.password && data.password !== password) return null;

    const existingPlayers: OnlinePlayer[] = Array.isArray(data.players)
      ? data.players
      : Object.values(data.players ?? {});
    if (existingPlayers.length >= (data.settings?.playerCount ?? 4)) return null;

    const players = [
      ...existingPlayers,
      { id: playerId, name: playerName, isHost: false, isReady: false },
    ];

    await update(ref(database, `pageone/rooms/${roomId}`), { players });
    return mapToRoom(roomId, { ...data, players });
  } catch (err) {
    console.error('[firebase] joinRoomById error:', err);
    return null;
  }
}

// ─── getRoom ──────────────────────────────────────────────────────────────────

export async function getRoom(roomId: string): Promise<Room | null> {
  const database = getDb();
  if (!database) return null;
  try {
    const snap = await get(ref(database, `pageone/rooms/${roomId}`));
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
    await update(ref(database, `pageone/rooms/${roomId}`), { gameState, status: 'playing' });
  } catch (err) {
    console.error('[firebase] updateGameState error:', err);
  }
}

// ─── finishRoom ───────────────────────────────────────────────────────────────

export async function finishRoom(roomId: string): Promise<void> {
  const database = getDb();
  if (!database) return;
  try {
    await update(ref(database, `pageone/rooms/${roomId}`), { status: 'finished' });
  } catch (err) {
    console.error('[firebase] finishRoom error:', err);
  }
}

// ─── subscribeToRoom ──────────────────────────────────────────────────────────

export function subscribeToRoom(
  roomId: string,
  callback: (room: Room) => void,
): { unsubscribe: () => void } | null {
  const database = getDb();
  if (!database) return null;

  const unsubscribe = onValue(ref(database, `pageone/rooms/${roomId}`), (snapshot) => {
    if (snapshot.exists()) {
      callback(mapToRoom(roomId, snapshot.val()));
    }
  });

  return { unsubscribe };
}

// ─── subscribeToRoomList ──────────────────────────────────────────────────────

export function subscribeToRoomList(
  callback: (rooms: Room[]) => void,
): { unsubscribe: () => void } | null {
  const database = getDb();
  if (!database) return null;

  const waitingQuery = query(
    ref(database, 'pageone/rooms'),
    orderByChild('status'),
    equalTo('waiting'),
  );

  const THREE_HOURS = 3 * 60 * 60 * 1000;

  const unsubscribe = onValue(waitingQuery, (snapshot) => {
    const rooms: Room[] = [];
    const staleIds: string[] = [];

    snapshot.forEach((child) => {
      const room = mapToRoom(child.key!, child.val());
      const isStale = room.createdAt === 0 || Date.now() - room.createdAt > THREE_HOURS;
      if (isStale) {
        staleIds.push(room.id);
      } else {
        rooms.push(room);
      }
    });

    for (const id of staleIds) finishRoom(id).catch(console.error);

    rooms.sort((a, b) => b.createdAt - a.createdAt);
    callback(rooms);
  });

  return { unsubscribe };
}
