import type {
  Card,
  CardValue,
  Suit,
  Player,
  PlayerSetupConfig,
  GamePhase,
  GameSettings,
  GameState,
  ActionResult,
} from '@/types/game';

// ─── Deck creation & shuffle ──────────────────────────────────────────────────

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ id: `${suit}-${value}`, suit, value });
    }
  }
  return shuffle(deck);
}

/** Fisher-Yates shuffle – returns a new array */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Game initialisation ──────────────────────────────────────────────────────

export function initializeGame(
  settings: GameSettings,
  playerConfigs: PlayerSetupConfig[],
): GameState {
  if (playerConfigs.length < 3 || playerConfigs.length > 6) {
    throw new Error('Buta no Shippo requires 3-6 players.');
  }

  const players: Player[] = playerConfigs.map((cfg, i) => ({
    id: `player-${i}`,
    name: cfg.name,
    type: cfg.type,
    cpuDifficulty: cfg.type === 'cpu' ? cfg.cpuDifficulty : undefined,
    hand: [],
    penaltyCountThisRound: 0,
    totalPenaltyCount: 0,
  }));

  const baseState: GameState = {
    phase: 'playing',
    circleCards: [],
    centralPile: [],
    players,
    currentPlayerIndex: 0,
    currentRound: 1,
    settings,
    lastPenaltyPlayerIndex: undefined,
    animatingCard: undefined,
  };

  return initializeRound(baseState);
}

export function initializeRound(state: GameState): GameState {
  const deck = createDeck(); // already shuffled

  // Reset per-round penalty counts and clear hands
  const players = state.players.map((p) => ({
    ...p,
    hand: [],
    penaltyCountThisRound: 0,
  }));

  return {
    ...state,
    phase: 'playing',
    circleCards: deck as (Card | null)[],
    centralPile: [],
    players,
    currentPlayerIndex: 0,
    lastPenaltyPlayerIndex: undefined,
    animatingCard: undefined,
  };
}

// ─── Penalty check ────────────────────────────────────────────────────────────

export function checkPenalty(
  card: Card,
  topCard: Card | null,
  settings: GameSettings,
): boolean {
  if (!topCard) return false;

  const sameSuit = card.suit === topCard.suit;
  const sameNumber = settings.penaltyOnSameNumber && card.value === topCard.value;

  return sameSuit || sameNumber;
}

// ─── Play a card ──────────────────────────────────────────────────────────────

export function playCard(
  state: GameState,
  source: 'circle' | 'hand',
  circleIndex?: number,
  handCardId?: string,
): ActionResult {
  if (state.phase !== 'playing') {
    throw new Error('Cannot play a card outside of the playing phase.');
  }

  let card: Card;
  let newCircleCards = [...state.circleCards];
  const currentPlayer = state.players[state.currentPlayerIndex];
  let newPlayers = state.players.map((p) => ({ ...p, hand: [...p.hand] }));
  let newPhase: GamePhase = 'playing';

  // ── Determine card being played ──────────────────────────────────────────
  if (source === 'circle') {
    if (circleIndex === undefined) {
      throw new Error('circleIndex required when source is "circle".');
    }
    const circleCard = newCircleCards[circleIndex];
    if (!circleCard) {
      throw new Error(`Circle slot ${circleIndex} is empty.`);
    }
    card = circleCard;
    newCircleCards[circleIndex] = null;
  } else {
    // source === 'hand'
    if (!handCardId) {
      throw new Error('handCardId required when source is "hand".');
    }
    const handIdx = currentPlayer.hand.findIndex((c) => c.id === handCardId);
    if (handIdx === -1) {
      throw new Error(`Card ${handCardId} not found in player's hand.`);
    }
    card = currentPlayer.hand[handIdx];
    // Remove from current player's hand
    newPlayers[state.currentPlayerIndex] = {
      ...newPlayers[state.currentPlayerIndex],
      hand: [
        ...currentPlayer.hand.slice(0, handIdx),
        ...currentPlayer.hand.slice(handIdx + 1),
      ],
    };
  }

  // ── Check penalty ────────────────────────────────────────────────────────
  const topCard =
    state.centralPile.length > 0
      ? state.centralPile[state.centralPile.length - 1]
      : null;

  const isPenalty = checkPenalty(card, topCard, state.settings);

  // Put the played card on the pile
  const newPile = [...state.centralPile, card];

  let penaltyCards: Card[] | undefined;
  let nextPlayerIndex: number;

  if (isPenalty) {
    // Current player takes the entire pile into their hand
    penaltyCards = [...newPile];

    newPlayers[state.currentPlayerIndex] = {
      ...newPlayers[state.currentPlayerIndex],
      hand: [...newPlayers[state.currentPlayerIndex].hand, ...newPile],
    };

    // Check if round ends (no circle cards left)
    const remainingCircle = newCircleCards.filter((c) => c !== null);
    if (remainingCircle.length === 0) {
      newPhase =
        state.currentRound >= state.settings.rounds ? 'game_end' : 'round_end';
    }

    // Capture end-of-round scores (actual hand counts, not intake)
    if (newPhase !== 'playing') {
      newPlayers = newPlayers.map((p) => ({
        ...p,
        penaltyCountThisRound: p.hand.length,
        totalPenaltyCount: p.totalPenaltyCount + p.hand.length,
      }));
    }

    nextPlayerIndex =
      (state.currentPlayerIndex + 1) % state.players.length;

    return {
      newState: {
        ...state,
        phase: newPhase,
        circleCards: newCircleCards,
        centralPile: [],   // pile is cleared – all cards went to player's hand
        players: newPlayers,
        currentPlayerIndex: nextPlayerIndex,
        lastPenaltyPlayerIndex: state.currentPlayerIndex,
        animatingCard: undefined,
      },
      isPenalty: true,
      penaltyCards,
    };
  }

  // ── No penalty ───────────────────────────────────────────────────────────
  const remainingCircle = newCircleCards.filter((c) => c !== null);
  if (remainingCircle.length === 0) {
    newPhase =
      state.currentRound >= state.settings.rounds ? 'game_end' : 'round_end';
  }

  // Capture end-of-round scores (actual hand counts, not intake)
  if (newPhase !== 'playing') {
    newPlayers = newPlayers.map((p) => ({
      ...p,
      penaltyCountThisRound: p.hand.length,
      totalPenaltyCount: p.totalPenaltyCount + p.hand.length,
    }));
  }

  nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

  return {
    newState: {
      ...state,
      phase: newPhase,
      circleCards: newCircleCards,
      centralPile: newPile,
      players: newPlayers,
      currentPlayerIndex: nextPlayerIndex,
      lastPenaltyPlayerIndex: undefined,
      animatingCard: undefined,
    },
    isPenalty: false,
  };
}

// ─── Round & game transitions ─────────────────────────────────────────────────

export function startNextRound(state: GameState): GameState {
  if (state.currentRound >= state.settings.rounds) {
    // Should not happen, but guard anyway
    return { ...state, phase: 'game_end' };
  }

  const nextRound = state.currentRound + 1;
  const nextState = initializeRound({
    ...state,
    currentRound: nextRound,
  });

  return nextState;
}

// ─── Standings ────────────────────────────────────────────────────────────────

/** Returns players sorted ascending by totalPenaltyCount (fewest = best). */
export function getStandings(players: Player[]): Player[] {
  return [...players].sort((a, b) => a.totalPenaltyCount - b.totalPenaltyCount);
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

/** Returns the indices of circle slots that still have a card. */
export function getCircleCardIndices(state: GameState): number[] {
  return state.circleCards
    .map((card, idx) => ({ card, idx }))
    .filter(({ card }) => card !== null)
    .map(({ idx }) => idx);
}

/** Whether the current player has cards in their hand they can play. */
export function canPlayFromHand(state: GameState): boolean {
  const player = state.players[state.currentPlayerIndex];
  return player.hand.length > 0;
}

/** Returns the top card of the central pile, or null if empty. */
export function getTopCard(state: GameState): Card | null {
  if (state.centralPile.length === 0) return null;
  return state.centralPile[state.centralPile.length - 1];
}

/** Display label for a card value (1→A, 11→J, 12→Q, 13→K, else number). */
export function cardValueLabel(value: CardValue): string {
  if (value === 1)  return 'A';
  if (value === 11) return 'J';
  if (value === 12) return 'Q';
  if (value === 13) return 'K';
  return String(value);
}

/** Whether a suit is red (hearts / diamonds). */
export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

/** Unicode suit symbols. */
export function suitSymbol(suit: Suit): string {
  const map: Record<Suit, string> = {
    hearts:   '♥',
    diamonds: '♦',
    clubs:    '♣',
    spades:   '♠',
  };
  return map[suit];
}
