"use client";

import { HARD_CLIP_SECONDS } from "@/lib/game/config";
import { setHardMode } from "@/lib/game/progress";
import { updateGameState, useGameState } from "@/lib/storage/game-store";

export function HardModeToggle() {
  const state = useGameState();
  const on = state?.preferences.hardMode ?? false;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={!state}
      onClick={() => updateGameState((s) => setHardMode(s, !on))}
      title={`Trechos de ${HARD_CLIP_SECONDS}s`}
      className="flex items-center gap-2 rounded-full py-1 pl-3 pr-1 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 disabled:opacity-50 dark:text-stone-400 dark:hover:text-stone-100"
    >
      Modo difícil
      <span
        aria-hidden
        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
          on ? "bg-red-600" : "bg-stone-300 dark:bg-stone-700"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
