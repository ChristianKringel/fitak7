"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api/client";
import type { InfiniteRoundResponse } from "@/lib/api/types";
import { clipSeconds } from "@/lib/game/config";
import { categoryStats, recordInfiniteRound } from "@/lib/game/progress";
import { updateGameState, useGameState } from "@/lib/storage/game-store";

import { RoundPanel, type RoundResult } from "./RoundPanel";
import { InfiniteStatsView } from "./StatsView";
import { card, primaryButton, secondaryButton } from "./styles";

/** The server only looks at the most recent tokens. */
const MAX_RECENT = 300;

interface InfiniteGameProps {
  category: string;
}

export function InfiniteGame({ category }: InfiniteGameProps) {
  const state = useGameState();
  const [round, setRound] = useState<InfiniteRoundResponse | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState({ played: 0, correct: 0 });
  // Tokens of every round shown in this session, so songs don't repeat.
  const tokens = useRef<string[]>([]);
  const prefetched = useRef<Promise<InfiniteRoundResponse> | null>(null);

  const requestRound = useCallback(() => {
    const promise = api.infiniteRound(category, tokens.current.slice(-MAX_RECENT));
    promise.then((r) => tokens.current.push(r.token)).catch(() => undefined);
    return promise;
  }, [category]);

  const showNext = useCallback(async () => {
    const next = prefetched.current ?? requestRound();
    prefetched.current = null;
    setError(null);
    try {
      const r = await next;
      setResult(null);
      setRound(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado.");
    }
  }, [requestRound]);

  useEffect(() => {
    let cancelled = false;
    requestRound().then(
      (r) => !cancelled && setRound(r),
      (e: Error) => !cancelled && setError(e.message),
    );
    return () => {
      cancelled = true;
    };
  }, [requestRound]);

  if (!state || (!round && !error)) {
    return <p className="py-16 text-center text-stone-500">Preparando a primeira música…</p>;
  }
  if (!round) {
    return (
      <div className={`${card} flex flex-col items-center gap-3 text-center`}>
        <p>{error}</p>
        <button type="button" className={primaryButton} onClick={showNext}>
          Tentar de novo
        </button>
      </div>
    );
  }

  const stats = categoryStats(state, category).infinite;
  const hardMode = state.preferences.hardMode;
  const current = round;

  async function guess(choice: number) {
    const response = await api.infiniteGuess(category, current.token, choice);
    updateGameState((s) => recordInfiniteRound(s, category, response.correct));
    setSession((s) => ({ played: s.played + 1, correct: s.correct + (response.correct ? 1 : 0) }));
    setResult({ choice, ...response });
    // Fetch the next round while the player looks at the answer.
    prefetched.current = requestRound();
    prefetched.current.catch(() => undefined);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Counter label="Sequência" value={stats.currentStreak} accent />
        <Counter label="Recorde" value={stats.maxStreak} />
        <Counter label="Nesta sessão" value={`${session.correct}/${session.played}`} />
      </div>

      <RoundPanel
        key={current.token}
        heading={`Música ${session.played + (result ? 0 : 1)} desta sessão`}
        options={current.options}
        audioSrc={api.infiniteAudioUrl(category, current.token)}
        clipSeconds={clipSeconds(hardMode)}
        result={result}
        onGuess={guess}
        onAudioError={
          <button type="button" className={secondaryButton} onClick={showNext}>
            Pular esta música
          </button>
        }
        after={
          <button type="button" className={primaryButton} onClick={showNext}>
            Próxima música
          </button>
        }
      />
      {error && (
        <p role="alert" className="text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <InfiniteStatsView stats={stats} />
      <Link href={`/${category}`} className={secondaryButton}>
        Ir para o desafio diário
      </Link>
    </div>
  );
}

function Counter({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`${card} flex flex-col items-center gap-0.5 px-2 py-3`}>
      <span
        className={`text-2xl font-bold tabular-nums ${accent ? "text-emerald-700 dark:text-emerald-400" : ""}`}
      >
        {value}
      </span>
      <span className="text-xs text-stone-600 dark:text-stone-400">{label}</span>
    </div>
  );
}
