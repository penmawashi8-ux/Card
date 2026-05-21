// ─── Suits & Values ───────────────────────────────────────────────────────────

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
// 1=Ace, 11=Jack, 12=Queen, 13=King

// ─── Card ─────────────────────────────────────────────────────────────────────

export interface Card {
  id: string;        // e.g. "hearts-1", "joker"
  suit?: Suit;       // undefined for Joker
  value?: CardValue; // undefined for Joker
  isJoker: boolean;
}

// ─── Player ───────────────────────────────────────────────────────────────────

export type PlayerType = 'human' | 'cpu';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  hand: Card[];
  score: number;            // cumulative score across rounds
  pageOneDeclared: boolean; // declared "Page One" this trick sequence
  isConnected?: boolean;    // for online mode
}

// ─── Trick ────────────────────────────────────────────────────────────────────

export interface TrickCard {
  playerId: string;
  card: Card;
  seatIndex: number;
}

export interface Trick {
  leadSuit: Suit | null;      // null before lead is played
  declaredSuit: Suit | null;  // used when Joker is played as lead (player declares)
  cards: TrickCard[];         // cards played this trick
  leadPlayerIndex: number;    // seat index of the lead player
  winnerId: string | null;    // playerId of winner
}

// ─── Game Phase ───────────────────────────────────────────────────────────────

export type GamePhase =
  | 'setup'
  | 'dealing'
  | 'leading'             // lead player plays any card
  | 'following'           // follow player must match suit
  | 'auto_drawing'        // player draws until playable found
  | 'joker_suit_declare'  // Joker played as lead, declare suit
  | 'page_one_pending'    // player needs to click Page One (manual mode)
  | 'trick_result'        // brief pause showing trick winner
  | 'round_end'
  | 'game_end';

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface GameSettings {
  rounds: 3 | 5 | 7 | 10;
  playerCount: 3 | 4;
  autoPageOne: boolean;  // system declares automatically
  banJokerWin: boolean;  // cannot win by playing Joker as last card
}

// ─── Game State ───────────────────────────────────────────────────────────────

export interface RoundScore {
  round: number;
  winnerId: string;
  scores: Record<string, number>; // playerId -> score delta this round
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  drawPile: Card[];
  discardPile: Card[];
  currentTrick: Trick;
  currentPlayerIndex: number;  // index into players array
  leadPlayerIndex: number;     // index of lead player this trick
  round: number;               // 1-based
  totalRounds: number;
  settings: GameSettings;
  lastWinnerId: string | null;
  roundScores: RoundScore[];
  message: string;
  drawingPlayerId: string | null; // player currently in draw loop
  drawnCardsThisTurn: number;
}

// ─── Online ───────────────────────────────────────────────────────────────────

export interface OnlinePlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  gameState: GameState | null;
  settings: GameSettings;
  players: OnlinePlayer[];
  password: string | null;
  isPublic: boolean;
  hostName: string;
  createdAt: number;     // Unix ms timestamp
}

// ─── Setup Config ─────────────────────────────────────────────────────────────

export interface PlayerSetupConfig {
  name: string;
  type: PlayerType;
}

// ─── Action Result ────────────────────────────────────────────────────────────

export interface ActionResult {
  newState: GameState;
  isPenalty?: boolean;
  penaltyCards?: Card[];
}

// ─── Utility constants ────────────────────────────────────────────────────────

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts:   '♥',
  diamonds: '♦',
  clubs:    '♣',
  spades:   '♠',
};

export const SUIT_NAMES_JP: Record<Suit, string> = {
  hearts:   'ハート',
  diamonds: 'ダイヤ',
  clubs:    'クラブ',
  spades:   'スペード',
};

export const VALUE_LABELS: Record<CardValue, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
};

/** Numeric strength for comparison. Joker=99, Ace=14, others=face value. */
export function cardStrength(card: Card): number {
  if (card.isJoker) return 99;
  if (!card.value) return 0;
  if (card.value === 1) return 14;
  return card.value;
}
