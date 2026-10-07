"use client";

import { gameDate } from "@/lib/game/date";
import { dailyProgress, dayScore, isDayFinished } from "@/lib/game/progress";
import { useGameState } from "@/lib/storage/game-store";

/** Stamp on the cassette label: "Hoje 3/5" when played, "Novo desafio" otherwise. */
export function TodayBadge({ category }: { category: string }) {
  const state = useGameState();
  if (!state) return null;

  const progress = dailyProgress(state, category, gameDate(new Date()));
  const answered = progress.rounds.filter((r) => r !== null).length;
  const done = isDayFinished(progress);
  const text = done
    ? `Hoje ${dayScore(progress)}/${progress.rounds.length}`
    : answered > 0
      ? `Em andamento ${answered}/${progress.rounds.length}`
      : "Novo desafio";

  return (
    <span className={`stamp ${done ? "border-paper-muted text-paper-muted" : "border-stamp text-stamp"}`}>
      {text}
    </span>
  );
}
