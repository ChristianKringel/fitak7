"use client";

import { gameDate } from "@/lib/game/date";
import { dailyProgress, dayScore, isDayFinished } from "@/lib/game/progress";
import { useGameState } from "@/lib/storage/game-store";

/** "Hoje: 3/5" when today's challenge was played, "Novo desafio" otherwise. */
export function TodayBadge({ category }: { category: string }) {
  const state = useGameState();
  if (!state) return null;

  const progress = dailyProgress(state, category, gameDate(new Date()));
  const answered = progress.rounds.filter((r) => r !== null).length;
  const text = isDayFinished(progress)
    ? `Hoje: ${dayScore(progress)}/${progress.rounds.length}`
    : answered > 0
      ? `Em andamento: ${answered}/${progress.rounds.length}`
      : "Novo desafio";
  const done = isDayFinished(progress);

  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        done
          ? "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
          : "bg-yellow-300 text-stone-900"
      }`}
    >
      {text}
    </span>
  );
}
