import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import type { GameSettings, GameState, Room, PlayerSetupConfig } from '@/types/game';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const isSupabaseEnabled = !!supabase;

// ─── Room code generator ──────────────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit confusable chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Room management ──────────────────────────────────────────────────────────

/**
 * Creates a new room in Supabase.
 * Returns the created Room or null if Supabase is not configured.
 */
export async function createRoom(
  hostId: string,
  settings: GameSettings,
  playerConfigs: PlayerSetupConfig[],
): Promise<Room | null> {
  if (!supabase) return null;

  const code = generateRoomCode();

  const roomPayload = {
    code,
    host_id: hostId,
    status: 'waiting' as const,
    game_state: null,
    settings,
    players: playerConfigs.map((cfg, i) => ({
      id: i === 0 ? hostId : `player-${i}`,
      name: cfg.name,
      isHost: i === 0,
      isReady: i === 0,
    })),
  };

  const { data, error } = await supabase
    .from('rooms')
    .insert(roomPayload)
    .select()
    .single();

  if (error || !data) {
    console.error('[supabase] createRoom error:', error);
    return null;
  }

  return mapRowToRoom(data);
}

/**
 * Joins an existing room by code.
 * Returns the updated Room or null on failure.
 */
export async function joinRoom(
  code: string,
  playerId: string,
  playerName: string,
): Promise<Room | null> {
  if (!supabase) return null;

  // Fetch room
  const { data: room, error: fetchError } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('status', 'waiting')
    .single();

  if (fetchError || !room) {
    console.error('[supabase] joinRoom fetch error:', fetchError);
    return null;
  }

  const players: Room['players'] = [
    ...(room.players ?? []),
    { id: playerId, name: playerName, isHost: false, isReady: false },
  ];

  const { data: updated, error: updateError } = await supabase
    .from('rooms')
    .update({ players })
    .eq('id', room.id)
    .select()
    .single();

  if (updateError || !updated) {
    console.error('[supabase] joinRoom update error:', updateError);
    return null;
  }

  return mapRowToRoom(updated);
}

/**
 * Persists the current game state to Supabase.
 */
export async function updateGameState(
  roomId: string,
  gameState: GameState,
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from('rooms')
    .update({ game_state: gameState, status: 'playing' })
    .eq('id', roomId);

  if (error) {
    console.error('[supabase] updateGameState error:', error);
  }
}

/**
 * Subscribes to real-time changes on a room row.
 * Returns the RealtimeChannel (call .unsubscribe() on cleanup) or null.
 */
export function subscribeToRoom(
  roomId: string,
  callback: (room: Room) => void,
): RealtimeChannel | null {
  if (!supabase) return null;

  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.new) {
          callback(mapRowToRoom(payload.new));
        }
      },
    )
    .subscribe();

  return channel;
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToRoom(row: Record<string, any>): Room {
  return {
    id: row.id,
    code: row.code,
    hostId: row.host_id,
    status: row.status,
    gameState: row.game_state ?? null,
    settings: row.settings,
    players: row.players ?? [],
  };
}
