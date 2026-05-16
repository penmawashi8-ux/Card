// ─── Card primitives ─────────────────────────────────────────────────────────

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

/** 1 = Ace, 11 = Jack, 12 = Queen, 13 = King */
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string;        // e.g. "hearts-7"
  suit: Suit;
  value: CardValue;
}

// ─── Player ───────────────────────────────────────────────────────────────────

export type PlayerType = 'human' | 'cpu';

export type CpuDifficulty = 'easy' | 'normal' | 'hard';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  cpuDifficulty?: CpuDifficulty;
  /** Cards taken as penalties this session – the player's "hand" */
  hand: Card[];
  /** How many penalty cards collected this round */
  penaltyCountThisRound: number;
  /** Cumulative penalty cards across all rounds */
  totalPenaltyCount: number;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface GameSettings {
  rounds: 1 | 3 | 5 | 10;
  /** If true, same number (in addition to same suit) triggers penalty */
  penaltyOnSameNumber: boolean;
}

// ─── Game state ───────────────────────────────────────────────────────────────

export type GamePhase = 'setup' | 'playing' | 'round_end' | 'game_end';

export interface AnimatingCard {
  card: Card;
  fromType: 'circle' | 'hand';
  circleIndex?: number;
}

export interface GameState {
  phase: GamePhase;
  /** The circle of 52 face-down cards; null means the slot has been used */
  circleCards: (Card | null)[];
  /** The central pile (台札) – top of array is the most recent card */
  centralPile: Card[];
  players: Player[];
  currentPlayerIndex: number;
  currentRound: number;
  settings: GameSettings;
  /** Index of the player who just received a penalty (for UI highlighting) */
  lastPenaltyPlayerIndex?: number;
  /** Card currently being animated between zones */
  animatingCard?: AnimatingCard;
}

// ─── Multiplayer / room ───────────────────────────────────────────────────────

export type GameMode = 'cpu' | 'online' | 'hybrid';

export type RoomStatus = 'waiting' | 'playing' | 'ended';

export interface Room {
  id: string;
  code: string;          // 6-char alphanumeric join code
  hostId: string;
  status: RoomStatus;
  gameState: GameState | null;
  settings: GameSettings;
  players: RoomPlayer[];
}

export interface RoomPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

export interface PlayerSetupConfig {
  name: string;
  type: PlayerType;
  cpuDifficulty: CpuDifficulty;
}

// ─── Action result ────────────────────────────────────────────────────────────

export interface ActionResult {
  newState: GameState;
  isPenalty: boolean;
  penaltyCards?: Card[];
}
