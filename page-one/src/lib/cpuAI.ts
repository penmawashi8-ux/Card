import type { Card, GameState, Suit, Player } from '@/types/game';
import { cardStrength } from '@/types/game';
import {
  hasPlayableCard,
  getEffectiveSuit,
} from '@/lib/gameLogic';

// ─── CPU AI for Page One ──────────────────────────────────────────────────────

/**
 * Determine which card a CPU player should play.
 * Called when phase is 'leading' or 'following' and current player is CPU.
 */
export function chooseCpuCard(state: GameState): string {
  const player = state.players[state.currentPlayerIndex];
  const { phase } = state;

  if (phase === 'leading') {
    return chooseLeadCard(player, state);
  } else {
    return chooseFollowCard(player, state);
  }
}

/**
 * Choose a lead card for CPU.
 * Strategy: play highest card for strength. If hand has 2 cards (playing would
 * trigger Page One), prefer playing the weaker card to retain the stronger for later.
 */
function chooseLeadCard(player: Player, _state: GameState): string {
  const { hand } = player;
  if (hand.length === 0) throw new Error('CPU has no cards to play');

  // Sort by strength descending
  const sorted = [...hand].sort((a, b) => cardStrength(b) - cardStrength(a));

  // If we have 2 cards and would end up with 1 (Page One), play weaker to retain
  // the strong card — but only if we have a non-joker alternative
  if (hand.length === 2) {
    const hasNonJoker = sorted.some((c) => !c.isJoker);
    if (hasNonJoker) {
      // Play weakest non-joker
      const nonJokers = sorted.filter((c) => !c.isJoker);
      const weakest = nonJokers[nonJokers.length - 1];
      return weakest.id;
    }
  }

  // Play highest strength card
  return sorted[0].id;
}

/**
 * Choose a follow card for CPU.
 * Strategy:
 * - If we can win with a matching suit card, play the lowest winning card
 *   (win efficiently without wasting high cards)
 * - If we can't win, play the weakest matching suit card
 * - Joker: use only if no matching suit cards available
 */
function chooseFollowCard(player: Player, state: GameState): string {
  const { hand } = player;
  const { currentTrick } = state;

  const effectiveSuit = getEffectiveSuit(currentTrick);

  // Separate playable cards
  const matchingSuit = hand.filter(
    (c) => !c.isJoker && c.suit === effectiveSuit
  );
  const jokers = hand.filter((c) => c.isJoker);

  // Determine current highest played card strength in the trick (matching suit only)
  let currentHighestStrength = -1;
  for (const tc of currentTrick.cards) {
    if (tc.card.isJoker) {
      currentHighestStrength = 99; // Joker already played – we can't beat it
      break;
    }
    if (tc.card.suit === effectiveSuit) {
      const s = cardStrength(tc.card);
      if (s > currentHighestStrength) currentHighestStrength = s;
    }
  }

  if (matchingSuit.length > 0) {
    const sortedMatch = [...matchingSuit].sort(
      (a, b) => cardStrength(a) - cardStrength(b) // ascending
    );

    // Can we beat current highest?
    const winningCards = sortedMatch.filter(
      (c) => cardStrength(c) > currentHighestStrength
    );

    if (winningCards.length > 0) {
      // Play lowest winning card (efficient win)
      return winningCards[0].id;
    }

    // Can't win with suit – play weakest matching card
    return sortedMatch[0].id;
  }

  // No matching suit – must play Joker (should always have one since we were told to follow)
  if (jokers.length > 0) {
    return jokers[0].id;
  }

  // Shouldn't happen – caller should have checked hasPlayableCard
  throw new Error('CPU has no playable card');
}

/**
 * Choose which suit to declare when Joker is played as lead.
 * Strategy: declare the suit we have the most of (to maintain strength).
 * If no other cards, pick any suit.
 */
export function chooseCpuSuit(state: GameState): Suit {
  const player = state.players[state.currentPlayerIndex];
  const nonJokers = player.hand.filter((c) => !c.isJoker);

  if (nonJokers.length === 0) {
    return 'spades'; // arbitrary default
  }

  // Count suits
  const suitCounts: Record<Suit, number> = {
    hearts: 0,
    diamonds: 0,
    clubs: 0,
    spades: 0,
  };
  for (const card of nonJokers) {
    if (card.suit) suitCounts[card.suit]++;
  }

  // Return suit with most cards
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  return suits.reduce((best, suit) =>
    suitCounts[suit] > suitCounts[best] ? suit : best
  );
}

/**
 * Whether a CPU player needs to draw (auto_drawing phase).
 */
export function cpuNeedsToDrawFirst(state: GameState): boolean {
  const player = state.players[state.currentPlayerIndex];
  if (player.type !== 'cpu') return false;
  if (state.phase !== 'following') return false;
  return !hasPlayableCard(player, state.currentTrick);
}
