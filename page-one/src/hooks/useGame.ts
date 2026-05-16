'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, Suit, GameSettings, PlayerSetupConfig } from '@/types/game';
import {
  playLeadCard,
  playFollowCard,
  declareJokerSuit,
  declarePageOne,
  checkAndAutoPageOne,
  drawOneCard,
  startDrawing,
  advanceAfterTrickResult,
  startNextRound as gameStartNextRound,
  initializeGame,
  hasPlayableCard,
} from '@/lib/gameLogic';
import { chooseCpuCard, chooseCpuSuit } from '@/lib/cpuAI';
import { soundManager } from '@/lib/sounds';
import { updateGameState, subscribeToRoom } from '@/lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseGameReturn {
  state: GameState;
  onPlayCard: (cardId: string) => void;
  onDeclareJokerSuit: (suit: Suit) => void;
  onDeclarePageOne: () => void;
  onContinueAfterRound: () => void;
  onResetGame: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGame(
  initialState: GameState,
  options?: { roomId?: string; playerId?: string }
): UseGameReturn {
  const [state, setState] = useState<GameState>(initialState);
  const stateRef = useRef<GameState>(initialState);

  const roomId = options?.roomId;

  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Push state and keep ref in sync
  const applyState = useCallback((newState: GameState) => {
    stateRef.current = newState;
    setState(newState);
    if (roomId) {
      updateGameState(roomId, newState).catch(console.error);
    }
  }, [roomId]);

  // ── Online sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId) return;
    const sub = subscribeToRoom(roomId, (room) => {
      if (room.gameState) {
        stateRef.current = room.gameState;
        setState(room.gameState);
      }
    });
    return () => sub?.unsubscribe();
  }, [roomId]);

  // ── Auto-drawing loop ───────────────────────────────────────────────────
  // When phase is auto_drawing, draw one card at a time (500ms interval)
  // until the player can play, then play that card automatically.
  useEffect(() => {
    const current = stateRef.current;
    if (current.phase !== 'auto_drawing') return;

    const timer = setTimeout(() => {
      const s = stateRef.current;
      if (s.phase !== 'auto_drawing') return;

      const playerIndex = s.currentPlayerIndex;
      const player = s.players[playerIndex];

      // Check if player can now play (drawn a matching card)
      if (hasPlayableCard(player, s.currentTrick)) {
        // For CPU: auto-play the card immediately
        if (player.type === 'cpu') {
          let nextState: GameState;
          try {
            const cardId = chooseCpuCard({ ...s, phase: 'following' });
            nextState = playFollowCard({ ...s, phase: 'following' }, cardId);
            soundManager.playCardPlay();
          } catch {
            // Fallback
            return;
          }
          const afterPageOne = checkAndAutoPageOne(nextState);
          // If auto page one triggered, announce it
          if (afterPageOne.message !== nextState.message) {
            soundManager.playPageOne();
          }
          applyState(afterPageOne);
        } else {
          // Human player: switch to 'following' phase so they can click their card
          applyState({ ...s, phase: 'following', message: `${player.name} のターン（引いたカードを出してください）` });
        }
        return;
      }

      // Draw one more card
      const { newState, drawnCard } = drawOneCard(s);
      if (!drawnCard) {
        // No cards left to draw - play any card (shouldn't normally happen)
        applyState({ ...newState, phase: 'following' });
        return;
      }
      soundManager.playCardDraw();
      applyState(newState);
    }, 500);

    return () => clearTimeout(timer);
  }, [state.phase, state.drawnCardsThisTurn, state.drawingPlayerId, applyState]);

  // ── CPU turn automation ─────────────────────────────────────────────────
  useEffect(() => {
    const s = stateRef.current;

    // Only act on CPU phases
    if (s.phase !== 'leading' && s.phase !== 'following' && s.phase !== 'joker_suit_declare') return;
    const player = s.players[s.currentPlayerIndex];
    if (player.type !== 'cpu') return;

    const delay = 800 + Math.random() * 400;

    const timer = setTimeout(() => {
      const current = stateRef.current;
      if (current.phase !== 'leading' && current.phase !== 'following' && current.phase !== 'joker_suit_declare') return;
      const cp = current.players[current.currentPlayerIndex];
      if (cp.type !== 'cpu') return;

      try {
        if (current.phase === 'joker_suit_declare') {
          const suit = chooseCpuSuit(current);
          const next = declareJokerSuit(current, suit);
          applyState(next);
          return;
        }

        // Check if CPU needs to draw first (following but no playable card)
        if (current.phase === 'following' && !hasPlayableCard(cp, current.currentTrick)) {
          const drawing = startDrawing(current);
          applyState(drawing);
          return;
        }

        const cardId = chooseCpuCard(current);
        let nextState: GameState;
        if (current.phase === 'leading') {
          nextState = playLeadCard(current, cardId);
        } else {
          nextState = playFollowCard(current, cardId);
        }
        soundManager.playCardPlay();

        const afterPageOne = checkAndAutoPageOne(nextState);
        if (afterPageOne.message !== nextState.message) {
          soundManager.playPageOne();
        }
        applyState(afterPageOne);
      } catch (err) {
        console.error('[useGame] CPU action error:', err);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [state.phase, state.currentPlayerIndex, applyState]);

  // ── Trick result auto-advance ─────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'trick_result') return;

    soundManager.playTrickEnd();

    const timer = setTimeout(() => {
      const current = stateRef.current;
      if (current.phase !== 'trick_result') return;
      const next = advanceAfterTrickResult(current);
      if (next.phase === 'round_end' || next.phase === 'game_end') {
        soundManager.playRoundEnd();
      }
      applyState(next);
    }, 2000);

    return () => clearTimeout(timer);
  }, [state.phase, applyState]);

  // ── Auto page_one_pending for CPU ─────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'page_one_pending') return;
    const player = state.players[state.currentPlayerIndex];
    if (player.type !== 'cpu') return;

    // CPU auto-declares
    const timer = setTimeout(() => {
      const current = stateRef.current;
      if (current.phase !== 'page_one_pending') return;
      const cp = current.players[current.currentPlayerIndex];
      if (cp.type !== 'cpu') return;
      soundManager.playPageOne();
      const next = declarePageOne(current);
      applyState(next);
    }, 600);

    return () => clearTimeout(timer);
  }, [state.phase, state.currentPlayerIndex, applyState]);

  // ── Public actions ───────────────────────────────────────────────────

  const onPlayCard = useCallback((cardId: string) => {
    const s = stateRef.current;
    const player = s.players[s.currentPlayerIndex];
    if (player.type !== 'human') return;

    try {
      let nextState: GameState;
      if (s.phase === 'leading') {
        nextState = playLeadCard(s, cardId);
      } else if (s.phase === 'following') {
        nextState = playFollowCard(s, cardId);
      } else {
        return;
      }
      soundManager.playCardPlay();

      const afterPageOne = checkAndAutoPageOne(nextState);
      if (afterPageOne.message !== nextState.message) {
        soundManager.playPageOne();
      }
      applyState(afterPageOne);
    } catch (err) {
      console.error('[useGame] onPlayCard error:', err);
    }
  }, [applyState]);

  const onDeclareJokerSuit = useCallback((suit: Suit) => {
    const s = stateRef.current;
    if (s.phase !== 'joker_suit_declare') return;
    const next = declareJokerSuit(s, suit);
    applyState(next);
  }, [applyState]);

  const onDeclarePageOne = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'page_one_pending') return;
    soundManager.playPageOne();
    const next = declarePageOne(s);
    applyState(next);
  }, [applyState]);

  const onContinueAfterRound = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'round_end') {
      const next = gameStartNextRound(s);
      applyState(next);
    }
  }, [applyState]);

  const onResetGame = useCallback(() => {
    const s = stateRef.current;
    const fresh = initializeGame(
      s.settings,
      s.players.map((p) => ({ name: p.name, type: p.type }))
    );
    applyState(fresh);
  }, [applyState]);

  return {
    state,
    onPlayCard,
    onDeclareJokerSuit,
    onDeclarePageOne,
    onContinueAfterRound,
    onResetGame,
  };
}
