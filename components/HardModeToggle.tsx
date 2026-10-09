"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { HARD_CLIP_SECONDS, NORMAL_CLIP_SECONDS } from "@/lib/game/config";
import { setHardMode } from "@/lib/game/progress";
import { updateGameState, useGameState } from "@/lib/storage/game-store";

import { paperLabel } from "./styles";

/** Multiplayer rooms have their own mode, chosen when the room is created. */
function isMultiplayerPath(pathname: string): boolean {
  return pathname === "/multiplayer" || pathname.startsWith("/sala/");
}

export function HardModeToggle() {
  const pathname = usePathname();
  const state = useGameState();
  const on = state?.preferences.hardMode ?? false;
  if (isMultiplayerPath(pathname)) return null;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={!state}
        onClick={() => updateGameState((s) => setHardMode(s, !on))}
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
      <HardModeHelp />
    </div>
  );
}

/** "?" button with a popover explaining hard mode. Opens on tap, since hover doesn't exist on mobile. */
function HardModeHelp() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="O que é o modo difícil?"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-8 items-center justify-center"
      >
        <span
          aria-hidden
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface-line text-[12px] font-extrabold text-muted"
        >
          ?
        </span>
      </button>
      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Modo difícil"
          className={`${paperLabel} absolute top-full right-0 z-20 mt-1 w-64 p-3.5 text-[13px] leading-snug shadow-[0_4px_0_var(--key-shadow)]`}
        >
          <p className="font-extrabold">Modo difícil</p>
          <p className="mt-1">
            Você ouve só {HARD_CLIP_SECONDS} segundos de cada música, em vez de {NORMAL_CLIP_SECONDS}. Vale para o
            desafio diário e para o modo infinito.
          </p>
        </div>
      )}
    </div>
  );
}
