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
      className="flex min-h-11 items-center gap-2.5 text-[13px] font-semibold text-fg disabled:opacity-50"
    >
      Modo difícil
      <span
        aria-hidden
        className={`flex h-7 w-12 items-center rounded-full border-2 p-[3px] transition-colors ${
          on ? "border-ink bg-tape-red" : "border-surface-line bg-surface"
        }`}
      >
        <span
          className={`h-[18px] w-[18px] rounded-full bg-[#f4ead5] shadow-[0_2px_0_#000] transition-transform ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
