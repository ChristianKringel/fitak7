"use client";

import { useEffect, useState } from "react";

import { msUntilNextGameDay } from "@/lib/game/date";

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Time left until the next daily challenge (midnight in São Paulo). */
export function Countdown() {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setMs(msUntilNextGameDay(new Date()));
    const id = setInterval(update, 1000);
    // First tick right away, without waiting a second.
    const first = setTimeout(update, 0);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, []);

  return (
    <p className="text-center text-sm text-muted">
      Próxima fita em{" "}
      <span className="font-mono font-bold text-fg tabular-nums">
        {ms === null ? "--:--:--" : format(ms)}
      </span>
    </p>
  );
}
