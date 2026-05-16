'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState } from '@/types/buta';
import { playCard, startNextRound as gameStartNextRound, initializeGame } from '@/lib/buta/gameLogic';
import { getCpuDecision } from '@/lib/buta/cpuAI';
import { soundManager } from '@/lib/buta/sounds';
import { updateGameState, subscribeToRoom } from '@/lib/buta/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseGameOptions {
  playerId: string;
  roomId?: string;
}

interface UseGameReturn {
  state: GameState;
  isAnimating: boolean;
  performAction: (
    source: 'circle' | 'hand',
    circleIndex?: number,
    handCardId?: string,
  ) => void;
  startNextRound: () => void;
  resetGame: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGame(
  initialState: GameState,
  { playerId, roomId }: UseGameOptions,
): UseGameReturn {
  const [state, setState] = useState<GameState>(initialState);
  const [isAnimating, setIsAnimating] = useState(false);
  const animatingRef = useRef(false);

  // Always keep a ref to the latest state so setTimeout callbacks don't use stale closures
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ── Online sync: subscribe to room changes ──────────────────────────────
  useEffect(() => {
    if (!roomId) return;

    const channel = subscribeToRoom(roomId, (room) => {
      if (room.gameState) {
        setState(room.gameState);
      }
    });

    return () => {
      channel?.unsubscribe?.();
    };
  }, [roomId]);

  // ── CPU automation ──────────────────────────────────────────────────────
  // NOTE: do NOT gate on animatingRef here — the effect fires right after
  // setState (while animation is still running), and if we return early the
  // effect will never re-fire once the animation finishes, freezing the CPU.
  // performActionInternal already guards itself with animatingRef, and the
  // minimum timer delay (800 ms) is longer than the animation window (600 ms).
  useEffect(() => {
    if (state.phase !== 'playing') return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    if (currentPlayer.type !== 'cpu') return;

    const delay = 800 + Math.random() * 400;
    const timer = setTimeout(() => {
      const latest = stateRef.current;
      if (latest.phase !== 'playing') return;
      if (latest.players[latest.currentPlayerIndex].type !== 'cpu') return;
      try {
        const decision = getCpuDecision(latest);
        performActionInternal(latest, decision.source, decision.circleIndex, decision.handCardId);
      } catch (err) {
        console.error('[useGame] CPU decision error:', err);
      }
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentPlayerIndex, state.phase]);

  // ── Core action performer ───────────────────────────────────────────────

  const performActionInternal = useCallback(
    (
      currentState: GameState,
      source: 'circle' | 'hand',
      circleIndex?: number,
      handCardId?: string,
    ) => {
      if (currentState.phase !== 'playing') return;
      if (animatingRef.current) return;

      animatingRef.current = true;
      setIsAnimating(true);

      // Play pre-action sound
      if (source === 'circle') {
        soundManager.playCardFlip();
      }

      let result;
      try {
        result = playCard(currentState, source, circleIndex, handCardId);
      } catch (err) {
        console.error('[useGame] playCard error:', err);
        animatingRef.current = false;
        setIsAnimating(false);
        return;
      }

      // Play post-action sounds
      if (result.isPenalty) {
        soundManager.playPenalty();
      } else {
        soundManager.playCardPlace();
      }

      // Handle phase transition sounds
      const newPhase = result.newState.phase;
      if (newPhase === 'round_end') {
        setTimeout(() => soundManager.playRoundEnd(), 300);
      } else if (newPhase === 'game_end') {
        setTimeout(() => soundManager.playWin(), 300);
      }

      setState(result.newState);

      // Sync to Firebase if online game
      if (roomId) {
        updateGameState(roomId, result.newState).catch((err) =>
          console.error('[useGame] updateGameState error:', err),
        );
      }

      // Clear animation state after a brief window
      setTimeout(() => {
        animatingRef.current = false;
        setIsAnimating(false);
      }, 600);
    },
    [roomId],
  );

  // ── Public action (always uses latest state via ref) ────────────────────
  const performAction = useCallback(
    (source: 'circle' | 'hand', circleIndex?: number, handCardId?: string) => {
      // Only the designated human player can perform actions
      const currentState = stateRef.current;
      const currentPlayer = currentState.players[currentState.currentPlayerIndex];
      if (currentPlayer.type !== 'human') return;
      if (currentPlayer.id !== playerId && currentPlayer.id.startsWith('player-')) {
        // Allow action for local human player in CPU game (player-0 is always human-controlled)
      }
      performActionInternal(currentState, source, circleIndex, handCardId);
    },
    [performActionInternal, playerId],
  );

  // ── Round transition ────────────────────────────────────────────────────
  const startNextRound = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== 'round_end') return prev;
      const nextState = gameStartNextRound(prev);

      if (roomId) {
        updateGameState(roomId, nextState).catch(console.error);
      }

      return nextState;
    });
  }, [roomId]);

  // ── Full reset ──────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    const fresh = initializeGame(initialState.settings, initialState.players.map((p) => ({
      name: p.name,
      type: p.type,
      cpuDifficulty: p.cpuDifficulty ?? 'normal',
    })));
    setState(fresh);

    if (roomId) {
      updateGameState(roomId, fresh).catch(console.error);
    }
  }, [initialState, roomId]);

  return { state, isAnimating, performAction, startNextRound, resetGame };
}
