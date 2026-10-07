"use client";

import { useSyncExternalStore } from "react";

import { parseGameState, type GameState } from "@/lib/game/progress";

// Player state in localStorage under a versioned key. Reads fall back to
// defaults when the key is missing, corrupted or storage is unavailable.

export const STORAGE_KEY = "game:v1";

let current: GameState | null = null;
const listeners = new Set<() => void>();

function readStorage(): GameState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return parseGameState(raw ? JSON.parse(raw) : null);
  } catch {
    return parseGameState(null);
  }
}

function getSnapshot(): GameState {
  current ??= readStorage();
  return current;
}

/** null on the server and during hydration: storage is browser-only. */
function getServerSnapshot(): null {
  return null;
}

function notify() {
  for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
  // Another tab changed the state.
  if (event.key === STORAGE_KEY) {
    current = readStorage();
    notify();
  }
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

export function updateGameState(update: (state: GameState) => GameState): void {
  const next = update(getSnapshot());
  if (next === current) return;
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode or full storage: keep playing with in-memory state.
  }
  notify();
}

/** Current player state, or null before hydration. */
export function useGameState(): GameState | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
