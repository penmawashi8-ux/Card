import type { GameState, Card, Suit } from '@/types/game';
import {
  getCircleCardIndices,
  canPlayFromHand,
  getTopCard,
  checkPenalty,
} from '@/lib/gameLogic';

export type CpuDecision =
  | { source: 'circle'; circleIndex: number; handCardId?: undefined }
  | { source: 'hand'; handCardId: string; circleIndex?: undefined };

// ─── Public entry point ───────────────────────────────────────────────────────

export function getCpuDecision(state: GameState): CpuDecision {
  const player = state.players[state.currentPlayerIndex];
  const difficulty = player.cpuDifficulty ?? 'normal';

  switch (difficulty) {
    case 'easy':
      return easyDecision(state);
    case 'normal':
      return normalDecision(state);
    case 'hard':
      return hardDecision(state);
  }
}

// ─── Easy AI ─────────────────────────────────────────────────────────────────
// 30 % chance to play from hand (random card), 70 % flip random circle card.

function easyDecision(state: GameState): CpuDecision {
  const hasHand = canPlayFromHand(state);
  const circleIndices = getCircleCardIndices(state);

  if (hasHand && Math.random() < 0.3) {
    const player = state.players[state.currentPlayerIndex];
    const randomCard = player.hand[Math.floor(Math.random() * player.hand.length)];
    return { source: 'hand', handCardId: randomCard.id };
  }

  if (circleIndices.length === 0) {
    // Forced to play from hand
    const player = state.players[state.currentPlayerIndex];
    const randomCard = player.hand[Math.floor(Math.random() * player.hand.length)];
    return { source: 'hand', handCardId: randomCard.id };
  }

  const randomCircleIdx =
    circleIndices[Math.floor(Math.random() * circleIndices.length)];
  return { source: 'circle', circleIndex: randomCircleIdx };
}

// ─── Normal AI ────────────────────────────────────────────────────────────────
// If the player has any safe hand card (different suit from top pile card),
// play the first one found; otherwise flip a random circle card.

function normalDecision(state: GameState): CpuDecision {
  const player = state.players[state.currentPlayerIndex];
  const topCard = getTopCard(state);
  const circleIndices = getCircleCardIndices(state);

  if (canPlayFromHand(state) && topCard) {
    const safeHandCard = player.hand.find(
      (c) => !checkPenalty(c, topCard, state.settings),
    );
    if (safeHandCard) {
      return { source: 'hand', handCardId: safeHandCard.id };
    }
  }

  if (circleIndices.length > 0) {
    const idx = circleIndices[Math.floor(Math.random() * circleIndices.length)];
    return { source: 'circle', circleIndex: idx };
  }

  // No circle cards – must play from hand (even if it's risky)
  const fallback = player.hand[0];
  return { source: 'hand', handCardId: fallback.id };
}

// ─── Hard AI ─────────────────────────────────────────────────────────────────
// Play the safest hand card based on suit frequency in the pile; if no safe
// hand card exists, flip from circle.  "Safest" = card whose suit is least
// represented in the central pile (lower risk if opponent flips same suit next).

function hardDecision(state: GameState): CpuDecision {
  const player = state.players[state.currentPlayerIndex];
  const topCard = getTopCard(state);
  const circleIndices = getCircleCardIndices(state);

  if (canPlayFromHand(state) && topCard) {
    // Find all hand cards that are safe to play right now
    const safeCards = player.hand.filter(
      (c) => !checkPenalty(c, topCard, state.settings),
    );

    if (safeCards.length > 0) {
      // Among safe cards pick the one whose suit appears MOST in the circle
      // (we know those suits, making them safer to play – opponents are less
      // likely to match immediately after us on the next flip).
      const suitScore = buildSuitRiskScore(state);
      const best = safeCards.reduce(
        (prev: Card, curr: Card) =>
          suitScore[curr.suit] <= suitScore[prev.suit] ? curr : prev,
        safeCards[0],
      );
      return { source: 'hand', handCardId: best.id };
    }
  }

  if (circleIndices.length > 0) {
    // No safe hand card → flip from circle (unknown, so random)
    const idx = circleIndices[Math.floor(Math.random() * circleIndices.length)];
    return { source: 'circle', circleIndex: idx };
  }

  // Last resort: play any hand card (least risky suit)
  if (player.hand.length > 0) {
    const suitScore = buildSuitRiskScore(state);
    const best = player.hand.reduce(
      (prev: Card, curr: Card) =>
        suitScore[curr.suit] <= suitScore[prev.suit] ? curr : prev,
      player.hand[0],
    );
    return { source: 'hand', handCardId: best.id };
  }

  // Should never reach here in a valid game state
  throw new Error('CPU hard: no valid move found.');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a risk score per suit based on how many cards of that suit are
 * already in the central pile.  Higher score = riskier to play (because the
 * pile is "heavy" with that suit, so future players are also more likely to
 * match it).
 */
function buildSuitRiskScore(state: GameState): Record<Suit, number> {
  const score: Record<Suit, number> = {
    hearts:   0,
    diamonds: 0,
    clubs:    0,
    spades:   0,
  };
  for (const card of state.centralPile) {
    score[card.suit]++;
  }
  return score;
}
