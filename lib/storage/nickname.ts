"use client";

import { useSyncExternalStore } from "react";

// Last nickname used in a room, to prefill the next one. A convenience only:
// storage may be unavailable, and then the field just starts empty.

const NICKNAME_KEY = "nickname:v1";

export function loadNickname(): string {
  try {
    return window.localStorage.getItem(NICKNAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveNickname(name: string): void {
  try {
    window.localStorage.setItem(NICKNAME_KEY, name);
  } catch {
    // Ignore: private mode or blocked storage.
  }
}

const noSubscription = () => () => {};

/** The saved nickname; "" on the server and during hydration. */
export function useSavedNickname(): string {
  return useSyncExternalStore(noSubscription, loadNickname, () => "");
}
