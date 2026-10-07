"use client";

import type { ClipPlayer } from "@/lib/audio/use-clip-player";

import { inkButton } from "./styles";

interface PlayButtonProps {
  player: ClipPlayer;
  src: string;
  /** Clip length in seconds; null plays the whole preview. */
  seconds: number | null;
}

/** Deck key that plays/pauses the clip. */
export function PlayButton({ player, src, seconds }: PlayButtonProps) {
  const { status } = player;
  const active = status === "playing" || status === "loading";

  const label =
    status === "error"
      ? "Tentar de novo"
      : active
        ? "Pausar"
        : seconds === null
          ? "Ouvir prévia completa"
          : `Ouvir trecho de ${seconds}s`;

  return (
    <button
      type="button"
      onClick={() => (active ? player.stop() : player.play(src, seconds))}
      className={`${inkButton} w-full`}
    >
      {status === "loading" ? (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-tape-yellow/30 border-t-tape-yellow"
        />
      ) : active ? (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <rect x="2" y="1.5" width="3.5" height="11" rx="1" fill="#FFD21F" />
          <rect x="8.5" y="1.5" width="3.5" height="11" rx="1" fill="#FFD21F" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path d="M3 1.5l9.5 5.5L3 12.5z" fill="#FFD21F" />
        </svg>
      )}
      {label}
    </button>
  );
}
