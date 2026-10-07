"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/lib/api/client";
import type { DailyChallengeResponse } from "@/lib/api/types";
import { clipSeconds } from "@/lib/game/config";
import { formatGameDate } from "@/lib/game/date";
import {
  categoryStats,
  dailyProgress,
  dayScore,
  recordDailyRound,
  type DailyProgress,
} from "@/lib/game/progress";
import { shareText } from "@/lib/game/share";
import { updateGameState, useGameState } from "@/lib/storage/game-store";

import { AnswerCard } from "./AnswerCard";
import { Countdown } from "./Countdown";
import { Cassette } from "./Cassette";
import { RoundPanel } from "./RoundPanel";
import { ShareButton } from "./ShareButton";
import { DailyStatsView } from "./StatsView";
import { card, paperLabel, primaryButton, secondaryButton } from "./styles";

interface DailyGameProps {
  category: string;
  categoryName: string;
  /** Cassette body color of the category. */
  color: string;
}

export function DailyGame({ category, categoryName, color }: DailyGameProps) {
  const state = useGameState();
  const [challenge, setChallenge] = useState<DailyChallengeResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Round the player is looking at after answering it; null = next unanswered.
  const [viewing, setViewing] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.daily(category).then(
      (data) => !cancelled && setChallenge(data),
      (error: Error) => !cancelled && setLoadError(error.message),
    );
    return () => {
      cancelled = true;
    };
  }, [category]);

  if (loadError) {
    return <p className={`${card} text-center`}>{loadError}</p>;
  }
  if (!state || !challenge) {
    return <p className="eyebrow py-16 text-center text-muted">Rebobinando a fita…</p>;
  }

  const { date, rounds } = challenge;
  const progress = dailyProgress(state, category, date, rounds.length);
  const nextUnanswered = progress.rounds.findIndex((r) => r === null);
  const index = viewing ?? nextUnanswered;

  if (index === -1) {
    return (
      <DailyResult
        category={category}
        color={color}
        categoryName={categoryName}
        date={date}
        progress={progress}
        stats={categoryStats(state, category).daily}
      />
    );
  }

  const record = progress.rounds[index];
  const hardMode = state.preferences.hardMode;

  async function guess(choice: number) {
    const response = await api.dailyGuess(category, index, choice, date);
    updateGameState((s) =>
      recordDailyRound(s, {
        category,
        date,
        index,
        totalRounds: rounds.length,
        record: {
          choice,
          answerIndex: response.answerIndex,
          correct: response.correct,
          hard: hardMode,
          answer: response.answer,
        },
      }),
    );
    setViewing(index);
  }

  return (
    <div className="flex flex-col gap-4">
      <RoundDots progress={progress} current={index} />
      <RoundPanel
        key={`${date}-${index}`}
        heading={`Música ${index + 1} de ${rounds.length} · ${formatGameDate(date)}`}
        color={color}
        options={rounds[index].options}
        audioSrc={api.dailyAudioUrl(category, index, date)}
        clipSeconds={clipSeconds(hardMode)}
        result={record}
        onGuess={guess}
        after={
          <button type="button" className={primaryButton} onClick={() => setViewing(null)}>
            {nextUnanswered === -1 ? "Ver resultado" : "Próxima música"}
          </button>
        }
      />
    </div>
  );
}

function RoundDots({ progress, current }: { progress: DailyProgress; current: number }) {
  return (
    <ol className="flex gap-2" aria-label="Progresso do desafio">
      {progress.rounds.map((round, i) => (
        <li
          key={i}
          aria-label={`Música ${i + 1}: ${round ? (round.correct ? "acertou" : "errou") : "não jogada"}`}
          className={`h-3 flex-1 rounded-full border-2 ${
            round
              ? round.correct
                ? "border-ink bg-tape-green"
                : "border-ink bg-tape-red"
              : i === current
                ? "border-ink bg-tape-yellow"
                : "border-surface-line bg-surface"
          }`}
        />
      ))}
    </ol>
  );
}

interface DailyResultProps {
  category: string;
  color: string;
  categoryName: string;
  date: string;
  progress: DailyProgress;
  stats: ReturnType<typeof categoryStats>["daily"];
}

function DailyResult({ category, color, categoryName, date, progress, stats }: DailyResultProps) {
  const rounds = progress.rounds.flatMap((r) => (r ? [r] : []));
  const score = dayScore(progress);
  const text = shareText({
    categoryName,
    date,
    results: rounds.map((r) => r.correct),
    hardMode: rounds.every((r) => r.hard),
    url: typeof window === "undefined" ? undefined : `${window.location.origin}/${category}`,
  });

  return (
    <div className="flex flex-col gap-5">
      <Cassette color={color}>
        <div className={`${paperLabel} flex flex-col items-center gap-2 px-3.5 pt-3 pb-4 text-center`}>
          <p className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
            Desafio de {formatGameDate(date)}
          </p>
          <p className="font-marker text-6xl leading-none tabular-nums">
            {score}/{rounds.length}
          </p>
          <div className="flex gap-1.5" aria-hidden>
            {rounds.map((r, i) => (
              <span
                key={i}
                className={`h-6 w-6 rounded-md border-2 border-ink ${r.correct ? "bg-tape-green" : "bg-tape-red"}`}
              />
            ))}
          </div>
        </div>
      </Cassette>

      <ShareButton text={text} />
      <Countdown />

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-accent">Lado A</h2>
        <ol className={`${card} flex flex-col gap-3`}>
          {rounds.map((round, i) => (
            <li key={i} className="flex items-center gap-3">
              <span
                aria-label={round.correct ? "Acertou" : "Errou"}
                className={`h-3 w-3 shrink-0 rounded-full border-2 border-ink ${
                  round.correct ? "bg-tape-green" : "bg-tape-red"
                }`}
              />
              <AnswerCard answer={round.answer} compact />
            </li>
          ))}
        </ol>
      </section>

      <DailyStatsView stats={stats} highlight={score} />

      <Link href={`/${category}/infinito`} className={secondaryButton}>
        Continuar no modo infinito
      </Link>
    </div>
  );
}
