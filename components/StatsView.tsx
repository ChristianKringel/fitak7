import type { CategoryStats } from "@/lib/game/progress";
import { ROUNDS_PER_DAY } from "@/lib/game/schedule";

import { card } from "./styles";

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-center font-mono text-[10px] font-bold tracking-[0.08em] text-muted uppercase">
        {label}
      </span>
    </div>
  );
}

function percent(correct: number, total: number): string {
  return total === 0 ? "–" : `${Math.round((correct / total) * 100)}%`;
}

export function DailyStatsView({ stats, highlight }: { stats: CategoryStats["daily"]; highlight?: number }) {
  const max = Math.max(1, ...stats.distribution);
  return (
    <div className={`${card} flex flex-col gap-4`}>
      <h3 className="eyebrow text-accent">Estatísticas do diário</h3>
      <div className="grid grid-cols-4 gap-2">
        <Stat value={stats.played} label="Jogos" />
        <Stat value={percent(stats.correct, stats.played * ROUNDS_PER_DAY)} label="Acertos" />
        <Stat value={stats.currentStreak} label="Dias seguidos" />
        <Stat value={stats.maxStreak} label="Recorde" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[10px] font-bold tracking-[0.08em] text-muted uppercase">
          Distribuição de acertos
        </p>
        {stats.distribution.map((count, score) => (
          <div key={score} className="flex items-center gap-2 text-sm">
            <span className="w-3 text-right font-mono tabular-nums">{score}</span>
            <div className="flex-1">
              <div
                className={`min-w-7 rounded-md border-2 border-ink px-1.5 py-0.5 text-right font-mono text-xs font-bold text-ink tabular-nums ${
                  score === highlight ? "bg-tape-yellow" : "bg-tape-beige"
                }`}
                style={{ width: `${(count / max) * 100}%` }}
              >
                {count}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InfiniteStatsView({ stats }: { stats: CategoryStats["infinite"] }) {
  return (
    <div className={`${card} flex flex-col gap-4`}>
      <h3 className="eyebrow text-accent">Estatísticas do infinito</h3>
      <div className="grid grid-cols-4 gap-2">
        <Stat value={stats.played} label="Músicas" />
        <Stat value={percent(stats.correct, stats.played)} label="Acertos" />
        <Stat value={stats.currentStreak} label="Sequência" />
        <Stat value={stats.maxStreak} label="Recorde" />
      </div>
    </div>
  );
}
