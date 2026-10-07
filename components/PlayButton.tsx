"use client";

import type { ClipPlayer } from "@/lib/audio/use-clip-player";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface PlayButtonProps {
  player: ClipPlayer;
  src: string;
  /** Clip length in seconds; null plays the whole preview. */
  seconds: number | null;
  /** Inline: a small row button, used after the answer is revealed. */
  variant?: "large" | "inline";
}

export function PlayButton({ player, src, seconds, variant = "large" }: PlayButtonProps) {
  const { status, position, limit } = player;
  const active = status === "playing" || status === "loading";
  const total = limit ?? seconds ?? 30;
  const progress = Math.min(1, position / total);

  const label =
    status === "error"
      ? "Tentar de novo"
      : active
        ? "Pausar"
        : seconds === null
          ? "Ouvir prévia completa"
          : `Ouvir trecho de ${seconds}s`;

  const toggle = () => (active ? player.stop() : player.play(src, seconds));

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={toggle}
        className="relative flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-xl border-2 border-stone-300 px-4 text-sm font-semibold dark:border-stone-700"
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 bg-emerald-600/15"
          style={{ width: `${progress * 100}%` }}
        />
        <span aria-hidden className="relative w-4 text-emerald-700 dark:text-emerald-400">
          {status === "loading" ? "…" : active ? "❚❚" : "▶"}
        </span>
        <span className="relative">{label}</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className="relative grid h-32 w-32 place-items-center rounded-full bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-transform active:scale-95 dark:bg-emerald-600"
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        {status === "loading" ? (
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        ) : active ? (
          <svg viewBox="0 0 24 24" className="h-12 w-12" fill="currentColor" aria-hidden>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="ml-1 h-12 w-12" fill="currentColor" aria-hidden>
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
        )}
      </button>
      <p className="text-sm text-stone-600 dark:text-stone-400" aria-live="polite">
        {status === "error"
          ? "Não foi possível tocar o trecho."
          : `${position.toFixed(1)}s / ${total}s`}
      </p>
    </div>
  );
}
