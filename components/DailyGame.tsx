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
import { RoundPanel } from "./RoundPanel";
import { ShareButton } from "./ShareButton";
import { DailyStatsView } from "./StatsView";
import { card, primaryButton, secondaryButton } from "./styles";

interface DailyGameProps {
  category: string;
  categoryName: string;
}

export function DailyGame({ category, categoryName }: DailyGameProps) {
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
    return <p className="py-16 text-center text-stone-500">Carregando o desafio de hoje…</p>;
  }

  const { date, rounds } = challenge;
  const progress = dailyProgress(state, category, date, rounds.length);
  const nextUnanswered = progress.rounds.findIndex((r) => r === null);
  const index = viewing ?? nextUnanswered;

  if (index === -1) {
    return (
      <DailyResult
        category={category}
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
    <ol className="flex justify-center gap-2" aria-label="Progresso do desafio">
      {progress.rounds.map((round, i) => (
        <li
          key={i}
          aria-label={`Música ${i + 1}: ${round ? (round.correct ? "acertou" : "errou") : "não jogada"}`}
          className={`h-2.5 w-8 rounded-full ${
            round
              ? round.correct
                ? "bg-emerald-600"
                : "bg-red-600"
              : i === current
                ? "bg-stone-500"
                : "bg-stone-300 dark:bg-stone-700"
          }`}
        />
      ))}
    </ol>
  );
}

interface DailyResultProps {
  category: string;
  categoryName: string;
  date: string;
  progress: DailyProgress;
  stats: ReturnType<typeof categoryStats>["daily"];
}

function DailyResult({ category, categoryName, date, progress, stats }: DailyResultProps) {
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
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <p className="text-sm text-stone-600 dark:text-stone-400">Desafio de {formatGameDate(date)}</p>
        <p className="text-5xl font-bold tabular-nums">
          {score}/{rounds.length}
        </p>
        <p className="text-3xl tracking-widest" aria-hidden>
          {rounds.map((r) => (r.correct ? "🟩" : "🟥")).join("")}
        </p>
      </div>

      <ShareButton text={text} />
      <Countdown />

      <ol className={`${card} flex flex-col gap-3`}>
        {rounds.map((round, i) => (
          <li key={i} className="flex items-center gap-3">
            <span aria-label={round.correct ? "Acertou" : "Errou"}>{round.correct ? "🟩" : "🟥"}</span>
            <AnswerCard answer={round.answer} compact />
          </li>
        ))}
      </ol>

      <DailyStatsView stats={stats} highlight={score} />

      <Link href={`/${category}/infinito`} className={secondaryButton}>
        Continuar no modo infinito
      </Link>
    </div>
  );
}
