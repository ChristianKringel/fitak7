"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { api } from "@/lib/api/client";
import type { HardcoreChallengeResponse } from "@/lib/api/types";
import { useClipPlayer } from "@/lib/audio/use-clip-player";
import { clipSeconds } from "@/lib/game/config";
import { formatGameDate } from "@/lib/game/date";
import { HARDCORE_MAX_SCORE } from "@/lib/game/hardcore";
import {
  categoryStats,
  hardcoreDayScore,
  hardcoreProgress,
  hardcoreRoundPoints,
  isHardcoreRoundOver,
  recordHardcoreStep,
  type HardcoreProgress,
  type HardcoreRoundRecord,
} from "@/lib/game/progress";
import { hardcoreShareText } from "@/lib/game/share";
import { updateGameState, useGameState } from "@/lib/storage/game-store";

import { AnswerCard } from "./AnswerCard";
import { Cassette } from "./Cassette";
import { Countdown } from "./Countdown";
import { OptionList } from "./OptionList";
import { PlayButton } from "./PlayButton";
import { ShareButton } from "./ShareButton";
import { DailyStatsView } from "./StatsView";
import { card, paperLabel, primaryButton, secondaryButton } from "./styles";
import { TapeWindow } from "./TapeWindow";

interface HardcoreGameProps {
  category: string;
  categoryName: string;
  /** Cassette body color of the category. */
  color: string;
}

/** By the points of a round: 0 (wrong artist), 1 (artist only), 2. */
export const POINT_COLORS = ["bg-tape-red", "bg-tape-yellow", "bg-tape-green"];
export const POINT_LABELS = ["errou o artista", "só o artista", "acertou tudo"];

export function HardcoreGame({ category, categoryName, color }: HardcoreGameProps) {
  const state = useGameState();
  const [challenge, setChallenge] = useState<HardcoreChallengeResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Round the player is looking at after finishing it; null = next open one.
  const [viewing, setViewing] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.hardcore(category).then(
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
  const progress = hardcoreProgress(state, category, date, rounds.length);
  const nextOpen = progress.rounds.findIndex((r) => !isHardcoreRoundOver(r));
  const index = viewing ?? nextOpen;

  if (index === -1) {
    return (
      <HardcoreResult
        category={category}
        color={color}
        categoryName={categoryName}
        date={date}
        progress={progress}
        stats={categoryStats(state, category).hardcore}
      />
    );
  }

  const hardMode = state.preferences.hardMode;
  const step = { category, date, index, totalRounds: rounds.length, hard: hardMode };

  async function guessArtist(choice: number) {
    const response = await api.hardcoreArtist(category, index, choice, date);
    updateGameState((s) =>
      recordHardcoreStep(s, {
        ...step,
        step: "artist",
        choice,
        answerIndex: response.answerIndex,
        songs: response.correct ? response.songs : null,
        answer: response.correct ? null : response.answer,
      }),
    );
    if (!response.correct) setViewing(index);
  }

  async function guessSong(choice: number) {
    const response = await api.hardcoreGuess(category, index, choice, date);
    updateGameState((s) =>
      recordHardcoreStep(s, {
        ...step,
        step: "song",
        choice,
        answerIndex: response.answerIndex,
        answer: response.answer,
      }),
    );
    setViewing(index);
  }

  return (
    <div className="flex flex-col gap-4">
      <RoundDots progress={progress} current={index} />
      <HardcoreRoundPanel
        key={`${date}-${index}`}
        heading={`Música ${index + 1} de ${rounds.length} · ${formatGameDate(date)}`}
        color={color}
        artists={rounds[index].artists}
        clipStart={rounds[index].clipStart}
        audioSrc={api.hardcoreAudioUrl(category, index, date)}
        clipSeconds={clipSeconds(hardMode)}
        record={progress.rounds[index]}
        onGuessArtist={guessArtist}
        onGuessSong={guessSong}
        after={
          <button type="button" className={primaryButton} onClick={() => setViewing(null)}>
            {nextOpen === -1 ? "Ver resultado" : "Próxima música"}
          </button>
        }
      />
    </div>
  );
}

function RoundDots({ progress, current }: { progress: HardcoreProgress; current: number }) {
  return (
    <ol className="flex gap-2" aria-label="Progresso do desafio">
      {progress.rounds.map((round, i) => {
        const over = isHardcoreRoundOver(round);
        const points = hardcoreRoundPoints(round);
        return (
          <li
            key={i}
            aria-label={`Música ${i + 1}: ${over ? POINT_LABELS[points] : "não jogada"}`}
            className={`h-3 flex-1 rounded-full border-2 ${
              over
                ? `border-ink ${POINT_COLORS[points]}`
                : i === current
                  ? "border-ink bg-tape-beige"
                  : "border-surface-line bg-surface"
            }`}
          />
        );
      })}
    </ol>
  );
}

interface HardcoreRoundPanelProps {
  heading: ReactNode;
  color: string;
  artists: string[];
  clipStart: number;
  audioSrc: string;
  clipSeconds: number;
  record: HardcoreRoundRecord | null;
  /** Send the guess; throw with a user-facing message on failure. */
  onGuessArtist: (choice: number) => Promise<void>;
  onGuessSong: (choice: number) => Promise<void>;
  /** Shown after the reveal. */
  after: ReactNode;
  /**
   * Load the clip as soon as the round shows up. Off in rooms, where the
   * first audio request starts the round's clock.
   */
  preload?: boolean;
}

/** A round in two steps: the artist, then (if right) the song. */
export function HardcoreRoundPanel(props: HardcoreRoundPanelProps) {
  const {
    heading,
    color,
    artists,
    clipStart,
    audioSrc,
    clipSeconds,
    record,
    onGuessArtist,
    onGuessSong,
    after,
    preload = true,
  } = props;
  const player = useClipPlayer();
  const { prepare, reset } = player;
  const [pending, setPending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preload) prepare(audioSrc);
  }, [audioSrc, prepare, preload]);

  const over = isHardcoreRoundOver(record);
  const songStep = record !== null && !over;

  async function choose(choice: number) {
    setPending(choice);
    setError(null);
    try {
      // The clip keeps playing from step 1 to step 2.
      if (songStep) await onGuessSong(choice);
      else await onGuessArtist(choice);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo deu errado. Tente de novo.");
    } finally {
      setPending(null);
    }
  }

  // Stops the clip once the round is over, at either step.
  useEffect(() => {
    if (over) reset();
  }, [over, reset]);

  const options = record?.songs
    ? record.songs.map((title) => ({ title }))
    : artists.map((name) => ({ title: name }));
  const reveal =
    over && record
      ? record.song
        ? record.song
        : { choice: record.artistChoice, answerIndex: record.artistAnswerIndex }
      : null;

  const seconds = over ? null : clipSeconds;
  const total = player.limit ?? seconds ?? 30;
  const progress = Math.min(1, player.position / total);
  const points = hardcoreRoundPoints(record);
  const rightArtist = record ? artists[record.artistAnswerIndex] : null;

  return (
    <section className="flex flex-col gap-6">
      <Cassette color={color}>
        <div className={`${paperLabel} flex flex-col gap-2 px-3.5 pt-3 pb-3.5`}>
          <p className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase">{heading}</p>
          {over && record?.answer ? (
            <>
              <p
                role="status"
                className={`border-b-[1.5px] border-paper-line pb-1 font-marker text-[30px] leading-[1.1] ${
                  points === 2 ? "text-tape-green" : "text-stamp"
                }`}
              >
                {points === 2 ? "Acertou tudo!" : points === 1 ? "Só o artista!" : "Errou o artista!"}
              </p>
              <AnswerCard answer={record.answer} />
            </>
          ) : (
            <>
              <p className="border-b-[1.5px] border-paper-line pb-1 font-marker text-[30px] leading-[1.1]">
                {songStep ? "E a música?" : "Quem canta?"}
              </p>
              <p className="font-mono text-[11px] font-bold tracking-[0.08em] text-paper-muted uppercase">
                {songStep ? `✓ ${rightArtist} · etapa 2 de 2` : "Etapa 1 de 2 · trecho de um ponto aleatório"}
              </p>
            </>
          )}
          <TapeWindow className="mt-1" progress={progress} spinning={player.status === "playing"}>
            <span aria-live="polite">
              {player.status === "error"
                ? "Não foi possível tocar"
                : `${player.position.toFixed(1)}s / ${total}s`}
            </span>
          </TapeWindow>
        </div>
        <PlayButton player={player} src={audioSrc} seconds={seconds} start={over ? 0 : clipStart} />
      </Cassette>

      {over && after}

      <div className="flex flex-col gap-2">
        <OptionList
          options={options}
          reveal={reveal}
          disabled={pending !== null}
          pendingChoice={pending}
          onChoose={choose}
        />
        {error && (
          <p role="alert" className="text-center text-sm font-semibold text-tape-red">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

interface HardcoreResultProps {
  category: string;
  color: string;
  categoryName: string;
  date: string;
  progress: HardcoreProgress;
  stats: ReturnType<typeof categoryStats>["hardcore"];
}

function HardcoreResult({ category, color, categoryName, date, progress, stats }: HardcoreResultProps) {
  const rounds = progress.rounds.flatMap((r) => (r?.answer ? [{ record: r, answer: r.answer }] : []));
  const points = rounds.map((r) => hardcoreRoundPoints(r.record));
  const score = hardcoreDayScore(progress);
  const text = hardcoreShareText({
    categoryName,
    date,
    points,
    hardMode: rounds.every((r) => r.record.hard),
    url: typeof window === "undefined" ? undefined : `${window.location.origin}/${category}/hardcore`,
  });

  return (
    <div className="flex flex-col gap-5">
      <Cassette color={color}>
        <div className={`${paperLabel} flex flex-col items-center gap-2 px-3.5 pt-3 pb-4 text-center`}>
          <p className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
            Hardcore de {formatGameDate(date)}
          </p>
          <p className="font-marker text-6xl leading-none tabular-nums">
            {score}/{HARDCORE_MAX_SCORE}
          </p>
          <div className="flex gap-1.5" aria-hidden>
            {points.map((p, i) => (
              <span key={i} className={`h-6 w-6 rounded-md border-2 border-ink ${POINT_COLORS[p]}`} />
            ))}
          </div>
        </div>
      </Cassette>

      <ShareButton text={text} />
      <Countdown />

      <section className="flex flex-col gap-3">
        <h2 className="eyebrow text-accent">Lado B</h2>
        <ol className={`${card} flex flex-col gap-3`}>
          {rounds.map((round, i) => (
            <li key={i} className="flex items-center gap-3">
              <span
                aria-label={POINT_LABELS[points[i]]}
                className={`h-3 w-3 shrink-0 rounded-full border-2 border-ink ${POINT_COLORS[points[i]]}`}
              />
              <AnswerCard answer={round.answer} compact />
            </li>
          ))}
        </ol>
      </section>

      <DailyStatsView
        stats={stats}
        highlight={score}
        title="Estatísticas do Hardcore"
        maxScore={HARDCORE_MAX_SCORE}
      />

      <Link href={`/${category}`} className={secondaryButton}>
        Jogar o desafio diário
      </Link>
    </div>
  );
}
