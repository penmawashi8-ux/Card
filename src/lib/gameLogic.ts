import type {
  Card,
  CardValue,
  Suit,
  Player,
  PlayerSetupConfig,
  GameSettings,
  GameState,
  Trick,
  TrickCard,
  RoundScore,
} from '@/types/game';
import { cardStrength } from '@/types/game';

// ─── Deck creation & shuffle ──────────────────────────────────────────────────

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUES: CardValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ id: `${suit}-${value}`, suit, value, isJoker: false });
    }
  }
  // Add Joker
  deck.push({ id: 'joker', isJoker: true });
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

// ─── Empty trick ──────────────────────────────────────────────────────────────

function emptyTrick(leadPlayerIndex: number): Trick {
  return {
    leadSuit: null,
    declaredSuit: null,
    cards: [],
    leadPlayerIndex,
    winnerId: null,
  };
}

// ─── Game initialisation ──────────────────────────────────────────────────────

export function initializeGame(
  settings: GameSettings,
  playerConfigs: PlayerSetupConfig[],
): GameState {
  if (playerConfigs.length < 3 || playerConfigs.length > 4) {
    throw new Error('Page One requires 3-4 players.');
  }

  const players: Player[] = playerConfigs.map((cfg, i) => ({
    id: `player-${i}`,
    name: cfg.name,
    type: cfg.type,
    hand: [],
    score: 0,
    pageOneDeclared: false,
    isConnected: true,
  }));

  const baseState: GameState = {
    phase: 'dealing',
    players,
    drawPile: [],
    discardPile: [],
    currentTrick: emptyTrick(0),
    currentPlayerIndex: 0,
    leadPlayerIndex: 0,
    round: 1,
    totalRounds: settings.rounds,
    settings,
    lastWinnerId: null,
    roundScores: [],
    message: 'ゲームを開始します',
    drawingPlayerId: null,
    drawnCardsThisTurn: 0,
  };

  return initializeRound(baseState);
}

export function initializeRound(state: GameState): GameState {
  const deck = createDeck(); // 53 cards, already shuffled

  // Deal 4 cards to each player
  const players = state.players.map((p) => ({
    ...p,
    hand: [] as Card[],
    pageOneDeclared: false,
  }));

  let deckIdx = 0;
  for (let i = 0; i < 4; i++) {
    for (let p = 0; p < players.length; p++) {
      players[p].hand.push(deck[deckIdx++]);
    }
  }

  const drawPile = deck.slice(deckIdx);

  // Determine lead player index: first round = 0, subsequent = last winner
  let leadPlayerIndex = 0;
  if (state.lastWinnerId) {
    const idx = players.findIndex((p) => p.id === state.lastWinnerId);
    if (idx !== -1) leadPlayerIndex = idx;
  }

  return {
    ...state,
    phase: 'leading',
    players,
    drawPile,
    discardPile: [],
    currentTrick: emptyTrick(leadPlayerIndex),
    currentPlayerIndex: leadPlayerIndex,
    leadPlayerIndex,
    message: `ラウンド ${state.round} 開始！${players[leadPlayerIndex].name} からです`,
    drawingPlayerId: null,
    drawnCardsThisTurn: 0,
  };
}

// ─── Card playability checks ──────────────────────────────────────────────────

/** Returns the effective suit for the current trick (declared suit if Joker led) */
export function getEffectiveSuit(trick: Trick): Suit | null {
  return trick.declaredSuit ?? trick.leadSuit;
}

/** Whether a card can be played in the current state */
export function canPlayCard(card: Card, trick: Trick): boolean {
  if (card.isJoker) return true;
  const effectiveSuit = getEffectiveSuit(trick);
  if (!effectiveSuit) return true; // leading - any card is valid
  return card.suit === effectiveSuit;
}

/** Check if a player has any playable card */
export function hasPlayableCard(player: Player, trick: Trick): boolean {
  return player.hand.some((c) => canPlayCard(c, trick));
}

// ─── Play a card (lead) ───────────────────────────────────────────────────────

export function playLeadCard(state: GameState, cardId: string): GameState {
  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex];
  const cardIdx = player.hand.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) throw new Error('Card not in hand');

  const card = player.hand[cardIdx];
  const newHand = player.hand.filter((_, i) => i !== cardIdx);

  const trickCard: TrickCard = {
    playerId: player.id,
    card,
    seatIndex: playerIndex,
  };

  const newTrick: Trick = {
    ...state.currentTrick,
    leadSuit: card.suit ?? null,
    cards: [trickCard],
    leadPlayerIndex: playerIndex,
    winnerId: null,
  };

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, hand: newHand } : p
  );

  // If Joker is played as lead, need suit declaration
  if (card.isJoker) {
    return {
      ...state,
      phase: 'joker_suit_declare',
      players: newPlayers,
      currentTrick: newTrick,
      message: `${player.name} がジョーカーを出しました。スートを宣言してください`,
      drawnCardsThisTurn: 0,
    };
  }

  return advanceToNextFollower(
    {
      ...state,
      players: newPlayers,
      currentTrick: newTrick,
      drawnCardsThisTurn: 0,
    },
    playerIndex
  );
}

/** After joker is played as lead, player declares the suit */
export function declareJokerSuit(state: GameState, suit: Suit): GameState {
  const newTrick: Trick = {
    ...state.currentTrick,
    declaredSuit: suit,
    leadSuit: suit,
  };

  const leadPlayerIndex = state.currentTrick.leadPlayerIndex;

  return advanceToNextFollower(
    {
      ...state,
      currentTrick: newTrick,
    },
    leadPlayerIndex
  );
}

// ─── Play a following card ────────────────────────────────────────────────────

export function playFollowCard(state: GameState, cardId: string): GameState {
  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex];
  const cardIdx = player.hand.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) throw new Error('Card not in hand');

  const card = player.hand[cardIdx];

  // Validate
  if (!canPlayCard(card, state.currentTrick)) {
    throw new Error('Invalid card: must match lead suit or play Joker');
  }

  const newHand = player.hand.filter((_, i) => i !== cardIdx);

  const trickCard: TrickCard = {
    playerId: player.id,
    card,
    seatIndex: playerIndex,
  };

  const newTrick: Trick = {
    ...state.currentTrick,
    cards: [...state.currentTrick.cards, trickCard],
  };

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, hand: newHand } : p
  );

  const newState = {
    ...state,
    players: newPlayers,
    currentTrick: newTrick,
    drawnCardsThisTurn: 0,
  };

  // Check if all players have played
  if (newTrick.cards.length >= state.players.length) {
    return resolveTrick(newState);
  }

  return advanceToNextFollower(newState, playerIndex);
}

// ─── Draw a card ──────────────────────────────────────────────────────────────

/**
 * Draw one card from draw pile. Returns the new state.
 * If the drawn card is playable, the state phase is still 'auto_drawing'
 * (caller should then call playDrawnCard).
 * If draw pile is empty, shuffle discard into draw pile first.
 */
export function drawOneCard(state: GameState): { newState: GameState; drawnCard: Card | null } {
  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile];

  // If draw pile empty, shuffle discard into it
  if (drawPile.length === 0) {
    if (discardPile.length === 0) {
      return { newState: state, drawnCard: null };
    }
    drawPile = shuffle(discardPile);
    discardPile = [];
  }

  const drawnCard = drawPile[0];
  drawPile = drawPile.slice(1);

  const playerIndex = state.currentPlayerIndex;
  const newPlayers = state.players.map((p, i) =>
    i === playerIndex
      ? { ...p, hand: [...p.hand, drawnCard] }
      : p
  );

  return {
    newState: {
      ...state,
      players: newPlayers,
      drawPile,
      discardPile,
      drawnCardsThisTurn: state.drawnCardsThisTurn + 1,
      drawingPlayerId: state.players[playerIndex].id,
      message: `${state.players[playerIndex].name} がカードを引いています...`,
    },
    drawnCard,
  };
}

/**
 * Initiate auto-drawing for a player who cannot follow suit.
 * Returns state with phase='auto_drawing'.
 */
export function startDrawing(state: GameState): GameState {
  const player = state.players[state.currentPlayerIndex];
  return {
    ...state,
    phase: 'auto_drawing',
    drawingPlayerId: player.id,
    drawnCardsThisTurn: 0,
    message: `${player.name} は出せるカードがないので引きます...`,
  };
}

// ─── Advance to next player who must follow ───────────────────────────────────

function advanceToNextFollower(state: GameState, justPlayedIndex: number): GameState {
  const { players, currentTrick, settings } = state;
  const leadIndex = currentTrick.leadPlayerIndex;

  // Find next player index (clockwise from just played)
  let nextIndex = (justPlayedIndex + 1) % players.length;

  // Skip lead player as they already played
  while (nextIndex !== leadIndex && currentTrick.cards.some((tc) => tc.seatIndex === nextIndex)) {
    nextIndex = (nextIndex + 1) % players.length;
  }

  // If we've wrapped back to lead, all have played - resolve trick
  if (currentTrick.cards.some((tc) => tc.seatIndex === nextIndex)) {
    return resolveTrick({ ...state, currentPlayerIndex: nextIndex });
  }

  const nextPlayer = players[nextIndex];

  // Check if next player can follow suit
  const canFollow = hasPlayableCard(nextPlayer, currentTrick);

  // Check page one pending (manual mode)
  // Page one check happens after card was just played
  const justPlayedPlayer = players[justPlayedIndex];
  if (!settings.autoPageOne && justPlayedPlayer.hand.length === 1 && !justPlayedPlayer.pageOneDeclared) {
    // Need page one declaration before proceeding
    const newPlayers = state.players.map((p, i) =>
      i === justPlayedIndex ? { ...p } : p
    );
    return {
      ...state,
      players: newPlayers,
      currentPlayerIndex: justPlayedIndex,
      phase: 'page_one_pending',
      message: `${justPlayedPlayer.name}！「ページワン！」を宣言してください`,
    };
  }

  if (!canFollow) {
    return {
      ...state,
      currentPlayerIndex: nextIndex,
      phase: 'auto_drawing',
      drawingPlayerId: nextPlayer.id,
      drawnCardsThisTurn: 0,
      message: `${nextPlayer.name} は出せるカードがないので引きます...`,
    };
  }

  return {
    ...state,
    currentPlayerIndex: nextIndex,
    phase: 'following',
    drawingPlayerId: null,
    message: `${nextPlayer.name} のターン`,
  };
}

// ─── Trick resolution ─────────────────────────────────────────────────────────

export function resolveTrick(state: GameState): GameState {
  const { currentTrick, players } = state;
  const effectiveSuit = getEffectiveSuit(currentTrick);

  // Find winning card: Joker wins; if no Joker, highest strength matching lead suit
  let winnerId: string | null = null;
  let winnerCard: Card | null = null;
  let highestStrength = -1;

  for (const trickCard of currentTrick.cards) {
    const { card, playerId } = trickCard;
    if (card.isJoker) {
      // Joker always wins
      winnerId = playerId;
      winnerCard = card;
      break;
    }
    if (card.suit === effectiveSuit) {
      const strength = cardStrength(card);
      if (strength > highestStrength) {
        highestStrength = strength;
        winnerId = playerId;
        winnerCard = card;
      }
    }
  }

  if (!winnerId) {
    // Fallback: first card played wins
    winnerId = currentTrick.cards[0].playerId;
    winnerCard = currentTrick.cards[0].card;
  }

  const winnerIndex = players.findIndex((p) => p.id === winnerId);
  const winnerName = players[winnerIndex]?.name ?? '';

  // Move trick cards to discard pile
  const newDiscardPile = [
    ...state.discardPile,
    ...currentTrick.cards.map((tc) => tc.card),
  ];

  const resolvedTrick: Trick = {
    ...currentTrick,
    winnerId,
  };

  // Check if any player has emptied their hand (round end)
  const winner = players[winnerIndex];
  const trickWinnerPlayer = { ...winner };

  // Check ban joker win
  if (state.settings.banJokerWin && winnerCard?.isJoker) {
    // Check if the joker player has empty hand
    const jokerPlayerIndex = players.findIndex((p) => p.id === winnerId);
    if (jokerPlayerIndex !== -1 && players[jokerPlayerIndex].hand.length === 0) {
      // Cannot win with joker - give them a penalty card
      // This is handled in the auto_drawing phase but we need to check here
      // Actually: the player played joker as last card, so they already have 0 cards
      // They need to be penalized - draw from pile
      // But for trick_result we just show the result, then handle it
    }
  }

  // Check for page one pending after trick win
  // (winner leads next trick - if they have 1 card left they may need to declare)
  const newPlayers = state.players.map((p) => ({ ...p }));

  // Check if any player won the round (empty hand)
  const roundWinner = newPlayers.find((p) => p.hand.length === 0);

  return {
    ...state,
    phase: 'trick_result',
    players: newPlayers,
    discardPile: newDiscardPile,
    currentTrick: resolvedTrick,
    lastWinnerId: winnerId,
    drawingPlayerId: null,
    message: `${winnerName} のトリック勝ち！`,
  };
}

// ─── After trick_result delay – start next trick or end round ─────────────────

export function advanceAfterTrickResult(state: GameState): GameState {
  const { players, settings, lastWinnerId } = state;

  // Check if any player has emptied their hand
  const roundWinnerIdx = players.findIndex((p) => p.hand.length === 0);
  if (roundWinnerIdx !== -1) {
    const roundWinner = players[roundWinnerIdx];

    // Check ban joker win
    if (settings.banJokerWin) {
      const lastCard = state.currentTrick.cards.find(
        (tc) => tc.playerId === roundWinner.id
      );
      if (lastCard?.card.isJoker) {
        // Penalty: winner must draw 2 cards
        let drawPile = [...state.drawPile];
        let discardPile = [...state.discardPile];
        const penaltyCards: Card[] = [];

        for (let i = 0; i < 2 && (drawPile.length > 0 || discardPile.length > 0); i++) {
          if (drawPile.length === 0) {
            drawPile = shuffle(discardPile);
            discardPile = [];
          }
          if (drawPile.length > 0) {
            penaltyCards.push(drawPile.shift()!);
          }
        }

        const newPlayers = players.map((p, i) =>
          i === roundWinnerIdx ? { ...p, hand: [...p.hand, ...penaltyCards] } : p
        );

        const winnerIndex = lastWinnerId ? players.findIndex((p) => p.id === lastWinnerId) : 0;
        const nextLeadIndex = winnerIndex !== -1 ? winnerIndex : 0;

        return {
          ...state,
          phase: 'leading',
          players: newPlayers,
          drawPile,
          discardPile,
          currentTrick: emptyTrick(nextLeadIndex),
          currentPlayerIndex: nextLeadIndex,
          leadPlayerIndex: nextLeadIndex,
          drawnCardsThisTurn: 0,
          message: `ジョーカーでの上がりは禁止！${roundWinner.name} に2枚のペナルティ`,
        };
      }
    }

    return endRound(state);
  }

  // Start next trick
  const winnerIndex = lastWinnerId ? players.findIndex((p) => p.id === lastWinnerId) : 0;
  const nextLeadIndex = winnerIndex !== -1 ? winnerIndex : 0;
  const nextLeadPlayer = players[nextLeadIndex];

  // Check if winner has exactly 1 card (page one)
  if (!settings.autoPageOne && nextLeadPlayer.hand.length === 1 && !nextLeadPlayer.pageOneDeclared) {
    return {
      ...state,
      phase: 'page_one_pending',
      currentTrick: emptyTrick(nextLeadIndex),
      currentPlayerIndex: nextLeadIndex,
      leadPlayerIndex: nextLeadIndex,
      drawingPlayerId: null,
      message: `${nextLeadPlayer.name}！「ページワン！」を宣言してください`,
    };
  }

  return {
    ...state,
    phase: 'leading',
    currentTrick: emptyTrick(nextLeadIndex),
    currentPlayerIndex: nextLeadIndex,
    leadPlayerIndex: nextLeadIndex,
    drawingPlayerId: null,
    drawnCardsThisTurn: 0,
    message: `${nextLeadPlayer.name} がリードします`,
  };
}

// ─── Page One handling ────────────────────────────────────────────────────────

export function declarePageOne(state: GameState): GameState {
  const playerIndex = state.currentPlayerIndex;
  const player = state.players[playerIndex];

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex ? { ...p, pageOneDeclared: true } : p
  );

  // Now determine next phase: if this was in the middle of a trick, continue following
  const { currentTrick } = state;
  const allPlayed = currentTrick.cards.length >= state.players.length;

  if (allPlayed) {
    return resolveTrick({ ...state, players: newPlayers });
  }

  // Check if this was in leading position or following position
  const isLeading = currentTrick.cards.length === 0;

  if (isLeading) {
    return {
      ...state,
      players: newPlayers,
      phase: 'leading',
      message: `${player.name} がページワンを宣言！リードしてください`,
    };
  }

  // Were they a follower? Continue to next follower
  return advanceToNextFollower(
    { ...state, players: newPlayers },
    playerIndex
  );
}

export function applyPageOnePenalty(state: GameState): GameState {
  const playerIndex = state.players.findIndex(
    (p) => p.hand.length === 1 && !p.pageOneDeclared
  );
  if (playerIndex === -1) return state;

  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile];
  const penaltyCards: Card[] = [];

  for (let i = 0; i < 5 && (drawPile.length > 0 || discardPile.length > 0); i++) {
    if (drawPile.length === 0) {
      drawPile = shuffle(discardPile);
      discardPile = [];
    }
    if (drawPile.length > 0) {
      penaltyCards.push(drawPile.shift()!);
    }
  }

  const newPlayers = state.players.map((p, i) =>
    i === playerIndex
      ? { ...p, hand: [...p.hand, ...penaltyCards], pageOneDeclared: false }
      : p
  );

  return {
    ...state,
    players: newPlayers,
    drawPile,
    discardPile,
    message: `${state.players[playerIndex].name} がページワンを忘れた！5枚ペナルティ`,
  };
}

// ─── Auto page one declaration ────────────────────────────────────────────────

/** After a card is played, check and auto-declare page one if needed */
export function checkAndAutoPageOne(state: GameState): GameState {
  if (!state.settings.autoPageOne) return state;

  const newPlayers = state.players.map((p) => {
    if (p.hand.length === 1 && !p.pageOneDeclared) {
      return { ...p, pageOneDeclared: true };
    }
    return p;
  });

  const hadDeclaration = newPlayers.some((p, i) =>
    p.pageOneDeclared && !state.players[i].pageOneDeclared
  );

  if (hadDeclaration) {
    const declarer = newPlayers.find((p, i) =>
      p.pageOneDeclared && !state.players[i].pageOneDeclared
    );
    return {
      ...state,
      players: newPlayers,
      message: `${declarer?.name ?? ''} ページワン！`,
    };
  }

  return { ...state, players: newPlayers };
}

// ─── Round end ────────────────────────────────────────────────────────────────

export function endRound(state: GameState): GameState {
  const { players, round, totalRounds } = state;

  // Find winner (empty hand)
  const winnerIdx = players.findIndex((p) => p.hand.length === 0);
  const winner = winnerIdx !== -1 ? players[winnerIdx] : players[0];

  // Scoring
  const scores: Record<string, number> = {};
  let winnerBonus = 0;

  for (const p of players) {
    if (p.id === winner.id) continue;
    const remaining = p.hand.length;
    scores[p.id] = -remaining;
    winnerBonus += remaining;
  }
  scores[winner.id] = winnerBonus;

  const roundScore: RoundScore = {
    round,
    winnerId: winner.id,
    scores,
  };

  const newPlayers = players.map((p) => ({
    ...p,
    score: p.score + (scores[p.id] ?? 0),
  }));

  const isGameEnd = round >= totalRounds;

  return {
    ...state,
    phase: isGameEnd ? 'game_end' : 'round_end',
    players: newPlayers,
    roundScores: [...state.roundScores, roundScore],
    lastWinnerId: winner.id,
    message: `${winner.name} がラウンド ${round} を勝ちました！`,
  };
}

export function startNextRound(state: GameState): GameState {
  if (state.round >= state.totalRounds) {
    return { ...state, phase: 'game_end' };
  }

  return initializeRound({
    ...state,
    round: state.round + 1,
  });
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function suitSymbol(suit: Suit): string {
  const map: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };
  return map[suit];
}

export function cardValueLabel(value: CardValue): string {
  if (value === 1) return 'A';
  if (value === 11) return 'J';
  if (value === 12) return 'Q';
  if (value === 13) return 'K';
  return String(value);
}

/** Returns players sorted descending by score (highest = best). */
export function getStandings(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.score - a.score);
}
